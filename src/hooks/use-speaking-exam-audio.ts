import { useRef, useCallback, useState } from 'react';

/**
 * Manages TTS audio chunk buffering and playback.
 * Collects base64 MP3 chunks → merges into single blob → plays via Audio API.
 */
export function useSpeakingExamAudio() {
  const chunksRef = useRef<string[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const pushChunk = useCallback((base64: string) => {
    chunksRef.current.push(base64);
  }, []);

  const resetChunks = useCallback(() => {
    chunksRef.current = [];
  }, []);

  const playChunks = useCallback(async () => {
    const chunks = chunksRef.current;
    if (chunks.length === 0) {
      setIsAudioPlaying(false);
      return;
    }

    try {
      // Decode all base64 chunks → Uint8Array → single Blob
      const binaryParts = chunks.map((b64) => {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      });

      const blob = new Blob(binaryParts, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setIsAudioPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        console.error('Audio playback failed');
        setIsAudioPlaying(false);
        URL.revokeObjectURL(url);
      };

      setIsAudioPlaying(true);
      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsAudioPlaying(false);
    }
  }, []);

  return { isAudioPlaying, pushChunk, resetChunks, playChunks };
}
