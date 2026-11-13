import React, { useState } from 'react';
import { X, FolderPlus, Music, CheckCircle2, FileAudio } from 'lucide-react';
import { Track } from '../types/music';

interface LocalMusicModalProps {
  onAddLocalTrack: (track: Track) => void;
  onClose: () => void;
}

export const LocalMusicModal: React.FC<LocalMusicModalProps> = ({ onAddLocalTrack, onClose }) => {
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isFlac = file.name.toLowerCase().endsWith('.flac');
      const isWav = file.name.toLowerCase().endsWith('.wav');
      const isLossless = isFlac || isWav;

      const newTrack: Track = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Device Audio',
        album: 'Device Storage',
        duration: 200,
        artworkUrl: '/assets/covers/sai_abhyankkar.png',
        streamUrl: url,
        quality: {
          codec: isFlac ? 'FLAC' : isWav ? 'PCM WAV' : 'MPEG Audio',
          container: isFlac ? 'Native FLAC' : 'Local File',
          sampleRate: isLossless ? 44100 : 44100,
          bitDepth: isFlac ? 16 : isWav ? 24 : null,
          channelCount: 2,
          bitrateKbps: isFlac ? 940 : isWav ? 1411 : 320,
          isLossless: isLossless,
          isHiRes: false,
          isResampledByAndroidMixer: true,
          outputHardware: 'Snapdragon 6s Gen 3 Audio HAL',
          badgeLabel: isFlac ? 'FLAC • 16-bit 44.1 kHz' : isWav ? 'WAV • Lossless' : 'Local 320 kbps',
          tier: isLossless ? 'lossless' : 'high_quality',
          sourceProvider: 'Device Local Storage'
        },
        isLocal: true,
        provider: 'local'
      };

      onAddLocalTrack(newTrack);
    });

    setImportedCount((prev) => prev + files.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-[#141716] rounded-t-3xl sm:rounded-3xl p-6 text-gray-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Import Local Music</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">FLAC, WAV, MP3 &amp; AAC Playback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-6">
          <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 dark:border-white/15 rounded-3xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors p-4 text-center">
            <FileAudio style={{ color: 'var(--mw-primary)' }} className="w-10 h-10 mb-2" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Select or Drop Audio Files
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports genuine 16/24-bit FLAC, WAV, MP3
            </span>
            <input
              type="file"
              multiple
              accept="audio/*,.flac,.wav,.mp3,.m4a"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {importedCount > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully imported {importedCount} local track(s) to "Local songs"!</span>
          </div>
        )}

        <button
          onClick={onClose}
          style={{ backgroundColor: 'var(--mw-primary)' }}
          className="w-full py-3 rounded-full text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          {importedCount > 0 ? 'Done' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};
