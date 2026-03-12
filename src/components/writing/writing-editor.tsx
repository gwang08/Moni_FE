'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useWritingStore } from '@/store/writing-store';
import { useEffect } from 'react';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingEditorProps {
  taskType?: WritingTaskType;
}

const PLACEHOLDER_BY_TASK: Record<number, string> = {
  1: 'Bắt đầu với phần Mở bài - paraphrase đề bài...',
  2: 'Bắt đầu với phần Mở bài - giới thiệu chủ đề và luận điểm...',
};

// Paragraph structure info shown above editor (read-only guide)
const PARA_LABELS: Record<number, string[]> = {
  1: ['Mở bài', 'Tổng quan', 'Thân bài 1', 'Thân bài 2'],
  2: ['Mở bài', 'Thân bài 1', 'Thân bài 2', 'Kết bài'],
};

export function WritingEditor({ taskType = 2 }: WritingEditorProps) {
  const { setContent, setWordCount } = useWritingStore();
  const labels = PARA_LABELS[taskType] ?? PARA_LABELS[2];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: PLACEHOLDER_BY_TASK[taskType] ?? 'Bắt đầu viết bài của bạn ở đây...',
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[500px] focus:outline-none p-4 text-gray-800',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
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
    <div className="h-full flex flex-col">
      {/* Paragraph structure labels */}
      <div className="px-4 pt-3 pb-2 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
        {labels.map((label, idx) => (
          <span key={idx} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            {idx + 1}. {label}
          </span>
        ))}
      </div>

      {/* Editor area */}
      <div className="flex-1 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
