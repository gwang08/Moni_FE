'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api-client';
import { formatApiError } from '@/lib/error-messages';
import type { ApiResponse } from '@/types/auth.types';
import type { ExpertProfile, UpdateExpertRequest } from '@/types/expert.types';
import { Loader2, Plus, X, Upload, FileText } from 'lucide-react';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import { RichTextToolbar } from '@/components/admin/rich-text-toolbar';

const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({ placeholder: 'Giới thiệu bản thân và kinh nghiệm giảng dạy...' }),
  Underline,
  LinkExtension.configure({ openOnClick: false }),
];

export function EditExpertProfileForm() {
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCertIndex, setUploadingCertIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [bandReading, setBandReading] = useState<number>(0);
  const [bandListening, setBandListening] = useState<number>(0);
  const [bandWriting, setBandWriting] = useState<number>(0);
  const [bandSpeaking, setBandSpeaking] = useState<number>(0);
  const [certificates, setCertificates] = useState<string[]>([]);

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Content updated in editor
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get<ApiResponse<ExpertProfile>>('/api/v1/experts/me', true);
      if (res.result) {
        const p = res.result;
        setDisplayName(p.displayName || '');
        setAvatarUrl(p.avatarUrl || '');
        setYearsExperience(p.yearsExperience || 0);
        setBandReading(p.bandReading || 0);
        setBandListening(p.bandListening || 0);
        setBandWriting(p.bandWriting || 0);
        setBandSpeaking(p.bandSpeaking || 0);
        setCertificates(p.certificates || []);
        
        if (editor && p.bio) {
          editor.commands.setContent(p.bio);
        }
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Sync editor when it loads if profile already fetched
  useEffect(() => {
    if (editor && !loading) {
      // Small delay to ensure editor is ready
      const timer = setTimeout(() => {
        apiClient.get<ApiResponse<ExpertProfile>>('/api/v1/experts/me', true)
          .then(res => {
            if (res.result?.bio) {
              editor.commands.setContent(res.result.bio);
            }
          }).catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editor, loading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const res = await apiClient.upload<{ result: string }>('/api/v1/user/media/upload', file);
      if (res.result) {
        setAvatarUrl(res.result);
      }
    } catch (err) {
      setError(formatApiError(err) || 'Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCertIndex(certificates.length);
    setError('');
    try {
      const res = await apiClient.upload<{ result: string }>('/api/v1/user/media/upload', file);
      if (res.result) {
        setCertificates([...certificates, res.result]);
      }
    } catch (err) {
      setError(formatApiError(err) || 'Tải chứng chỉ lên thất bại');
    } finally {
      setUploadingCertIndex(null);
      if (certInputRef.current) certInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload: UpdateExpertRequest = {
      displayName,
      avatarUrl,
      bio: editor?.getHTML() || '',
      yearsExperience,
      bandReading,
      bandListening,
      bandWriting,
      bandSpeaking,
      certificates,
    };

    try {
      const res = await apiClient.put<ApiResponse<ExpertProfile>>('/api/v1/experts/me', payload, true);
      
      if (res.result) {
        updateUser({
          fullName: res.result.displayName,
          avatarUrl: res.result.avatarUrl,
        });
      }
      
      setSuccess('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1].split('?')[0]) || 'Chứng chỉ';
    } catch {
      return 'Chứng chỉ';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
        <div className="relative group">
          <Avatar className="h-24 w-24 ring-4 ring-white shadow-md">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
              {displayName?.[0]?.toUpperCase() || 'E'}
            </AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || saving}
              className="bg-white border-slate-200"
            >
              <Upload className="mr-2 h-4 w-4" /> {uploading ? 'Đang tải...' : 'Tải ảnh đại diện'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>
          <p className="text-xs text-slate-500">Hỗ trợ JPG, PNG, GIF — tối đa 5MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-slate-700 font-semibold">Tên hiển thị</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={saving}
            className="border-slate-200"
            placeholder="Tên giảng viên"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearsExp" className="text-slate-700 font-semibold">Kinh nghiệm (năm)</Label>
          <Input
            id="yearsExp"
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
            disabled={saving}
            className="border-slate-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700 font-semibold">Tiểu sử (Bio)</Label>
        <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <RichTextToolbar editor={editor} />
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div className="space-y-2">
          <Label htmlFor="bandReading" className="text-slate-600 font-medium">Reading</Label>
          <Input
            id="bandReading"
            type="number"
            step="0.5"
            value={bandReading}
            onChange={(e) => setBandReading(parseFloat(e.target.value) || 0)}
            disabled={saving}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bandListening" className="text-slate-600 font-medium">Listening</Label>
          <Input
            id="bandListening"
            type="number"
            step="0.5"
            value={bandListening}
            onChange={(e) => setBandListening(parseFloat(e.target.value) || 0)}
            disabled={saving}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bandWriting" className="text-slate-600 font-medium">Writing</Label>
          <Input
            id="bandWriting"
            type="number"
            step="0.5"
            value={bandWriting}
            onChange={(e) => setBandWriting(parseFloat(e.target.value) || 0)}
            disabled={saving}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bandSpeaking" className="text-slate-600 font-medium">Speaking</Label>
          <Input
            id="bandSpeaking"
            type="number"
            step="0.5"
            value={bandSpeaking}
            onChange={(e) => setBandSpeaking(parseFloat(e.target.value) || 0)}
            disabled={saving}
            className="bg-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-slate-700 font-semibold">Chứng chỉ</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {certificates.map((cert, index) => (
            <div
              key={index}
              className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 group animate-in slide-in-from-left-2 duration-200"
            >
              {isImageUrl(cert) ? (
                <a href={cert} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img src={cert} alt="Chứng chỉ" className="h-14 w-14 object-cover rounded-lg border border-slate-200" />
                </a>
              ) : (
                <div className="h-14 w-14 flex items-center justify-center rounded-lg bg-blue-100 border border-slate-200 shrink-0">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <a
                href={cert}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-sm text-slate-700 hover:text-blue-600 truncate"
                title={cert}
              >
                {getFileName(cert)}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCertificate(index)}
                disabled={saving}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <input
          type="file"
          ref={certInputRef}
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleCertificateUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => certInputRef.current?.click()}
          disabled={saving || uploadingCertIndex !== null}
          className="border-dashed border-2 hover:border-blue-500 hover:text-blue-600"
        >
          {uploadingCertIndex !== null ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải lên...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Tải chứng chỉ mới
            </>
          )}
        </Button>
        <p className="text-xs text-slate-500">Hỗ trợ ảnh (JPG, PNG) hoặc PDF</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-300">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-300">
          {success}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" size="lg" disabled={saving || uploading} className="min-w-[140px] bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  );
}
