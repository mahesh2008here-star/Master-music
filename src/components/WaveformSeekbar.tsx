import React, { useEffect, useMemo, useRef } from 'react';

interface WaveformSeekbarProps {
  trackId: string;
  progressPercent: number;
  isPlaying: boolean;
  isSeeking: boolean;
  enabled?: boolean;
}

/**
 * Precision Mirrored Acoustic Micro-Filament Waveform
 * Designed specifically for MasterWave's full-bleed dark Now Playing aesthetic:
 * crisp Hi-DPI hairline filaments with warm coral-to-gold gradient fill along
 * played regions, organic playback breathing modulation, and a luminous playhead needle.
 */
export const WaveformSeekbar: React.FC<WaveformSeekbarProps> = ({
  trackId,
  progressPercent,
  isPlaying,
  isSeeking,
  enabled = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progressPercent);
  const isPlayingRef = useRef(isPlaying);
  const isSeekingRef = useRef(isSeeking);

  progressRef.current = progressPercent;
  isPlayingRef.current = isPlaying;
  isSeekingRef.current = isSeeking;

  // Deterministic acoustic contour synthesized from trackId
  const amplitudes = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < trackId.length; i++) {
      hash ^= trackId.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    const barCount = 72;
    return Array.from({ length: barCount }, (_, idx) => {
      const t = idx / (barCount - 1);
      // Musical phrase macro-envelope (intro -> verse -> chorus peak -> bridge -> outro)
      const phrase =
        0.42 +
        0.24 * Math.sin(t * Math.PI * 2.1 + (hash % 5)) +
        0.18 * Math.cos(t * Math.PI * 5.3 + ((hash >> 4) % 9)) +
        0.12 * Math.sin(t * Math.PI * 11.7 + ((hash >> 8) % 13));
      const transient = (((hash ^ (idx * 2654435761)) >>> 0) % 100) / 100;
      const edgeTaper = 0.45 + 0.55 * Math.sin(t * Math.PI);
      const v = (phrase * 0.68 + transient * 0.32) * edgeTaper;
      return Math.max(0.14, Math.min(1, v));
    });
  }, [trackId]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const pct = Math.max(0, Math.min(100, progressRef.current)) / 100;
      const playX = pct * width;
      const midY = height / 2;
      const maxHalfH = height * 0.42;
      const timeSec = now * 0.001;
      const count = amplitudes.length;
      const stepX = width / count;
      const barW = Math.max(1.4, Math.min(2.2, stepX * 0.44));

      // Subtle center acoustic axis hairline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.fillRect(0, midY - 0.5, width, 1);

      // Soft warm ribbon glow under played half
      if (playX > 2) {
        const ribbonGrad = ctx.createLinearGradient(0, 0, playX, 0);
        ribbonGrad.addColorStop(0, 'rgba(242, 149, 135, 0.05)');
        ribbonGrad.addColorStop(0.75, 'rgba(242, 149, 135, 0.16)');
        ribbonGrad.addColorStop(1, 'rgba(255, 227, 130, 0.24)');
        ctx.fillStyle = ribbonGrad;
        ctx.beginPath();
        ctx.roundRect(0, midY - 6, playX, 12, 6);
        ctx.fill();
      }

      // Draw 72 mirrored micro-filaments
      for (let i = 0; i < count; i++) {
        const x = (i + 0.5) * stepX;
        const distFromHead = Math.abs(x - playX);
        const isPassed = x <= playX;

        const playMod = isPlayingRef.current
          ? 0.9 + 0.14 * Math.sin(timeSec * 4.4 - i * 0.35)
          : 0.94;
        const seekLens =
          isSeekingRef.current && distFromHead < 26
            ? 1 + (1 - distFromHead / 26) * 0.28
            : 1;

        const amp = amplitudes[i] * (isPassed ? playMod : 0.85) * seekLens;
        const halfH = Math.max(2, amp * maxHalfH);

        if (isPassed) {
          const proximity = Math.max(0, 1 - distFromHead / Math.max(36, width * 0.18));
          ctx.fillStyle = proximity > 0.45 ? '#FFE382' : '#F29587';
          ctx.globalAlpha = 0.84 + proximity * 0.16;
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = distFromHead < 18 && isSeekingRef.current ? 0.36 : 0.22;
        }

        const rx = x - barW / 2;
        const ry = midY - halfH;
        const totalH = halfH * 2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, barW, totalH, barW / 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Signature luminous playhead needle + halo orb
      const needleH = isSeekingRef.current ? height * 0.92 : height * 0.78;
      ctx.shadowColor = 'rgba(255, 227, 130, 0.85)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFE89E';
      ctx.beginPath();
      ctx.roundRect(Math.max(1, Math.min(width - 3, playX - 1.25)), midY - needleH / 2, 2.5, needleH, 1.5);
      ctx.fill();

      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(Math.max(4, Math.min(width - 4, playX)), midY, isSeekingRef.current ? 4.8 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(Math.max(4, Math.min(width - 4, playX)), midY, isSeekingRef.current ? 3 : 2.1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE382';
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [amplitudes, enabled]);

  if (!enabled) {
    return (
      <div className="w-full relative flex items-center">
        <div className="w-full h-[3.5px] rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%`, backgroundColor: '#F29587' }}
          />
        </div>
        <div
          style={{ left: `calc(${progressPercent}% - 10px)` }}
          className="w-5 h-5 rounded-full border-[1.5px] border-white/55 bg-black/40 backdrop-blur-sm flex items-center justify-center absolute pointer-events-none shadow-md"
        >
          <span className="w-3 h-3 rounded-full bg-[#FFE382] shadow-xs" />
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-10 block pointer-events-none"
      aria-hidden="true"
    />
  );
};
