'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useWritingStore } from '@/store/writing-store';
import { useEffect } from 'react';

interface WritingEditorProps {
  taskPrompt: string;
}

export function WritingEditor({ taskPrompt }: WritingEditorProps) {
  const { setContent, setWordCount } = useWritingStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Bắt đầu viết bài của bạn ở đây...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[400px] focus:outline-none p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      setContent(html);
      setWordCount(wordCount);
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-2">Đề bài</h3>
        <p className="text-gray-700">{taskPrompt}</p>
      </div>

      <div className="bg-white border rounded-lg">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
