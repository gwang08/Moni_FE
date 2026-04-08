'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Copy, BookmarkPlus, MessageSquareText, Link2, Quote, ChevronDown, Plus } from 'lucide-react';
import { lookupVocab, saveWord, getMyLists, createList, type VocabLookupResult } from '@/lib/vocab-api';
import type { VocabCollection } from '@/types/vocab.types';
import { toast } from 'sonner';

interface Props {
  word: string;
  sentence?: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function VocabPopup({ word, sentence, position, onClose }: Props) {
  const [data, setData] = useState<VocabLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Vocab list state
  const [vocabLists, setVocabLists] = useState<VocabCollection[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | undefined>();
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    lookupVocab(word, sentence, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.message || 'Không thể tra từ. Thử lại sau.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, [word, sentence]);

  // Fetch vocab lists when popup opens
  useEffect(() => {
    setLoadingLists(true);
    getMyLists()
      .then((lists) => {
        setVocabLists(lists);
        // Default to default list
        const defaultList = lists.find(l => l.isDefault);
        if (defaultList) setSelectedListId(defaultList.id);
      })
      .catch(() => {})
      .finally(() => setLoadingLists(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(word);
    toast.success('Đã sao chép');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWord(word, sentence, selectedListId);
      setSaved(true);
      const listName = vocabLists.find(l => l.id === selectedListId)?.title || 'sổ từ';
      toast.success(`Đã lưu từ "${word}" vào ${listName}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu từ');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    setCreatingList(true);
    try {
      const newList = await createList(newListTitle.trim());
      setVocabLists(prev => [...prev, newList]);
      setSelectedListId(newList.id);
      setShowCreateDialog(false);
      setNewListTitle('');
      toast.success(`Đã tạo danh sách "${newList.title}"`);
    } catch {
      toast.error('Không thể tạo danh sách');
    } finally {
      setCreatingList(false);
    }
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 380),
    top: Math.min(position.y + 10, window.innerHeight - 460),
    zIndex: 50,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Create List Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCreateDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-[320px] p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Tạo danh sách mới</h3>
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Tên danh sách..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateList(); if (e.key === 'Escape') setShowCreateDialog(false); }}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700
                  hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateList}
                disabled={creatingList || !newListTitle.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600
                  hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50
                  flex items-center gap-1"
              >
                {creatingList ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={style} className="w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with word info */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {loading ? (
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
              ) : data ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-bold text-gray-900">{data.word}</span>
                    {data.phonetic && (
                      <span className="text-sm text-blue-600 font-mono">{data.phonetic}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {data.pos && (
                      <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{data.pos}</span>
                    )}
                    <span className="text-[15px] font-semibold text-emerald-600">{data.meaning}</span>
                  </div>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">{word}</span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button onClick={handleCopy} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors" title="Sao chép">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Save section with vocab list selector */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="space-y-2">
            {/* Vocab list selector */}
            <div className="relative">
              <button
                onClick={() => setShowListDropdown(!showListDropdown)}
                disabled={loadingLists}
                className="w-full flex items-center justify-between px-3 py-2 text-sm
                  bg-white border border-gray-200 rounded-lg hover:border-indigo-300
                  transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-500">📒</span>
                  <span className="text-gray-700 truncate">
                    {loadingLists
                      ? 'Đang tải danh sách...'
                      : vocabLists.find(l => l.id === selectedListId)?.title || 'Chọn danh sách'
                    }
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showListDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showListDropdown && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setShowListDropdown(false)} />
                  <div className="absolute z-[55] w-full mt-1 bg-white border border-gray-200
                    rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {vocabLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => { setSelectedListId(list.id); setShowListDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50
                          transition-colors text-left ${selectedListId === list.id ? 'bg-indigo-50' : ''}`}
                      >
                        <span>{list.icon || '📒'}</span>
                        <span className="flex-1 text-gray-700 truncate">{list.title}</span>
                        {list.isDefault && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Mặc định</span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => { setShowListDropdown(false); setShowCreateDialog(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50
                        transition-colors text-left border-t border-gray-100 text-indigo-600"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tạo danh sách mới...</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || saved || loadingLists}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                transition-colors
                ${saved
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-60`}
            >
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : saved
                  ? '✓ Đã lưu'
                  : <><BookmarkPlus className="h-4 w-4" /> Lưu từ vựng</>
              }
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-3 max-h-[340px] overflow-y-auto custom-scrollbar-thick space-y-3">
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="flex items-center justify-center pt-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-xs text-gray-400 ml-2">Đang tra từ...</span>
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          ) : data ? (
            <>
              {/* Collocation */}
              {data.collocation && (
                <div className="flex gap-2">
                  <Link2 className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cụm từ liên quan</p>
                    <p className="text-[13px] text-gray-700 mt-0.5">{data.collocation}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {data.explanation && (
                <div className="flex gap-2">
                  <MessageSquareText className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Giải thích</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">{data.explanation}</p>
                  </div>
                </div>
              )}

              {/* Examples */}
              {data.examples && data.examples.length > 0 && (
                <div className="flex gap-2">
                  <Quote className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ví dụ</p>
                    <ul className="mt-1 space-y-1.5">
                      {data.examples.map((ex, i) => (
                        <li key={i} className="text-[13px] text-gray-600 leading-relaxed pl-3 border-l-2 border-teal-200">{ex}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
