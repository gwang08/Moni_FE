/**
 * Detects and formats paragraph labels (A, B, C...) in reading passages.
 * Non-destructive: if content is already well-formatted HTML, it enhances it without breaking it.
 */

const BOLD_LABEL_CLASS = 'font-bold text-lg';

/** Wraps a paragraph letter label in a bold span */
function boldLabel(letter: string, rest: string): string {
  return `<strong class="${BOLD_LABEL_CLASS}">${letter}</strong>${rest}`;
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
 * Handles patterns:
 *   - "A\nText..." (letter alone on first line)
 *   - "A. Text..."
 *   - "A Text..." (letter followed by space + content)
 *   - "Paragraph A\nText..."
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
 * 1. Bolding paragraph labels in <p> tags
 * 2. Adding spacing wrapper divs around <p> tags without mb-* classes
 */
function enhanceHtml(html: string): string {
  // Bold single-letter paragraph labels inside <p> tags
  // Handles: <p>A. text</p>, <p>A\ntext</p>
  let result = html.replace(
    /<p([^>]*)>((?:\s*(?:Paragraph\s+)?[A-Z])(?:[.\s]|\n)[\s\S]*?)<\/p>/g,
    (match, attrs, content) => {
      const trimmed = content.trim();
      const formatted = applyLabelFormatting(trimmed);
      // Only inject wrapper if not already wrapped
      if (formatted !== trimmed) {
        return `<p${attrs}>${formatted}</p>`;
      }
      return match;
    }
  );

  // Add mb-6 spacing to <p> tags that don't have a mb- class
  result = result.replace(/<p(?![^>]*\bclass=)([^>]*)>/g, '<p class="mb-6"$1>');
  result = result.replace(/<p([^>]*class="(?![^"]*\bmb-)[^"]*")([^>]*)>/g, (m, cls, rest) =>
    m.replace(/class="/, 'class="mb-6 ')
  );

  return result;
}

/**
 * Formats a reading passage for display.
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
