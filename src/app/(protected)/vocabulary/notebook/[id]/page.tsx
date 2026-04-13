'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, Loader2, Volume2, Trash2, Pencil, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getMyWords, deleteList, updateList, saveWordManual, deleteWord, lookupVocab, getVocabDetail, type VocabDetail } from '@/lib/vocab-api';
import type { VocabWord, VocabCollection } from '@/types/vocab.types';
import { toast } from 'sonner';

export default function NotebookListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [wordDetail, setWordDetail] = useState<VocabDetail | null>(null);
  const [loadingWordDetail, setLoadingWordDetail] = useState(false);
  const [collection, setCollection] = useState<VocabCollection | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Add word dialog state
  const [showAddWordDialog, setShowAddWordDialog] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newWordMeaning, setNewWordMeaning] = useState('');
  const [newWordPos, setNewWordPos] = useState('');
  const [newWordDefinition, setNewWordDefinition] = useState('');
  const [newWordExample, setNewWordExample] = useState('');
  const [newWordSentence, setNewWordSentence] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [savingWord, setSavingWord] = useState(false);

  // Edit word dialog state
  const [showEditWordDialog, setShowEditWordDialog] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [editWordPhonetic, setEditWordPhonetic] = useState('');
  const [editWordMeaning, setEditWordMeaning] = useState('');
  const [editWordPos, setEditWordPos] = useState('');
  const [editWordExample, setEditWordExample] = useState('');
  const [savingWordEdit, setSavingWordEdit] = useState(false);

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<{ id: number; word: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      let listId: number | null = Number(id);
      const isSystemMode = id === 'system';
      const statusFilter = searchParams.get('status') || undefined;

      console.log('[NotebookDetail] ===== START =====');
      console.log('[NotebookDetail] Loading list with ID:', listId, 'or system mode:', isSystemMode, statusFilter);
      
      if (!isSystemMode && isNaN(listId)) { 
        console.error('[NotebookDetail] Invalid list ID');
        setNotFound(true); 
        setLoading(false); 
        return; 
      }
      
      if (isSystemMode) {
        listId = null;
      }
      
      let page: any = { content: [], totalElements: 0, totalPages: 0 };
      let currentCollection: VocabCollection | null = null;
      
      // Step 1: Try to get list metadata (sessionStorage or API)
      console.log('[NotebookDetail] Step 1: Getting list metadata...');
      try {
        const stored = sessionStorage.getItem(`vocab-list-${listId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as VocabCollection;
          if (parsed.id === listId) {
            console.log('[NotebookDetail] ✓ Found in sessionStorage:', parsed.title);
            currentCollection = parsed;
            sessionStorage.removeItem(`vocab-list-${listId}`);
          }
        }
      } catch (e) { 
        console.warn('[NotebookDetail] sessionStorage read error:', e);
      }
      
      if (!currentCollection) {
        console.log('[NotebookDetail] No sessionStorage data, fetching from API...');
        try {
          const { getMyLists } = await import('@/lib/vocab-api');
          const lists = await getMyLists();
          console.log('[NotebookDetail] API returned', lists.length, 'lists:', lists.map(l => ({ id: l.id, title: l.title })));
          const found = lists.find((c) => c.id === listId);
          if (found) {
            console.log('[NotebookDetail] ✓ Found in API lists:', found.title);
            currentCollection = found;
          } else {
            console.warn('[NotebookDetail] ✗ List', listId, 'NOT found in API response');
          }
        } catch (e: any) {
          console.error('[NotebookDetail] ✗ Failed to fetch lists:', e?.message || e);
        }
      }
      
      // Step 2: Fetch words
      console.log('[NotebookDetail] Step 2: Fetching words...');
      try {
        console.log('[NotebookDetail] Calling getMyWords(0,', pageSize, ',', listId, statusFilter, ')');
        page = await getMyWords(0, pageSize, listId, undefined, statusFilter);
        console.log('[NotebookDetail] ✓ Words fetched successfully:');
        console.log('[NotebookDetail]   - content.length:', page.content.length);
        console.log('[NotebookDetail]   - totalElements:', page.totalElements);
        console.log('[NotebookDetail]   - totalPages:', page.totalPages);
        if (page.content.length > 0) {
          console.log('[NotebookDetail]   - first 3 words:', page.content.slice(0, 3).map((w: any) => w.word));
        }
      } catch (e: any) {
        console.error('[NotebookDetail] ✗ Failed to fetch words:');
        console.error('[NotebookDetail]   - error name:', e?.name);
        console.error('[NotebookDetail]   - error status:', e?.status);
        console.error('[NotebookDetail]   - error code:', e?.code);
        console.error('[NotebookDetail]   - error message:', e?.message);
        console.error('[NotebookDetail]   - full error:', e);
        
        // If API call failed completely, still show empty page
        console.warn('[NotebookDetail] ⚠ API failed but will show empty list page');
      }
      
      // Step 3: Create placeholder if no metadata
        let systemTitle = 'Sổ hệ thống';
        let systemIcon = '📁';
        let systemDesc = 'Danh sách từ thuộc hệ thống';
        if (isSystemMode && statusFilter) {
          if (statusFilter === 'draft') {
            systemTitle = 'Sổ từ biết tuốt';
            systemDesc = 'Từ ghim nhưng chưa học, sẽ xuất hiện ở vòng lặp hằng ngày';
            systemIcon = '📖';
          } else if (statusFilter === 'active') {
            systemTitle = 'Sổ tay nhắc lại';
            systemDesc = 'Từ đang trong chu kỳ ôn tập (spaced repetition)';
            systemIcon = '🔄';
          } else if (statusFilter === 'mastered') {
            systemTitle = 'Sổ tay Master';
            systemDesc = 'Từ đã thành thạo, không cần ôn thường xuyên';
            systemIcon = '⭐';
          } else if (statusFilter === 'manual') {
            systemTitle = 'Sổ từ của tôi';
            systemDesc = 'Từ tự nhập thủ công';
            systemIcon = '📝';
          }
        }
        
        console.log('[NotebookDetail] Step 3: Creating placeholder metadata');
        currentCollection = {
          id: listId || -1,
          title: isSystemMode ? systemTitle : 'Danh sách',
          icon: isSystemMode ? systemIcon : '📁',
          description: isSystemMode ? systemDesc : null,
          type: 'CUSTOM',
          isDefault: false,
          wordCount: page.totalElements || 0,
          createdAt: new Date().toISOString(),
        };
      }
      
      // Step 4: Always render the page - never show "not found"
      console.log('[NotebookDetail] Step 4: Rendering page');
      console.log('[NotebookDetail]   - collection:', currentCollection.title);
      console.log('[NotebookDetail]   - words count:', page.content.length);
      console.log('[NotebookDetail]   - total:', page.totalElements);
      console.log('[NotebookDetail] ===== SUCCESS - SHOWING PAGE =====');
      
      setCollection(currentCollection);
      setWords(page.content);
      setTotalPages(page.totalPages);
      setTotalElements(page.totalElements);
      setLoading(false);
    };
    load();
  }, [id]);

  const loadPage = async (page: number) => {
    try {
      let listId: number | null = Number(id);
      const isSystemMode = id === 'system';
      const statusFilter = searchParams.get('status') || undefined;

      if (!isSystemMode && isNaN(listId)) return;
      if (isSystemMode) listId = null;

      setLoading(true);
      const pageData = await getMyWords(page, pageSize, listId, undefined, statusFilter);
      setWords(pageData.content);
      setCurrentPage(page);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (!collection) return;
    try {
      await deleteList(collection.id);
      toast.success(`Đã xóa danh sách "${collection.title}"`);
      router.push('/vocabulary/notebook');
    } catch {
      toast.error('Không thể xóa danh sách');
    }
  };

  const handleDeleteWord = (wordId: number, wordText: string) => {
    setWordToDelete({ id: wordId, word: wordText });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWord = async () => {
    if (!wordToDelete) return;
    setDeleting(true);
    try {
      await deleteWord(wordToDelete.id);
      toast.success(`Đã xóa từ "${wordToDelete.word}"`);
      // Reload current page to update the list
      let listId: number | null = Number(id);
      if (id === 'system') listId = null;
      if (listId !== null && isNaN(listId)) return;
      const statusFilter = searchParams.get('status') || undefined;
      const pageData = await getMyWords(currentPage, pageSize, listId, undefined, statusFilter);
      setWords(pageData.content);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
    } catch {
      toast.error('Không thể xóa từ');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setWordToDelete(null);
    }
  };

  const handleUpdateList = async () => {
    if (!collection) return;
    setSavingEdit(true);
    try {
      const updated = await updateList(collection.id, editTitle.trim() || undefined, undefined, editDescription.trim() || undefined);
      setCollection(updated);
      setShowEditDialog(false);
      toast.success('Đã cập nhật danh sách');
    } catch {
      toast.error('Không thể cập nhật danh sách');
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditDialog = () => {
    if (!collection) return;
    setEditTitle(collection.title);
    setEditDescription(collection.description || '');
    setShowEditDialog(true);
  };

  const handleWordClick = async (word: VocabWord) => {
    setSelectedWord(word);
    setLoadingWordDetail(true);
    setWordDetail(null);
    
    try {
      const detail = await getVocabDetail(word.id);
      setWordDetail(detail);
    } catch (e) {
      console.warn('Failed to fetch word detail, using basic data:', e);
      // Fallback: use basic word data
      setWordDetail({
        id: word.id,
        word: word.word,
        phonetic: word.phonetic,
        pos: word.pos,
        definition: word.definition,
        example: word.example,
        meaning: word.meaning,
        audioUrl: word.audioUrl,
        status: word.status,
        collectionName: word.collectionName,
        collocation: null,
        explanation: null,
        examples: null,
      });
    } finally {
      setLoadingWordDetail(false);
    }
  };

  const handleCloseWordDetail = () => {
    setSelectedWord(null);
    setWordDetail(null);
  };

  // Add word handlers
  const refreshWords = async () => {
    try {
      let listId: number | null = Number(id);
      if (id === 'system') listId = null;
      if (listId !== null && isNaN(listId)) return;
      const statusFilter = searchParams.get('status') || undefined;

      setLoading(true);
      const pageData = await getMyWords(0, pageSize, listId, undefined, statusFilter);
      setWords(pageData.content);
      setCurrentPage(0);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
      // Update collection word count
      if (collection) {
        setCollection({ ...collection, wordCount: pageData.totalElements });
      }
    } catch (e) {
      console.error('Failed to refresh words:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddWordDialog = () => {
    setNewWord('');
    setNewWordMeaning('');
    setNewWordPos('');
    setNewWordDefinition('');
    setNewWordExample('');
    setNewWordSentence('');
    setShowAddWordDialog(true);
  };

  const handleLookupWord = async () => {
    const word = newWord.trim();
    if (!word) return;

    setLookingUp(true);
    try {
      const result = await lookupVocab(word);
      setNewWordMeaning(result.meaning || '');
      setNewWordPos(result.phonetic || ''); // IPA
      setNewWordDefinition(result.pos || ''); // Loại từ
      if (result.examples && result.examples.length > 0) {
        setNewWordExample(result.examples[0]);
      }
    } catch (e: any) {
      console.warn('Lookup failed, will save manually:', e?.message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleAddWord = async () => {
    const word = newWord.trim();
    if (!word) {
      toast.error('Vui lòng nhập từ');
      return;
    }

    console.log('[AddWord] Saving word:', {
      word,
      listId: Number(id),
      meaning: newWordMeaning.trim(),
      pronunciation: newWordPos.trim(),
      pos: newWordDefinition.trim(),
      example: newWordExample.trim(),
    });

    setSavingWord(true);
    try {
      const listId = Number(id);
      await saveWordManual({
        word: word,
        vocabListId: listId,
        meaning: newWordMeaning.trim() || undefined,
        phonetic: newWordPos.trim() || undefined,
        pos: newWordDefinition.trim() || undefined,
        definition: undefined,
        example: newWordExample.trim() || undefined,
      });
      toast.success(`Đã thêm từ "${word}"`);
      setShowAddWordDialog(false);
      await refreshWords();
    } catch (e: any) {
      console.error('[AddWord] Error:', e);
      toast.error(e?.message || e?.response?.data?.message || 'Không thể thêm từ');
    } finally {
      setSavingWord(false);
    }
  };

  const openEditWordDialog = (word: VocabWord) => {
    setEditingWord(word);
    setEditWordPhonetic(word.phonetic || '');
    setEditWordMeaning(word.meaning || '');
    setEditWordPos(word.pos || '');
    setEditWordExample(word.example || '');
    setShowEditWordDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWord) return;
    setSavingWordEdit(true);
    try {
      // For now, just delete and re-add (backend doesn't have update endpoint yet)
      // Or we can implement update if needed
      toast.info('Tính năng cập nhật từ sẽ được thêm sớm!');
      setShowEditWordDialog(false);
    } catch (e: any) {
      toast.error(e?.message || 'Không thể cập nhật từ');
    } finally {
      setSavingWordEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Danh sách không tồn tại.</p>
        <Link href="/vocabulary/notebook" className="mt-4 inline-block text-blue-600 hover:underline">
          Quay lại sổ tay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/vocabulary/notebook')} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Quay lại sổ tay
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={openAddWordDialog}
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Thêm từ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openEditDialog}
            className="gap-1.5"
          >
            <Pencil className="h-4 w-4" />
            Sửa
          </Button>
          <Button
            onClick={() => router.push(`/vocabulary/flashcard?collection=${collection.id}`)}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Luyện Flashcard
          </Button>
        </div>
      </div>

      {/* Collection header */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{collection.icon ?? '📁'}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{collection.title}</h1>
          {collection.description && (
            <p className="text-gray-500 mt-1">{collection.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary">{totalElements} từ</Badge>
            {collection.isDefault && (
              <Badge variant="outline" className="text-xs">Mặc định</Badge>
            )}
          </div>
        </div>
        {!collection.isDefault && (
          <button
            onClick={handleDeleteList}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Xóa danh sách"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Word list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-gray-400">Chưa có từ nào trong danh sách này.</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={openAddWordDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm từ
            </Button>
            <Link href="/vocabulary">
              <Button variant="outline" className="gap-2">
                Tra từ điển
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {words.map((word) => (
              <div
                key={word.id}
                className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                  hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  {/* Edit button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditWordDialog(word); }}
                    className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-500
                      hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all duration-200"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteWord(word.id, word.word); }}
                    className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500
                      hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all duration-200"
                    title="Xóa từ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Word info */}
                <div className="pr-20">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-900">{word.word}</span>
                    {word.pos && (
                      <span className="inline-block text-[11px] font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {word.pos}
                      </span>
                    )}
                    {word.phonetic && (
                      <span className="text-sm text-gray-400">{word.phonetic}</span>
                    )}
                    {word.audioUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); new Audio(word.audioUrl!).play().catch(() => {}); }}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {word.example && (
                    <p className="text-sm text-gray-500 italic mt-1">{word.example}</p>
                  )}
                  {word.meaning && (
                    <p className="text-sm text-blue-600 font-medium mt-2">{word.meaning}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="gap-1"
              >
                <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                Trước
              </Button>
              <span className="text-sm text-gray-500 px-4">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="gap-1"
              >
                Sau
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowEditDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-[400px] p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sửa danh sách</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tên danh sách</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tên danh sách..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Mô tả (tùy chọn)</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Mô tả..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowEditDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateList}
                disabled={savingEdit || !editTitle.trim()}
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Word Detail Dialog */}
      {selectedWord && wordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseWordDetail} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-[500px] max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">{wordDetail.word}</span>
                    {wordDetail.phonetic && (
                      <span className="text-sm text-blue-600 font-mono">{wordDetail.phonetic}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {wordDetail.pos && (
                      <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {wordDetail.pos}
                      </span>
                    )}
                    {wordDetail.meaning && (
                      <span className="text-[15px] font-semibold text-emerald-600">{wordDetail.meaning}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseWordDetail}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loadingWordDetail ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400 ml-2">Đang tải chi tiết...</span>
              </div>
            ) : (
              <div className="px-6 py-4 max-h-[500px] overflow-y-auto custom-scrollbar-thick space-y-4">
                {/* Audio */}
                {wordDetail.audioUrl && (
                  <button
                    onClick={() => new Audio(wordDetail.audioUrl!).play().catch(() => {})}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100
                      text-sm text-gray-600 hover:text-blue-500 transition-colors"
                  >
                    <Volume2 className="h-4 w-4" />
                    Nghe phát âm
                  </button>
                )}

                {/* Collocation */}
                {wordDetail.collocation && (
                  <div className="flex gap-2">
                    <span className="text-violet-400 mt-0.5 shrink-0">🔗</span>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cụm từ liên quan</p>
                      <p className="text-[13px] text-gray-700 mt-0.5">{wordDetail.collocation}</p>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {wordDetail.explanation && (
                  <div className="flex gap-2">
                    <span className="text-amber-400 mt-0.5 shrink-0">💬</span>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Giải thích</p>
                      <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">{wordDetail.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Definition */}
                {wordDetail.definition && (
                  <div className="flex gap-2">
                    <span className="text-blue-400 mt-0.5 shrink-0">📖</span>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Định nghĩa</p>
                      <p className="text-[13px] text-gray-700 mt-0.5">{wordDetail.definition}</p>
                    </div>
                  </div>
                )}

                {/* Examples */}
                {wordDetail.examples && wordDetail.examples.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-teal-400 mt-0.5 shrink-0">❝</span>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ví dụ</p>
                      <ul className="mt-1 space-y-1.5">
                        {wordDetail.examples.map((ex: string, i: number) => (
                          <li key={i} className="text-[13px] text-gray-600 leading-relaxed pl-3 border-l-2 border-teal-200">
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Fallback example if no examples array */}
                {!wordDetail.examples && wordDetail.example && (
                  <div className="flex gap-2">
                    <span className="text-teal-400 mt-0.5 shrink-0">❝</span>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ví dụ</p>
                      <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5 pl-3 border-l-2 border-teal-200 italic">
                        {wordDetail.example}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Word Dialog */}
      {showAddWordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-[480px] max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Thêm từ mới</h3>
                <button
                  onClick={() => setShowAddWordDialog(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Word input with lookup */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Từ tiếng Anh <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Nhập từ cần tra..."
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLookupWord(); }}
                    autoFocus
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    onClick={handleLookupWord}
                    disabled={lookingUp || !newWord.trim()}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-sm"
                  >
                    {lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tra từ'}
                  </Button>
                </div>
              </div>

              {/* Pronunciation and POS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                    Cách đọc (IPA)
                  </label>
                  <Input
                    value={newWordPos}
                    onChange={(e) => setNewWordPos(e.target.value)}
                    placeholder="/hæt/, /saʊnd/..."
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                    Loại từ
                  </label>
                  <select
                    value={newWordDefinition}
                    onChange={(e) => setNewWordDefinition(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg
                      focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                  >
                    <option value="">Chọn loại từ...</option>
                    <option value="noun">Noun (Danh từ)</option>
                    <option value="verb">Verb (Động từ)</option>
                    <option value="adj">Adjective (Tính từ)</option>
                    <option value="adv">Adverb (Trạng từ)</option>
                    <option value="prep">Preposition (Giới từ)</option>
                    <option value="pron">Pronoun (Đại từ)</option>
                    <option value="conj">Conjunction (Liên từ)</option>
                    <option value="interj">Interjection (Thán từ)</option>
                  </select>
                </div>
              </div>

              {/* Meaning */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Nghĩa tiếng Việt
                </label>
                <Input
                  value={newWordMeaning}
                  onChange={(e) => setNewWordMeaning(e.target.value)}
                  placeholder="nghĩa tiếng Việt..."
                  className="h-9 text-sm"
                />
              </div>

              {/* Example */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Ví dụ <span className="text-gray-400 font-normal normal-case">(tùy chọn)</span>
                </label>
                <textarea
                  value={newWordExample}
                  onChange={(e) => setNewWordExample(e.target.value)}
                  placeholder="Câu ví dụ..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                    focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowAddWordDialog(false)}
                className="h-9 text-sm"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddWord}
                disabled={savingWord || !newWord.trim()}
                className="gap-2 h-9 text-sm px-4"
              >
                {savingWord ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {savingWord ? 'Đang thêm...' : 'Thêm từ'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Word Dialog */}
      {showEditWordDialog && editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-[480px] max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Chỉnh sửa từ</h3>
                <button
                  onClick={() => setShowEditWordDialog(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Word display (read-only) */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Từ tiếng Anh
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold text-sm">
                  {editingWord.word}
                </div>
              </div>

              {/* Pronunciation and POS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                    Cách đọc (IPA)
                  </label>
                  <Input
                    value={editWordPhonetic}
                    onChange={(e) => setEditWordPhonetic(e.target.value)}
                    placeholder="/hæt/, /saʊnd/..."
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                    Loại từ
                  </label>
                  <select
                    value={editWordPos}
                    onChange={(e) => setEditWordPos(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg
                      focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                  >
                    <option value="">Chọn loại từ...</option>
                    <option value="noun">Noun (Danh từ)</option>
                    <option value="verb">Verb (Động từ)</option>
                    <option value="adj">Adjective (Tính từ)</option>
                    <option value="adv">Adverb (Trạng từ)</option>
                    <option value="prep">Preposition (Giới từ)</option>
                    <option value="pron">Pronoun (Đại từ)</option>
                    <option value="conj">Conjunction (Liên từ)</option>
                    <option value="interj">Interjection (Thán từ)</option>
                  </select>
                </div>
              </div>

              {/* Meaning */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Nghĩa tiếng Việt
                </label>
                <Input
                  value={editWordMeaning}
                  onChange={(e) => setEditWordMeaning(e.target.value)}
                  placeholder="nghĩa tiếng Việt..."
                  className="h-9 text-sm"
                />
              </div>

              {/* Example */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wide">
                  Ví dụ <span className="text-gray-400 font-normal normal-case">(tùy chọn)</span>
                </label>
                <textarea
                  value={editWordExample}
                  onChange={(e) => setEditWordExample(e.target.value)}
                  placeholder="Câu ví dụ..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                    focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowEditWordDialog(false)}
                className="h-9 text-sm"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={savingWordEdit}
                className="gap-2 h-9 text-sm px-4"
              >
                {savingWordEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                {savingWordEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && wordToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-[360px] p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Xóa từ vựng</h3>
              <p className="text-sm text-gray-600 mb-1">Bạn có chắc muốn xóa từ này khỏi danh sách?</p>
              <p className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg mt-2">
                "{wordToDelete.word}"
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 text-sm"
                disabled={deleting}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteWord}
                className="flex-1 h-10 text-sm gap-2"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
