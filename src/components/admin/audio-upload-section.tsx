'use client';

import { useState } from 'react';
import { Music, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onUploaded: (url: string) => void;
  onFileSelected?: (file: File, previewUrl: string) => void;
}

export function AudioUploadSection({ onUploaded, onFileSelected }: Props) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onFileSelected) {
      const previewUrl = URL.createObjectURL(file);
      onFileSelected(file, previewUrl);
      return;
    }

    // Direct upload mode
    onUploaded(URL.createObjectURL(file));
  };

  if (showUrlInput) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
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
          <div className="space-y-3">
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
              autoFocus
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
                  <Music className="h-3.5 w-3.5" />
                  Sử dụng URL này
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        {/* Audio icon */}
        <div className="mb-4">
          <Music className="h-12 w-12 text-gray-400 mx-auto" />
        </div>

        {/* Upload options */}
        <div className="space-y-2">
          <label className="block">
            <span className="text-base font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
              Thêm audio
            </span>
          </label>

          <p className="text-sm text-gray-400">hoặc</p>

          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-base font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Thêm từ URL
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Hỗ trợ MP3, WAV, M4A
        </p>
      </div>
    </div>
  );
}
