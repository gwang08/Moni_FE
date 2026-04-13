'use client';

import { useState } from 'react';
import { Upload, Link2, Loader2 } from 'lucide-react';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { Button } from '@/components/ui/button';

interface Props {
  onUploaded: (url: string) => void;
}

export function AudioUploadSection({ onUploaded }: Props) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [validating, setValidating] = useState(false);

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setValidating(true);
    try {
      // Simple URL validation - check if it's a valid URL format
      new URL(urlInput.trim());
      // Could do more validation like fetching HEAD request, but keeping it simple
      onUploaded(urlInput.trim());
    } catch {
      // URL is invalid
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            mode === 'upload'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Tải lên file
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            mode === 'url'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          Dán URL
        </button>
      </div>

      {mode === 'upload' ? (
        <MediaUploadZone
          onUploaded={onUploaded}
          label="Tải lên file audio"
          sublabel="Hỗ trợ MP3, WAV, M4A"
          icon={<Upload className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/audio.mp3"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || validating}
            className="w-full"
          >
            {validating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Sử dụng URL này
              </>
            )}
          </Button>
          <p className="text-xs text-gray-400">
            Dán URL trực tiếp đến file audio (MP3, WAV, M4A)
          </p>
        </div>
      )}
    </div>
  );
}
