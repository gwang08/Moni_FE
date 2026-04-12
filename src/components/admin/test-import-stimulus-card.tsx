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

function cleanHtml(html: string): string {
  const tdContents: string[] = [];
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = tdRegex.exec(html)) !== null) {
    const inner = match[1].trim();
    if (inner && inner !== '<p></p>' && inner !== '<p><br></p>') {
      tdContents.push(inner);
    }
  }
  if (tdContents.length > 0) {
    return tdContents.join('');
  }
  return html;
}

interface Props {
  stimulus: StimulusRequest;
  onChange: (updated: StimulusRequest) => void;
}

const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    bulletList: { HTMLAttributes: { class: 'list-disc pl-6 space-y-1 my-2' } },
    orderedList: { HTMLAttributes: { class: 'list-decimal pl-6 space-y-1 my-2' } },
  }),
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

export function StimulusCard({ stimulus, onChange }: Props) {
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: stimulus.content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none h-full min-h-full flex-1 focus:outline-none',
      },
      transformPastedHTML: (html) => cleanHtml(html),
    },
    onUpdate: ({ editor: ed }) => {
      onChange({ ...stimulus, content: ed.getHTML() });
    },
  });

  // Sync external content changes (e.g., auto-filled from transcript)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (stimulus.content && stimulus.content !== currentHtml) {
      editor.commands.setContent(stimulus.content, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimulus.content]);

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-input bg-white">
        <RichTextToolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="min-h-0 flex-1 overflow-y-auto [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-4"
        />
      </div>
    </div>
  );
}
