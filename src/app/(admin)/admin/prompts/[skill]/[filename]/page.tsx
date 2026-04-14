'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Mic,
  Eye,
  Edit3,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import {
  getPromptDetail,
  getPromptVersionContent,
  updatePrompt,
  activatePromptVersion,
  listAllPrompts,
  type PromptDetail,
} from '@/lib/admin-api';

const FILENAME_LABELS: Record<string, string> = {
  'phase1_parse.txt': 'Phase 1 — Parse Essay (Task 1)',
  'phase1_parse_task2.txt': 'Phase 1 — Parse Essay (Task 2)',
  'phase2_ta.txt': 'Phase 2 — Task Achievement (T1)',
  'phase2_tr.txt': 'Phase 2 — Task Response (T2)',
  'phase3_cc.txt': 'Phase 3 — Coherence & Cohesion',
  'phase4_lr.txt': 'Phase 4 — Lexical Resource',
  'phase5_gra.txt': 'Phase 5 — Grammatical Range',
  'phase7_feedback.txt': 'Phase 7 — Feedback (Task 1)',
  'phase7_feedback_task2.txt': 'Phase 7 — Feedback (Task 2)',
  'phase1_fc.txt': 'Phase 1 — Fluency & Coherence',
  'phase2_lr.txt': 'Phase 2 — Lexical Resource',
  'phase3_gra.txt': 'Phase 3 — Grammatical Range',
  'phase4_pr.txt': 'Phase 4 — Pronunciation',
  'phase5_feedback.txt': 'Phase 5 — Feedback',
};

export default function PromptEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const skill = params.skill as string;
  const filename = decodeURIComponent(params.filename as string);

  const [editContent, setEditContent] = useState('');
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [previewVersion, setPreviewVersion] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load active prompt
  const { data: detail, isLoading } = useQuery<PromptDetail>({
    queryKey: ['prompt-detail', skill, filename],
    queryFn: () => getPromptDetail(skill, filename),
    enabled: !!skill && !!filename,
  });

  // Load versions list from prompts list
  const { data: allPrompts = [] } = useQuery({
    queryKey: ['admin-prompts'],
    queryFn: listAllPrompts,
  });
  const promptInfo = allPrompts.find((p) => p.skill === skill && p.filename === filename);
  const versions = promptInfo?.availableVersions ?? ['v1'];

  // Load preview version
  const { data: previewData } = useQuery({
    queryKey: ['prompt-version', skill, filename, previewVersion],
    queryFn: () => getPromptVersionContent(skill, filename, previewVersion!),
    enabled: !!previewVersion,
  });

  useEffect(() => {
    if (detail?.content && !editContent) {
      setEditContent(detail.content);
    }
  }, [detail?.content, editContent]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => updatePrompt(skill, filename, editContent, activateImmediately),
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompt-detail', skill, filename] });
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Lưu thất bại');
      setSuccessMsg(null);
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (version: string) => activatePromptVersion(skill, filename, version),
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      setErrorMsg(null);
      setPreviewVersion(null);
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompt-detail', skill, filename] });
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Kích hoạt thất bại');
    },
  });

  const SkillIcon = skill === 'writing' ? BookOpen : Mic;
  const isDirty = editContent !== (detail?.content ?? '');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />

      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-6 gap-6">
        {/* Breadcrumb + header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/prompts')}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
                <SkillIcon className="h-3.5 w-3.5" />
                <span className="capitalize">{skill}</span>
                <span>/</span>
                <span className="font-mono">{filename}</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                {FILENAME_LABELS[filename] ?? filename}
              </h1>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-1">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'edit' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Chỉnh sửa
            </button>
            <button
              onClick={() => setMode('view')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'view' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Xem
            </button>
          </div>
        </div>

        {/* Alert messages */}
        {successMsg && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex gap-6 flex-1">
          {/* Editor */}
          <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            {/* Editor header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${isDirty ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
                <span className="text-xs font-semibold text-gray-600">
                  {isDirty ? 'Chưa lưu' : 'Đã lưu'}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  — Đang dùng:{' '}
                  <span className="font-bold text-blue-600">
                    {detail?.activeVersion ?? '...'}
                  </span>
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {editContent.length} ký tự
              </span>
            </div>

            {/* Textarea / preview */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Đang tải nội dung prompt...
              </div>
            ) : mode === 'edit' ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 resize-none p-6 font-mono text-[13px] text-gray-800 leading-relaxed outline-none bg-white"
                placeholder="Nội dung prompt..."
                style={{ minHeight: '500px' }}
              />
            ) : (
              <div className="flex-1 p-6 font-mono text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap overflow-auto">
                {previewVersion && previewData ? previewData.content : editContent}
              </div>
            )}

            {/* Save bar */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activateImmediately}
                  onChange={(e) => setActivateImmediately(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700 font-medium">
                  Kích hoạt ngay sau khi lưu
                </span>
              </label>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!isDirty || saveMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu phiên bản mới'}
              </button>
            </div>
          </div>

          {/* Version history sidebar */}
          <div className="w-64 shrink-0 bg-white border border-gray-100 rounded-3xl shadow-sm p-5 flex flex-col gap-4 h-fit">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-500" />
              <span className="text-[13px] font-black text-gray-700 uppercase tracking-wide">
                Lịch sử phiên bản
              </span>
            </div>
            <div className="space-y-2">
              {[...versions].reverse().map((v) => {
                const isActive = v === (detail?.activeVersion ?? promptInfo?.activeVersion);
                const isPreview = v === previewVersion;
                return (
                  <div
                    key={v}
                    className={`rounded-xl border p-3 transition-all ${
                      isPreview
                        ? 'border-blue-300 bg-blue-50'
                        : isActive
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-[13px] text-gray-900">{v}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Đang dùng
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setPreviewVersion(isPreview ? null : v);
                          setMode('view');
                        }}
                        className="flex-1 py-1 text-[11px] font-semibold text-gray-600 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Xem
                      </button>
                      {!isActive && (
                        <button
                          onClick={() => activateMutation.mutate(v)}
                          disabled={activateMutation.isPending}
                          className="flex-1 py-1 text-[11px] font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Kích hoạt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {versions.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có phiên bản nào</p>
              )}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[11px] text-gray-400 leading-snug">
                <Clock className="h-3 w-3 inline mr-1" />
                Mỗi lần lưu sẽ tạo phiên bản mới. Ông có thể kích hoạt lại bất kỳ phiên bản cũ nào.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
