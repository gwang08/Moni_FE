'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { RichTextToolbar } from '@/components/admin/rich-text-toolbar';
import type { StimulusRequest } from '@/types/admin.types';
import { useEffect } from 'react';

interface Props {
  stimulus: StimulusRequest;
  index: number;
  onChange: (updated: StimulusRequest) => void;
}

const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({ placeholder: 'Nhập nội dung đoạn văn / bài nghe...' }),
  Underline,
  Subscript,
  Superscript,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  LinkExtension.configure({ openOnClick: false }),
  ImageExtension,
  TableExtension.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
];

export function StimulusCard({ stimulus, index, onChange }: Props) {
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: stimulus.content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] focus:outline-none p-4',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange({ ...stimulus, content: ed.getHTML() });
    },
  });

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  return (
    <div className="space-y-3">
      <div className="border border-input rounded-md bg-white overflow-hidden">
        <RichTextToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
