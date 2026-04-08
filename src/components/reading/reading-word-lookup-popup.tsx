'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, BookmarkPlus, Check, ExternalLink, ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lookupVocab, saveWord, getMyLists, createList, type VocabLookupResult } from '@/lib/vocab-api';
import type { VocabCollection } from '@/types/vocab.types';
import { toast } from 'sonner';

interface Props {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

/** Clamps popup so it never goes off-screen */
function resolveStyle(x: number, y: number): React.CSSProperties {
  if (typeof window === 'undefined') return { position: 'fixed', left: x, top: y, zIndex: 60 };
  const W = 300;
  const left = Math.min(Math.max(x - W / 2, 8), window.innerWidth - W - 8);
  const top = y + 14 + 240 > window.innerHeight ? y - 254 : y + 14;
  return { position: 'fixed', left, top, zIndex: 60, width: W };
}

export function ReadingWordLookupPopup({ word, position, onClose }: Props) {
  const router = useRouter();
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
    setData(null);
    setSaved(false);

    lookupVocab(word, undefined, controller.signal)
      .then(res => { if (!controller.signal.aborted) setData(res); })
      .catch(err => { if (!controller.signal.aborted) setError(err?.message || 'Không thể tra từ.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [word]);

  // Fetch vocab lists when popup opens
  useEffect(() => {
    setLoadingLists(true);
    getMyLists()
      .then((lists) => {
        setVocabLists(lists);
        const defaultList = lists.find(l => l.isDefault);
        if (defaultList) setSelectedListId(defaultList.id);
      })
      .catch(() => {})
      .finally(() => setLoadingLists(false));
  }, []);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await saveWord(word, undefined, selectedListId);
      setSaved(true);
      const listName = vocabLists.find(l => l.id === selectedListId)?.title || 'sổ từ';
      toast.success(`Đã lưu "${word}" vào ${listName}`);
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

  const handleViewDetail = () => {
    onClose();
    router.push(`/vocabulary?q=${encodeURIComponent(word)}`);
  };

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Create List Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
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

      <div
        style={resolveStyle(position.x, position.y)}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden
          animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              ) : data ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-900">{data.word}</span>
                    {data.phonetic && (
                      <span className="text-xs text-blue-500 font-mono">{data.phonetic}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {data.pos && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {data.pos}
                      </span>
                    )}
                    {data.meaning && (
                      <span className="text-sm font-semibold text-emerald-600 line-clamp-1">{data.meaning}</span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-base font-bold text-gray-900">{word}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 max-h-[180px] overflow-y-auto custom-scrollbar-thick">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-xs text-gray-400">Đang tra từ...</span>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 text-center py-4">{error}</p>
          ) : data ? (
            <div className="space-y-2">
              {data.explanation && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{data.explanation}</p>
              )}
              {data.examples?.[0] && (
                <p className="text-xs text-gray-400 italic line-clamp-2 pl-2 border-l-2 border-gray-200">
                  {data.examples[0]}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Action bar */}
        <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-gray-50">
          {/* Vocab list selector */}
          <div className="relative">
            <button
              onClick={() => setShowListDropdown(!showListDropdown)}
              disabled={loadingLists}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs
                bg-white border border-gray-200 rounded-lg hover:border-indigo-300
                transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-gray-500">📒</span>
                <span className="text-gray-700 truncate">
                  {loadingLists
                    ? 'Đang tải...'
                    : vocabLists.find(l => l.id === selectedListId)?.title || 'Chọn danh sách'
                  }
                </span>
              </div>
              <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${showListDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showListDropdown && (
              <>
                <div className="fixed inset-0 z-[65]" onClick={() => setShowListDropdown(false)} />
                <div className="absolute z-[65] w-full mt-1 bg-white border border-gray-200
                  rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {vocabLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => { setSelectedListId(list.id); setShowListDropdown(false); }}
                      className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-indigo-50
                        transition-colors text-left ${selectedListId === list.id ? 'bg-indigo-50' : ''}`}
                    >
                      <span>{list.icon || '📒'}</span>
                      <span className="flex-1 text-gray-700 truncate">{list.title}</span>
                      {list.isDefault && (
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">Mặc định</span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowListDropdown(false); setShowCreateDialog(true); }}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-indigo-50
                      transition-colors text-left border-t border-gray-100 text-indigo-600"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tạo danh sách mới...</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || saved || loadingLists}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                transition-colors flex-1 justify-center
                ${saved
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-60`}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : saved
                  ? <><Check className="h-3.5 w-3.5" /> Đã lưu</>
                  : <><BookmarkPlus className="h-3.5 w-3.5" /> Lưu vào sổ từ</>
              }
            </button>
            <button
              onClick={handleViewDetail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
