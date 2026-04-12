import type { Highlight } from '@/types/reading.types';

const COLOR_CLASSES: Record<string, string> = {
  yellow: 'background-color: #fef08a',
  green: 'background-color: #bbf7d0',
  blue: 'background-color: #bfdbfe',
};

const NOTE_ICON_SVG =
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

/** Build a mapping from plain-text offset → HTML string index, skipping tags & decoding entities */
function buildTextToHtmlMap(html: string): number[] {
  const map: number[] = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    if (html[i] === '&') {
      const semi = html.indexOf(';', i);
      if (semi !== -1 && semi - i < 10) {
        map.push(i);
        i = semi + 1;
        continue;
      }
    }
    map.push(i);
    i++;
  }
  map.push(html.length);
  return map;
}

/**
 * Inject highlight <mark> tags into HTML using precise text offsets.
 *
 * Each highlight is split into two point-insertions (open at start, close at end).
 * All insertions are collected then applied in descending position order so that
 * lower-position inserts never slice through tags inserted at higher positions —
 * this prevents broken HTML when highlights overlap or one contains another.
 */
export function injectHighlights(html: string, highlights: Highlight[]): string {
  if (!highlights.length) return html;

  const map = buildTextToHtmlMap(html);

  // priority decides ordering when two insertions share the same position:
  // higher priority is iterated first → ends up further RIGHT in the final string
  // (because each insert pushes earlier inserts rightward).
  // We want order: prevClose, newOpen at a shared boundary, so opens get higher priority.
  type Insertion = { pos: number; text: string; priority: number };
  const insertions: Insertion[] = [];

  for (const hl of highlights) {
    const start = map[hl.startOffset];
    const end = map[hl.endOffset];
    if (start === undefined || end === undefined || start >= end) continue;

    const noteIcon = hl.note
      ? `<span data-note-id="${hl.id}" class="note-icon" style="display:inline-block;margin-left:2px;cursor:pointer;vertical-align:middle;">${NOTE_ICON_SVG}</span>`
      : '';
    const style = COLOR_CLASSES[hl.color] || COLOR_CLASSES.yellow;
    const openTag = `<mark data-hl-id="${hl.id}" style="${style}; border-radius: 2px; padding: 0 2px; cursor: pointer;">`;

    insertions.push({ pos: start, text: openTag, priority: 1 });
    insertions.push({ pos: end, text: '</mark>' + noteIcon, priority: 0 });
  }

  insertions.sort((a, b) => b.pos - a.pos || b.priority - a.priority);

  let result = html;
  for (const ins of insertions) {
    result = result.slice(0, ins.pos) + ins.text + result.slice(ins.pos);
  }

  return result;
}
