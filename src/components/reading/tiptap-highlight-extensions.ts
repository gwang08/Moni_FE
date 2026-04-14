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

/** Atomic inline node used to render matching-heading slots inside the passage */
export const MatchingSlotNode = Node.create({
  name: 'matchingSlot',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      'data-matching-slot': { default: '1' },
      'data-question-id': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-question-id'),
      },
      'data-question-position': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-question-position'),
      },
      'data-label': {
        default: '',
        parseHTML: (el) => el.getAttribute('data-label') || '',
      },
      'data-answer': {
        default: '',
        parseHTML: (el) => el.getAttribute('data-answer') || '',
      },
      'data-placeholder': {
        default: '',
        parseHTML: (el) => el.getAttribute('data-placeholder') || '',
      },
      'data-state': {
        default: 'empty',
        parseHTML: (el) => el.getAttribute('data-state') || 'empty',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-matching-slot]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ({ node }) => {
      const root = document.createElement('span');
      root.className = 'matching-slot';
      root.contentEditable = 'false';
      root.setAttribute('data-matching-slot', '1');

      const badge = document.createElement('span');
      badge.className = 'matching-slot-badge';
      root.appendChild(badge);

      const body = document.createElement('span');
      body.className = 'matching-slot-body';
      const answerText = document.createElement('span');
      answerText.className = 'matching-slot-answer';
      body.appendChild(answerText);
      root.appendChild(body);

      const setAttr = (name: string, value: unknown) => {
        if (value == null || value === '') return;
        root.setAttribute(name, String(value));
      };

      setAttr('data-question-id', node.attrs['data-question-id']);
      setAttr('data-question-position', node.attrs['data-question-position']);
      setAttr('data-label', node.attrs['data-label'] || '');
      setAttr('data-answer', node.attrs['data-answer'] || '');
      setAttr('data-placeholder', node.attrs['data-placeholder'] || '');
      setAttr('data-state', node.attrs['data-state'] || 'empty');

      const syncContent = (updatedNode = node) => {
        const position = updatedNode.attrs['data-question-position'];
        badge.textContent = position != null ? String(position) : '';
        const answer = updatedNode.attrs['data-answer'] || '';
        answerText.textContent = answer;
        body.setAttribute('data-has-answer', answer ? '1' : '0');
      };

      syncContent();

      const clearButton = document.createElement('button');
      clearButton.type = 'button';
      clearButton.setAttribute('data-clear-matching-answer', '1');
      clearButton.setAttribute('aria-label', 'Clear matching answer');
      body.appendChild(clearButton);

      return {
        dom: root,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'matchingSlot') return false;
          setAttr('data-question-id', updatedNode.attrs['data-question-id']);
          setAttr('data-question-position', updatedNode.attrs['data-question-position']);
          setAttr('data-label', updatedNode.attrs['data-label'] || '');
          setAttr('data-answer', updatedNode.attrs['data-answer'] || '');
          setAttr('data-placeholder', updatedNode.attrs['data-placeholder'] || '');
          setAttr('data-state', updatedNode.attrs['data-state'] || 'empty');
          syncContent(updatedNode);
          return true;
        },
      };
    };
  },
});
