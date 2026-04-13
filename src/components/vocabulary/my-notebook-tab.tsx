'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, FolderOpen, BookMarked, RefreshCw, Star, BookOpen } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMyLists, createList, deleteList, getReviewStats } from '@/lib/vocab-api';
import type { VocabCollection } from '@/types/vocab.types';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/use-login-prompt';
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog';
import { useRouter } from 'next/navigation';

const T = {
  login_title: '\u0110\u0103ng nh\u1eadp \u0111\u1ec3 xem s\u1ed5 tay c\u1ee7a b\u1ea1n',
  login_desc: 'L\u01b0u t\u1eeb v\u1ef1ng v\u00e0 t\u1ed5 ch\u1ee9c theo b\u1ed9 s\u01b0u t\u1eadp ri\u00eang',
  login_btn: '\u0110\u0103ng nh\u1eadp',
  back: 'Danh s\u00e1ch',
  empty_words: 'Ch\u01b0a c\u00f3 t\u1eeb n\u00e0o. Tra t\u1eeb v\u00e0 l\u01b0u v\u00e0o \u0111\u00e2y!',
  my_notebook: 'S\u1ed5 tay c\u1ee7a t\u00f4i',
  personal_collection: 'B\u1ed9 s\u01b0u t\u1eadp t\u1eeb v\u1ef1ng c\u00e1 nh\u00e2n',
  create_new: 'T\u1ea1o m\u1edbi',
  list_name_placeholder: 'T\u00ean danh s\u00e1ch...',
  create: 'T\u1ea1o',
  cancel: 'H\u1ee7y',
  no_collections: 'Ch\u01b0a c\u00f3 b\u1ed9 s\u01b0u t\u1eadp n\u00e0o',
  word_unit: 't\u1eeb',
  created_list: (name: string) => `\u0110\u00e3 t\u1ea1o danh s\u00e1ch "${name}"`,
  deleted_list: (name: string) => `\u0110\u00e3 x\u00f3a danh s\u00e1ch "${name}"`,
};

