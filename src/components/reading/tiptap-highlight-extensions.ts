/**
 * Custom TipTap extensions that preserve data-hl-id and data-note-id attributes
 * injected by inject-highlights.ts. Without these, ProseMirror strips unknown
 * attributes and the highlight context menu (delete/add note) cannot find elements.
 */
import { Mark, Node, mergeAttributes } from '@tiptap/core';

const NOTE_ICON_SVG =
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

/** Preserves <mark data-hl-id="..." style="..."> through TipTap's parse/render cycle */
export const HighlightMark = Mark.create({
  name: 'customHighlight',
  priority: 1000,

  addAttributes() {
    return {
      'data-hl-id': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-hl-id'),
        renderHTML: (attrs) => attrs['data-hl-id'] ? { 'data-hl-id': attrs['data-hl-id'] } : {},
      },
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute('style'),
        renderHTML: (attrs) => attrs.style ? { style: attrs.style } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'mark' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes), 0];
  },
});

/** Preserves <span data-note-id="..." class="note-icon"> as an atomic inline node */
export const NoteIconNode = Node.create({
  name: 'noteIcon',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      'data-note-id': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-note-id'),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span.note-icon' }];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span');
      const noteId = node.attrs['data-note-id'];
      if (noteId) span.setAttribute('data-note-id', noteId);
      span.className = 'note-icon';
      span.style.cssText = 'display:inline-block;margin-left:2px;cursor:pointer;vertical-align:middle;';
      span.innerHTML = NOTE_ICON_SVG;
      return { dom: span };
    };
  },
});
