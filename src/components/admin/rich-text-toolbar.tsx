'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  List, ListOrdered, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link, Unlink, Image, Undo2, Redo2,
  Subscript, Superscript, RemoveFormatting, Table, Trash2,
  Heading1, Heading2, Heading3,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { uploadMedia } from '@/lib/admin-api';

interface Props {
  editor: Editor | null;
  // Thông báo cho parent form biết đang upload ảnh (để disable nút Lưu, tránh lưu blob URL)
  onUploadingChange?: (uploading: boolean) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors ${
        active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5" />;
}

export function RichTextToolbar({ editor, onUploadingChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploadingState] = useState(false);
  const setUploading = useCallback((v: boolean) => {
    setUploadingState(v);
    onUploadingChange?.(v);
  }, [onUploadingChange]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = '';

    const localUrl = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: localUrl, alt: 'Đang tải...' }).run();
    setUploading(true);

    try {
      const url = await uploadMedia(file);
      const { state } = editor.view;
      const { tr } = state;
      let replaced = false;
      state.doc.descendants((node, pos) => {
        if (!replaced && node.type.name === 'image' && node.attrs.src === localUrl) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url, alt: '' });
          replaced = true;
        }
      });
      if (replaced) editor.view.dispatch(tr);
      URL.revokeObjectURL(localUrl);
    } catch {
      editor.commands.undo();
      alert('Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Nhập URL:', 'https://');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
  }, [editor]);

  if (!editor) return null;

  const s = 16; // icon size

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 rounded-t-md">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác">
        <Undo2 size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại">
        <Redo2 size={s} />
      </ToolbarButton>

      <Separator />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={s} />
      </ToolbarButton>

      <Separator />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Đậm">
        <Bold size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Nghiêng">
        <Italic size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Gạch chân">
        <Underline size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Gạch ngang">
        <Strikethrough size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Chỉ số dưới">
        <Subscript size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Chỉ số trên">
        <Superscript size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Xóa định dạng">
        <RemoveFormatting size={s} />
      </ToolbarButton>

      <Separator />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách">
        <List size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách đánh số">
        <ListOrdered size={s} />
      </ToolbarButton>

      <Separator />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Canh trái">
        <AlignLeft size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Canh giữa">
        <AlignCenter size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Canh phải">
        <AlignRight size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Canh đều">
        <AlignJustify size={s} />
      </ToolbarButton>

      <Separator />

      {/* Block elements */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn">
        <Quote size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
        <Code size={s} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang">
        <Minus size={s} />
      </ToolbarButton>

      <Separator />

      {/* Insert */}
      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Chèn link">
        <Link size={s} />
      </ToolbarButton>
      {editor.isActive('link') && (
        <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Bỏ link">
          <Unlink size={s} />
        </ToolbarButton>
      )}
      <ToolbarButton onClick={addImage} disabled={uploading} title={uploading ? 'Đang tải ảnh...' : 'Chèn ảnh'}>
        {uploading ? <Loader2 size={s} className="animate-spin" /> : <Image size={s} />}
      </ToolbarButton>
      <ToolbarButton onClick={addTable} title="Chèn bảng">
        <Table size={s} />
      </ToolbarButton>
      {editor.isActive('table') && (
        <ToolbarButton onClick={deleteTable} title="Xóa bảng">
          <Trash2 size={s} className="text-red-500" />
        </ToolbarButton>
      )}
    </div>
  );
}
