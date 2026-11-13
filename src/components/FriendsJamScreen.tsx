import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Users,
  Radio,
  Play,
  Share2,
  Check,
  Send,
  RefreshCw,
  LogIn
} from 'lucide-react';
import { Track } from '../types/music';
import { newpipeService } from '../services/newpipeService';

interface JamRoom {
  code: string;
  hostName: string;
  roomName: string;
  listeners: number;
  deviceLabel: string;
  isPlaying: boolean;
  positionSec: number;
  updatedAt: number;
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    streamUrl: string;
    duration: number;
    qualityBadge: string;
  };
  messages: Array<{ id: string; sender: string; text: string; time: string }>;
}

interface FriendsJamScreenProps {
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onClose: () => void;
}

export const FriendsJamScreen: React.FC<FriendsJamScreenProps> = ({
  currentTrack,
  onPlayTrack,
  onClose
}) => {
  const [rooms, setRooms] = useState<JamRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<JamRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [syncingTrackId, setSyncingTrackId] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/jam/rooms');
      if (res.ok) {
        const data = (await res.json()) as { rooms?: JamRoom[] };
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      }
    } catch {
      // keep existing state
    }
  };

  useEffect(() => {
    void loadRooms();
  }, []);

  // Poll active Jam room for live track + chat updates
  useEffect(() => {
    if (!activeRoom) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jam/${encodeURIComponent(activeRoom.code)}`);
        if (res.ok) {
          const data = (await res.json()) as { room?: JamRoom };
          if (data.room) setActiveRoom(data.room);
        }
      } catch {
        // ignore poll error
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activeRoom?.code]);

  const handleHostJam = async () => {
    const res = await fetch('/api/jam/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName: 'You (Host)',
        roomName: currentTrack
          ? `${currentTrack.artist.split(',')[0]} Listening Session`
          : 'Friends Jam',
        isPlaying: true,
        positionSec: 0,
        currentTrack: currentTrack
          ? {
              id: currentTrack.id,
              title: currentTrack.title,
              artist: currentTrack.artist,
              album: currentTrack.album,
              artworkUrl: currentTrack.artworkUrl,
              streamUrl: currentTrack.streamUrl,
              duration: currentTrack.duration,
              qualityBadge: currentTrack.quality.badgeLabel
            }
          : undefined
      })
    });
    if (res.ok) {
      const data = (await res.json()) as { room?: JamRoom };
      if (data.room) {
        setActiveRoom(data.room);
        setStatusNotice(`Room ${data.room.code} is live`);
        void loadRooms();
      }
    }
  };

  const handleJoinByCode = async () => {
    const clean = joinCodeInput.trim().toUpperCase();
    if (!clean) return;
    const res = await fetch(`/api/jam/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = (await res.json()) as { room?: JamRoom };
      if (data.room) {
        setActiveRoom(data.room);
        setJoinCodeInput('');
        setStatusNotice(`Joined room ${data.room.code}`);
        return;
      }
    }
    setStatusNotice(`Room "${clean}" not found`);
  };

  const handleListenAlong = async (room: JamRoom) => {
    setActiveRoom(room);
    setSyncingTrackId(room.code);
    try {
      let playableUrl = room.currentTrack.streamUrl;
      let resolvedTrack: Track | null = null;

      if (!playableUrl) {
        const res = await newpipeService.search(`${room.currentTrack.title} ${room.currentTrack.artist}`);
        if (res.items.length > 0) {
          resolvedTrack = res.items[0];
        }
      }

      if (resolvedTrack) {
        onPlayTrack(resolvedTrack);
      } else {
        onPlayTrack({
          id: room.currentTrack.id,
          title: room.currentTrack.title,
          artist: room.currentTrack.artist,
          album: room.currentTrack.album,
          duration: room.currentTrack.duration,
          artworkUrl: room.currentTrack.artworkUrl,
          streamUrl: playableUrl,
          provider: playableUrl ? 'jiosaavn' : 'newpipe',
          quality: {
            codec: 'AAC / FLAC',
            container: 'Jam Sync',
            sampleRate: 48000,
            bitDepth: 24,
            channelCount: 2,
            bitrateKbps: 320,
            isLossless: true,
            isHiRes: false,
            isResampledByAndroidMixer: false,
            outputHardware: room.deviceLabel,
            badgeLabel: room.currentTrack.qualityBadge,
            tier: 'lossless',
            sourceProvider: 'Friends Jam Sync'
          }
        });
      }
      setStatusNotice(`Synced playback with ${room.hostName}`);
    } finally {
      setSyncingTrackId(null);
    }
  };

  const handleSendChat = async () => {
    if (!activeRoom || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    const res = await fetch(`/api/jam/${encodeURIComponent(activeRoom.code)}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'You', text })
    });
    if (res.ok) {
      const data = (await res.json()) as { room?: JamRoom };
      if (data.room) setActiveRoom(data.room);
    }
  };

  const handleCopyJam = () => {
    if (!activeRoom) return;
    navigator.clipboard?.writeText(`Join my Friends Jam room: ${activeRoom.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-45 bg-[var(--mw-page-bg)] text-gray-900 dark:text-white overflow-y-auto pb-40 select-none"
    >
      {/* Warm Amber / Terracotta Color-Theory Hero */}
      <div className="bg-gradient-to-b from-[#92400E] via-[#B45309]/85 to-[var(--mw-page-bg)] text-white pt-[max(14px,env(safe-area-inset-top))] pb-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              aria-label="Back to Home"
              className="w-11 h-11 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => void loadRooms()}
              aria-label="Refresh active rooms"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#FBBF24] via-[#D97706] to-[#92400E] flex items-center justify-center shadow-2xl flex-shrink-0">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                Friends Jam
              </h1>
              <p className="text-xs text-white/85 mt-2">
                Listen together in real time with synced queue &amp; room chat
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-5 mt-2">
        {statusNotice && (
          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold">
            {statusNotice}
          </div>
        )}

        {/* Active Room Stage */}
        {activeRoom ? (
          <section className="relative overflow-hidden rounded-3xl bg-[#161514] text-white border border-white/10 shadow-xl p-5 space-y-4">
            <img
              src={activeRoom.currentTrack.artworkUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-25 pointer-events-none"
            />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono font-bold text-amber-300">
                    {activeRoom.code} · {activeRoom.listeners} listening
                  </span>
                  <h2 className="font-display text-xl font-extrabold truncate">
                    {activeRoom.roomName}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleCopyJam}
                    className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Invite'}</span>
                  </button>
                  <button
                    onClick={() => setActiveRoom(null)}
                    className="px-3.5 py-2 rounded-full bg-white/10 text-xs font-semibold text-gray-300"
                  >
                    Leave
                  </button>
                </div>
              </div>

              {/* Room Current Track */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={activeRoom.currentTrack.artworkUrl}
                    alt={activeRoom.currentTrack.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {activeRoom.currentTrack.title}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {activeRoom.currentTrack.artist} · {activeRoom.currentTrack.qualityBadge}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void handleListenAlong(activeRoom)}
                  className="px-4 py-2 rounded-full bg-[#D97706] hover:bg-[#B45309] text-xs font-bold text-white flex items-center gap-1.5 flex-shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Sync Track</span>
                </button>
              </div>

              {/* In-Room Chat */}
              <div className="space-y-2.5 bg-black/30 rounded-2xl p-3.5 border border-white/8">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                  {activeRoom.messages.map((m) => (
                    <div key={m.id} className="text-xs leading-relaxed">
                      <span className="font-bold text-amber-300">{m.sender}: </span>
                      <span className="text-white/90">{m.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSendChat()}
                    placeholder="Message friends in this session..."
                    className="flex-1 h-10 px-3.5 rounded-xl bg-white/10 text-xs text-white placeholder-white/45 focus:outline-none"
                  />
                  <button
                    onClick={() => void handleSendChat()}
                    aria-label="Send message"
                    className="w-10 h-10 rounded-xl bg-[#D97706] hover:bg-[#B45309] flex items-center justify-center text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-[var(--mw-surface)] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-extrabold">Host a Friends Jam</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {currentTrack ? `Share "${currentTrack.title}"` : 'Start a shared session'}
                </p>
              </div>
              <button
                onClick={() => void handleHostJam()}
                className="px-4 h-10 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs flex-shrink-0"
              >
                Start Jam
              </button>
            </div>

            <div className="p-4 rounded-3xl bg-[var(--mw-surface)] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleJoinByCode()}
                placeholder="Room code (e.g. MW-8429)"
                className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--mw-surface-elevated)] text-xs font-mono font-semibold focus:outline-none"
              />
              <button
                onClick={() => void handleJoinByCode()}
                className="px-4 h-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join</span>
              </button>
            </div>
          </section>
        )}

        {/* Active Friends Rooms */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#D97706]" />
              <h2 className="font-display text-lg font-extrabold">Active Sessions</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">{rooms.length} live</span>
          </div>

          <div className="space-y-2.5">
            {rooms.map((room) => (
              <div
                key={room.code}
                className="p-3.5 rounded-3xl bg-[var(--mw-surface)] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={room.currentTrack.artworkUrl}
                    alt={room.currentTrack.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold truncate">{room.roomName}</h4>
                      <span className="text-[11px] font-mono font-semibold text-[#D97706]">
                        {room.code}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">
                      {room.currentTrack.title} · {room.currentTrack.artist}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {room.hostName} · {room.listeners} listening
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => void handleListenAlong(room)}
                  disabled={syncingTrackId === room.code}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{syncingTrackId === room.code ? 'Syncing' : 'Join'}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
};
