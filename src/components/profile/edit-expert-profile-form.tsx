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
import { Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      const res = await apiClient.upload<{ result: string }>('/api/v1/files/upload', file);
      if (res.result) {
        setAvatarUrl(res.result);
      }
    } catch (err) {
      setError('Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
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

  const addCertificate = () => {
    setCertificates([...certificates, '']);
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const updateCertificate = (index: number, value: string) => {
    const newCerts = [...certificates];
    newCerts[index] = value;
    setCertificates(newCerts);
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
        
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || saving}
              className="bg-white border-slate-200"
            >
              <Upload className="mr-2 h-4 w-4" /> Tải ảnh lên
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>
          <div className="max-w-xs mx-auto sm:mx-0">
            <Label htmlFor="avatarUrl" className="text-xs text-slate-500 mb-1 block uppercase tracking-wider font-semibold">Hoặc sử dụng URL</Label>
            <div className="relative">
              <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
                placeholder="https://example.com/avatar.jpg"
                disabled={saving || uploading}
              />
            </div>
          </div>
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
        <Label className="text-slate-700 font-semibold">Chứng chỉ (URLs)</Label>
        <div className="grid grid-cols-1 gap-3">
          {certificates.map((cert, index) => (
            <div key={index} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
              <Input
                value={cert}
                onChange={(e) => updateCertificate(index, e.target.value)}
                disabled={saving}
                className="border-slate-200 flex-1"
                placeholder="https://example.com/certificate.jpg"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCertificate(index)}
                disabled={saving}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCertificate}
          disabled={saving}
          className="border-dashed border-2 hover:border-blue-500 hover:text-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm chứng chỉ mới
        </Button>
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
