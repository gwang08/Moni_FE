'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, BookOpen, ChevronLeft, FolderOpen } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabWordRow } from './vocab-word-row';
import { getMyLists, getMyWords, createList, deleteList } from '@/lib/vocab-api';
import type { VocabCollection, VocabWord } from '@/types/vocab.types';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/use-login-prompt';
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog';

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
      // silently fail
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadCollections();
    else setLoadingCollections(false);
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
      if (selectedList?.id === list.id) setSelectedList(null);
      toast.success(T.deleted_list(list.title));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleWordDeleted = (id: number) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
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

  if (selectedList) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedList(null)}
            className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
            {T.back}
          </Button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg
              bg-indigo-50 text-indigo-500">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-bold text-gray-800">{selectedList.title}</span>
          </div>
          {!loadingWords && (
            <span className="ml-auto text-sm text-gray-400 font-medium bg-gray-50
              px-3 py-1 rounded-lg">
              {words.length} {T.word_unit}
            </span>
          )}
        </div>

        {loadingWords ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-16">
            <ChibiAnimationStyles />
            <ChibiMascot mood="thinking" size={72} />
            <p className="text-gray-400 mt-3 font-medium">{T.empty_words}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {words.map((w) => (
              <VocabWordRow key={w.id} word={w} onDelete={handleWordDeleted} />
            ))}
          </div>
        )}
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
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16">
          <ChibiAnimationStyles />
          <ChibiMascot mood="thinking" size={72} />
          <p className="text-gray-400 mt-3 font-medium">{T.no_collections}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group rounded-2xl border border-gray-100 bg-warm-white p-5 sm:p-6
                shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center rounded-xl p-3
                  bg-indigo-50 text-indigo-500 shrink-0">
                  <FolderOpen className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleSelectList(col)}
                    className="text-left w-full"
                  >
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
                  </button>
                </div>
                {!col.isDefault && (
                  <button
                    onClick={() => handleDeleteList(col)}
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
  );
}
