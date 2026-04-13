'use client';

import { useState } from 'react';
import { Upload, Link2, Loader2, X } from 'lucide-react';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { Button } from '@/components/ui/button';

interface Props {
  onUploaded: (url: string) => void;
}

export function AudioUploadSection({ onUploaded }: Props) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [validating, setValidating] = useState(false);

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setValidating(true);
    try {
      new URL(urlInput.trim());
      onUploaded(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
    } catch {
      // URL is invalid
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="relative flex-1">
      {/* Main upload area */}
      <MediaUploadZone
        onUploaded={onUploaded}
        icon={<Upload className="h-12 w-12 text-gray-400" />}
        label="Thêm audio"
        sublabel="Kéo thả hoặc nhấn để chọn file"
        className="flex-1"
      />

      {/* URL input trigger */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          <Link2 className="h-3 w-3" />
          hoặc Thêm bằng URL
        </button>
      </div>

      {/* URL input popup */}
      {showUrlInput && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 rounded-xl border border-gray-200 bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Nhập URL audio</span>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !validating) {
                  handleUrlSubmit();
                }
              }}
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
          </div>
        </div>
      )}
    </div>
  );
}
