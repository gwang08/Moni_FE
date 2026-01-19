'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListeningStore } from '@/store/listening-store';
import { AudioPlayer } from '@/components/listening/audio-player';
import { TranscriptView } from '@/components/listening/transcript-view';
import { Headphones, StickyNote, X } from 'lucide-react';

const MOCK_PASSAGE = {
  title: 'The Impact of Social Media',
  audioUrl: '/audio/sample.mp3',
  transcript: [
    {
      id: 't1',
      startTime: 0,
      endTime: 5,
      text: 'Social media has become an integral part of modern life.',
    },
    {
      id: 't2',
      startTime: 5,
      endTime: 10,
      text: 'It connects billions of people worldwide and shapes how we communicate.',
    },
    {
      id: 't3',
      startTime: 10,
      endTime: 15,
      text: 'However, its rapid growth has raised concerns about privacy and mental health.',
    },
  ],
};

export default function ListeningPage() {
  const { currentTime, notes, addNote, removeNote } = useListeningStore();
  const [noteInput, setNoteInput] = useState('');

  const handleAddNote = () => {
    if (!noteInput.trim()) return;

    addNote({
      timestamp: currentTime,
      note: noteInput,
    });

    setNoteInput('');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Headphones className="h-8 w-8" />
          {MOCK_PASSAGE.title}
        </h1>

        {/* Audio Player */}
        <AudioPlayer audioUrl={MOCK_PASSAGE.audioUrl} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcript */}
          <TranscriptView segments={MOCK_PASSAGE.transcript} />

          {/* Notes Panel */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Ghi chú ({notes.length})
            </h3>

            {/* Add Note */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Thêm ghi chú tại thời điểm hiện tại..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button onClick={handleAddNote}>Thêm</Button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-600">
                        {formatTime(note.timestamp)}
                      </p>
                      <p className="text-sm mt-1">{note.note}</p>
                    </div>
                    <Button
                      onClick={() => removeNote(note.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