export function MyNotebookTab() {
  const { showPrompt, setShowPrompt, requireAuth, isAuthenticated: isLoggedIn } = useLoginPrompt();
  const router = useRouter();
  const [collections, setCollections] = useState<VocabCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [newListTitle, setNewListTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ toLearn: number; reviewing: number; mastered: number; manual: number } | null>(null);

  const loadCollections = useCallback(async () => {
    try {
      const lists = await getMyLists();
      setCollections(lists);
    } catch {
      // silently fail
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadCollections();
      getReviewStats().then(s => setReviewStats({
        toLearn: s.toLearn ?? 0,
        reviewing: s.reviewing ?? 0,
        mastered: s.mastered ?? 0,
        manual: s.manual ?? 0,
      })).catch(() => {});
    } else {
      setLoadingCollections(false);
    }
  }, [isLoggedIn, loadCollections]);

  const handleSelectList = (list: VocabCollection) => {
    // Store list data in sessionStorage for the detail page to use
    try {
      sessionStorage.setItem(`vocab-list-${list.id}`, JSON.stringify(list));
    } catch (e) {
      // Ignore sessionStorage errors
    }
    router.push(`/vocabulary/notebook/${list.id}`);
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
      toast.success(T.created_list(newList.title));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setCreatingList(false);
    }
  };

  const handleDeleteList = async (list: VocabCollection) => {
    try {
      await deleteList(list.id);
      setCollections((prev) => prev.filter((c) => c.id !== list.id));
      toast.success(T.deleted_list(list.title));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleWordDeleted = (id: number) => {
    // Reload collections to update word counts
    loadCollections();
  };

  if (!isLoggedIn) {
    return (
      <div className="text-center py-16 space-y-5">
        <ChibiAnimationStyles />
        <ChibiMascot mood="worried" size={80} />
        <div>
          <p className="text-lg text-gray-600 font-semibold">{T.login_title}</p>
          <p className="text-sm text-gray-400 mt-1">{T.login_desc}</p>
        </div>
        <Button
          onClick={() => requireAuth(() => {})}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6"
        >
          {T.login_btn}
        </Button>
        <LoginPromptDialog open={showPrompt} onOpenChange={setShowPrompt} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{T.my_notebook}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{T.personal_collection}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowNewListInput(true)}
          className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {T.create_new}
        </Button>
      </div>

      {/* System Notebooks */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sổ hệ thống</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Sổ từ của tôi - Manual saved words */}
          <div
            onClick={() => router.push('/vocabulary/notebook/system?status=manual')}
            className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-50/30 p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center rounded-xl p-2.5 bg-indigo-100 text-indigo-600">
                <BookOpen className="h-5 w-5" />
              </span>
              <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">Sổ từ của tôi</p>
            </div>
            <p className="text-xs text-gray-500">Từ tự lưu thủ công</p>
            <p className="text-2xl font-black text-indigo-600 mt-2">{reviewStats?.manual ?? '—'}</p>
          </div>

          {/* Sổ từ biết tuốt - DRAFT words */}
          <div
            onClick={() => router.push('/vocabulary/notebook/system?status=draft')}
            className="group rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-rose-50/30 p-5 cursor-pointer hover:shadow-md hover:border-rose-200 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center rounded-xl p-2.5 bg-rose-100 text-rose-600">
                <BookMarked className="h-5 w-5" />
              </span>
              <p className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors text-sm">Sổ từ biết tuốt</p>
            </div>
            <p className="text-xs text-gray-500">Chưa học — sẽ ôn lại</p>
            <p className="text-2xl font-black text-rose-500 mt-2">{reviewStats?.toLearn ?? '—'}</p>
          </div>

          {/* Sổ tay nhắc lại - ACTIVE words */}
          <div
            onClick={() => router.push('/vocabulary/notebook/system?status=active')}
            className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-50/30 p-5 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center rounded-xl p-2.5 bg-amber-100 text-amber-600">
                <RefreshCw className="h-5 w-5" />
              </span>
              <p className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors text-sm">Sổ tay nhắc lại</p>
            </div>
            <p className="text-xs text-gray-500">Đang ôn luyện</p>
            <p className="text-2xl font-black text-amber-500 mt-2">{reviewStats?.reviewing ?? '—'}</p>
          </div>

          {/* Sổ tay master - MASTERED words */}
          <div
            onClick={() => router.push('/vocabulary/notebook/system?status=mastered')}
            className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-50/30 p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center rounded-xl p-2.5 bg-emerald-100 text-emerald-600">
                <Star className="h-5 w-5" />
              </span>
              <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-sm">Sổ tay Master</p>
            </div>
            <p className="text-xs text-gray-500">Từ dã thành thạo</p>
            <p className="text-2xl font-black text-emerald-500 mt-2">{reviewStats?.mastered ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sổ cá nhân</h3>
          <Button
            size="sm"
            onClick={() => setShowNewListInput(true)}
            className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {T.create_new}
          </Button>
        </div>

        {showNewListInput && (
          <div className="flex gap-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <Input
              placeholder={T.list_name_placeholder}
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              autoFocus
              className="rounded-xl border-indigo-200 focus:ring-indigo-200"
            />
            <Button
              onClick={handleCreateList}
              disabled={creatingList || !newListTitle.trim()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              {creatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : T.create}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setShowNewListInput(false); setNewListTitle(''); }}
              className="rounded-xl"
            >
              {T.cancel}
            </Button>
          </div>
        )}

        {loadingCollections ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-10">
            <ChibiAnimationStyles />
            <ChibiMascot mood="thinking" size={72} />
            <p className="text-gray-400 mt-3 font-medium">{T.no_collections}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collections.map((col) => (
              <div
                key={col.id}
                className="group rounded-2xl border border-gray-100 bg-white p-5 sm:p-6
                  shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200
                  cursor-pointer"
                onClick={() => handleSelectList(col)}
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center rounded-xl p-3
                    bg-indigo-50 text-indigo-500 shrink-0">
                    <FolderOpen className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base
                      group-hover:text-indigo-600 transition-colors">
                      {col.title}
                    </p>
                    {col.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{col.description}</p>
                    )}
                    <p className="text-sm text-gray-400 font-medium mt-2">
                      {col.wordCount} {T.word_unit}
                    </p>
                  </div>
                  {!col.isDefault && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteList(col); }}
                      className="shrink-0 p-2 rounded-xl text-gray-300 hover:text-red-500
                        hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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
    </div>
  );
}
