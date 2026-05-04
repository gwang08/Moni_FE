'use client';

import Paragraph from '@tiptap/extension-paragraph';
import { mergeAttributes } from '@tiptap/core';

/**
 * Paragraph node that preserves listening transcript metadata.
 * Tiptap strips unknown attributes unless the node schema declares them.
 */
export const ListeningTranscriptParagraph = Paragraph.extend({
  name: 'paragraph',

  addAttributes() {
    return {
      dataTranscriptSegment: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-transcript-segment'),
        renderHTML: (attributes) => {
          if (attributes.dataTranscriptSegment == null) return {};
          return { 'data-transcript-segment': attributes.dataTranscriptSegment };
        },
      },
      dataStartTime: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-start-time'),
        renderHTML: (attributes) => {
          if (attributes.dataStartTime == null) return {};
          return { 'data-start-time': attributes.dataStartTime };
        },
      },
      dataEndTime: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-end-time'),
        renderHTML: (attributes) => {
          if (attributes.dataEndTime == null) return {};
          return { 'data-end-time': attributes.dataEndTime };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },
});
