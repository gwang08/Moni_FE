export interface EvidenceEntry { text: string; offset: number }

/** Highlight evidence snippets in a DOM element using TreeWalker.
 *  offset >= 0 → only at that position; offset = -1 → first occurrence */
export function applyHighlights(el: HTMLElement, entries: EvidenceEntry[]) {
  if (!entries.length) return;

  // Collect text nodes + build full text
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  let fullText = '';
  const nodeStarts: number[] = [];
  for (const node of textNodes) {
    nodeStarts.push(fullText.length);
    fullText += node.textContent || '';
  }

  // Find all highlight ranges
  const ranges: { start: number; end: number }[] = [];
  for (const { text, offset } of entries) {
    if (offset >= 0) {
      const idx = fullText.indexOf(text, Math.max(0, offset - 10));
      if (idx !== -1 && Math.abs(idx - offset) <= 10) {
        ranges.push({ start: idx, end: idx + text.length });
      }
    } else {
      // offset = -1: find first occurrence only
      const idx = fullText.indexOf(text);
      if (idx !== -1) ranges.push({ start: idx, end: idx + text.length });
    }
  }
  if (!ranges.length) return;

  // Process from end→start to avoid invalidating positions
  ranges.sort((a, b) => b.start - a.start);

  for (const hl of ranges) {
    for (let ni = textNodes.length - 1; ni >= 0; ni--) {
      const node = textNodes[ni];
      const ns = nodeStarts[ni];
      const nodeLen = node.length;
      if (ns + nodeLen <= hl.start || ns >= hl.end) continue;

      const hlStart = Math.max(0, hl.start - ns);
      const hlEnd = Math.min(nodeLen, hl.end - ns);
      const content = node.textContent!;
      const parent = node.parentNode!;

      const mark = document.createElement('mark');
      mark.className = 'bg-yellow-200 rounded px-0.5 ev-hl';
      mark.textContent = content.slice(hlStart, hlEnd);

      const after = content.slice(hlEnd);
      if (after) parent.insertBefore(document.createTextNode(after), node.nextSibling);
      parent.insertBefore(mark, node.nextSibling);
      if (hlStart > 0) {
        node.textContent = content.slice(0, hlStart);
      } else {
        parent.removeChild(node);
      }
    }
  }
}
