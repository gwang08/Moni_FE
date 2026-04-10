/**
 * Detects and formats paragraph labels (A, B, C...) in reading passages.
 * Non-destructive: if content is already well-formatted HTML, it enhances it without breaking it.
 *
 * IMPORTANT: Uses <div> instead of <p> for paragraphs because Chrome has a bug
 * where text selection inside <p> elements snaps to include the entire paragraph
 * when dragging across line boundaries (backward selection).
 */

/** Wraps a paragraph letter label */
function boldLabel(letter: string, rest: string): string {
  return `<b style="font-weight:700;margin-right:4px">${letter}</b>${rest}`;
}

/**
 * Converts plain text (double-newline separated) to formatted HTML paragraphs,
 * detecting paragraph labels like "A", "A.", "A. text", "Paragraph A" at the start.
 */
function plainTextToHtml(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      const formatted = applyLabelFormatting(trimmed);
      return `<div class="mb-6">${formatted}</div>`;
    })
    .filter(Boolean)
    .join('');
}

/**
 * Applies bold label formatting to paragraph text.
 */
function applyLabelFormatting(text: string): string {
  // "Paragraph A" at start (case-insensitive)
  const paragraphLabel = text.match(/^(Paragraph\s+)([A-Z])(\s*\n?)([\s\S]*)/i);
  if (paragraphLabel) {
    const [, prefix, letter, sep, rest] = paragraphLabel;
    return `${prefix}${boldLabel(letter, sep + rest)}`;
  }

  // Single capital letter followed by ". " (e.g., "A. The text")
  const dotPattern = text.match(/^([A-Z])(\.)\s+([\s\S]*)/);
  if (dotPattern) {
    const [, letter, dot, rest] = dotPattern;
    return boldLabel(letter, `${dot} ${rest}`);
  }

  // Single capital letter alone on first line (e.g., "A\nThe text")
  const newlinePattern = text.match(/^([A-Z])\n([\s\S]*)/);
  if (newlinePattern) {
    const [, letter, rest] = newlinePattern;
    return boldLabel(letter, `\n${rest}`);
  }

  return text;
}

/** Check if a string contains HTML tags */
function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Enhances existing HTML by:
 * 1. Converting <p> to <div> (prevents Chrome selection snap bug)
 * 2. Replacing <strong> labels with <b> (prevents selection boundary snap)
 * 3. Adding spacing classes
 */
function enhanceHtml(html: string): string {
  // Replace <strong> paragraph labels with <b>
  let result = html.replace(
    /<strong[^>]*class="[^"]*font-bold[^"]*"[^>]*>([A-Z])<\/strong>/g,
    '<b style="font-weight:700;margin-right:4px">$1</b>'
  );

  // Convert <p> to <div> to avoid Chrome selection snapping bug
  result = result.replace(/<p(\s|>)/g, '<div$1');
  result = result.replace(/<\/p>/g, '</div>');

  // Bold single-letter paragraph labels inside <div> tags
  result = result.replace(
    /<div([^>]*)>((?:\s*(?:Paragraph\s+)?[A-Z])(?:[.\s]|\n)[\s\S]*?)<\/div>/g,
    (match, attrs, content) => {
      const trimmed = content.trim();
      const formatted = applyLabelFormatting(trimmed);
      if (formatted !== trimmed) {
        return `<div${attrs}>${formatted}</div>`;
      }
      return match;
    }
  );

  // Add mb-6 spacing to <div> paragraph tags that don't have a mb- class
  result = result.replace(/<div(?![^>]*\bclass=)([^>]*)>/g, (m, attrs) => {
    // Only add mb-6 to divs that look like paragraphs (not wrapper divs)
    if (attrs.includes('style=') || attrs.includes('data-')) return m;
    return `<div class="mb-6"${attrs}>`;
  });

  return result;
}

/**
 * Formats a reading passage for display.
 * - Converts <p> to <div> to prevent Chrome selection bugs
 * - Detects paragraph labels (A, B, C...) and bolds them
 * - Adds spacing between paragraphs
 * - Handles both plain text and HTML content
 */
export function formatReadingPassage(content: string): string {
  if (!content || !content.trim()) return content;

  if (isHtml(content)) {
    return enhanceHtml(content);
  }

  return plainTextToHtml(content);
}
