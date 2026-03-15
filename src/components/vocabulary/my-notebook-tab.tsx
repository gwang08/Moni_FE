'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, BookOpen, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { VocabWordRow } from './vocab-word-row';
import { getMyLists, getMyWords, createList, deleteList } from '@/lib/vocab-api';
import type { VocabCollection, VocabWord } from '@/types/vocab.types';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/use-login-prompt';
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog';

export function MyNotebookTab() {
  const { showPrompt, setShowPrompt, requireAuth, isAuthenticated: isLoggedIn } = useLoginPrompt();
  const [collections, setCollections] = useState<VocabCollection[]>([]);
  const [selectedList, setSelectedList] = useState<VocabCollection | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [showNewListInput, setShowNewListInput] = useState(false);

  const loadCollections = useCallback(async () => {
    try {
      const lists = await getMyLists();
      setCollections(lists);
    } catch {
      // silently fail — user may not be logged in
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadCollections();
    } else {
      setLoadingCollections(false);
    }
  }, [isLoggedIn, loadCollections]);

  const handleSelectList = async (list: VocabCollection) => {
    setSelectedList(list);
    setLoadingWords(true);
    setWords([]);
    try {
      const page = await getMyWords(0, 100, list.id);
      setWords(page.content);
    } catch {
      setWords([]);
    } finally {
      setLoadingWords(false);
    }
  };

  const handleCreateList = async () => {
    const title = newListTitle.trim();
    if (!title) return;
    setCreatingList(true);
    try {
      const newList = await createList(title);
      setCollections((prev) => [...prev, newList]);
      setNewListTitle('');
      setShowNewListInput(false);
      toast.success(`Đã tạo danh sách "${newList.title}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo danh sách');
    } finally {
      setCreatingList(false);
    }
  };

  const handleDeleteList = async (list: VocabCollection) => {
    try {
      await deleteList(list.id);
      setCollections((prev) => prev.filter((c) => c.id !== list.id));
      if (selectedList?.id === list.id) setSelectedList(null);
      toast.success(`Đã xóa danh sách "${list.title}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa danh sách');
    }
  };

  const handleWordDeleted = (id: number) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <div className="text-center py-16 space-y-4">
        <FolderOpen className="h-12 w-12 mx-auto text-gray-300" />
        <div>
          <p className="text-gray-600 font-medium">Đăng nhập để xem sổ tay của bạn</p>
          <p className="text-sm text-gray-400 mt-1">Lưu từ vựng và tổ chức theo bộ sưu tập riêng</p>
        </div>
        <Button onClick={() => requireAuth(() => {})}>Đăng nhập</Button>
        <LoginPromptDialog open={showPrompt} onOpenChange={setShowPrompt} />
      </div>
    );
  }

  if (selectedList) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedList(null)} className="gap-1">
            <BookOpen className="h-4 w-4" />
            Danh sách
          </Button>
          <span className="font-semibold text-gray-800">
            {selectedList.icon} {selectedList.title}
          </span>
          {!loadingWords && (
            <Badge variant="secondary" className="ml-auto">{words.length} từ</Badge>
          )}
        </div>

        {loadingWords ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : words.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Chưa có từ nào. Tra từ và lưu vào đây!</p>
        ) : (
          <div className="space-y-2">
            {words.map((w) => (
              <VocabWordRow key={w.id} word={w} onDelete={handleWordDeleted} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Bộ sưu tập của bạn</p>
        <Button size="sm" variant="outline" onClick={() => setShowNewListInput(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </div>

      {showNewListInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Tên danh sách..."
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            autoFocus
          />
          <Button onClick={handleCreateList} disabled={creatingList || !newListTitle.trim()}>
            {creatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tạo'}
          </Button>
          <Button variant="ghost" onClick={() => { setShowNewListInput(false); setNewListTitle(''); }}>
            Hủy
          </Button>
        </div>
      )}

      {loadingCollections ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có bộ sưu tập nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{col.icon ?? '📁'}</span>
                <div className="flex-1 min-w-0">
                  <button onClick={() => handleSelectList(col)} className="text-left w-full">
                    <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {col.title}
                    </p>
                    {col.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{col.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {col.wordCount} từ
                    </Badge>
                  </button>
                </div>
                {!col.isDefault && (
                  <button
                    onClick={() => handleDeleteList(col)}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Xóa danh sách"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
