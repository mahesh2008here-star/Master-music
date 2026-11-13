import React from 'react';
import { X, ShieldCheck, AlertTriangle, Cpu, Radio, CheckCircle2, Layers } from 'lucide-react';
import { AudioQualityInfo, NewPipeAudioStream } from '../types/music';

interface AudioQualityModalProps {
  quality: AudioQualityInfo;
  availableStreams?: NewPipeAudioStream[];
  currentStreamUrl?: string;
  onSelectStream?: (stream: NewPipeAudioStream) => void;
  onClose: () => void;
}

export const AudioQualityModal: React.FC<AudioQualityModalProps> = ({
  quality,
  availableStreams,
  currentStreamUrl,
  onSelectStream,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#14141B] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#8E2848]/30 flex items-center justify-center border border-[#8E2848]/50">
              <ShieldCheck className="w-5 h-5 text-[#FFAEC0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Audio Quality Verification</h3>
              <p className="text-xs text-gray-400">Stream Telemetry & Hardware Output Path</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quality Tier Banner */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Verified Stream Tier</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold text-white">
                {quality.tier === 'hi_res_lossless'
                  ? 'Hi-Res Lossless (Studio Master)'
                  : quality.tier === 'lossless'
                  ? 'Lossless (CD Quality)'
                  : quality.tier === 'high_quality'
                  ? 'High Quality (VBR)'
                  : 'Standard Audio'}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              quality.isLossless
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {quality.isLossless ? 'LOSSLESS' : 'LOSSY'}
          </span>
        </div>

        {/* Technical Specification Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Codec / Encoder</span>
            <span className="text-sm font-semibold text-white mt-1 block">{quality.codec}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Container Format</span>
            <span className="text-sm font-semibold text-white mt-1 block">{quality.container}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Sample Rate</span>
            <span className="text-sm font-semibold text-[#FFAEC0] mt-1 block">
              {(quality.sampleRate / 1000).toFixed(1)} kHz ({quality.sampleRate.toLocaleString()} Hz)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Bit Depth</span>
            <span className="text-sm font-semibold text-white mt-1 block">
              {quality.bitDepth ? `${quality.bitDepth}-bit Integer` : 'Lossy (Variable Float)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Delivered Bitrate</span>
            <span className="text-sm font-semibold text-white mt-1 block font-mono">
              ~{quality.bitrateKbps} kbps
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Channels</span>
            <span className="text-sm font-semibold text-white mt-1 block">
              {quality.channelCount === 2 ? 'Stereo (2.0)' : 'Mono'}
            </span>
          </div>
        </div>

        {/* Hardware & Resampling Disclosure (Moto G45 Specific) */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Target Device Path: Motorola Moto G45 5G</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Snapdragon 6s Gen 3 Audio HAL with standard Android 16 AudioFlinger mixer.
          </p>

          {quality.isResampledByAndroidMixer ? (
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Android Resampling Active:</strong> Because Android’s system mixer operates natively at 48 kHz, this {quality.sampleRate / 1000} kHz stream is resampled by the OS audio stack. For bit-perfect output, attach an external USB Audio Class 2 DAC.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Direct Rate Match:</strong> Stream native sample rate (48 kHz) matches the Snapdragon audio mixer exactly with no conversion loss.
              </span>
            </div>
          )}
        </div>

        {/* Extracted NewPipe Audio Streams Selector */}
        {availableStreams && availableStreams.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-200 mb-1">
              <Layers className="w-4 h-4 text-[#FFAEC0]" />
              <span>Available Stream Qualities ({availableStreams.length})</span>
            </div>
            <div className="space-y-1.5">
              {availableStreams.map((stream, idx) => {
                const isActive =
                  currentStreamUrl === stream.url || currentStreamUrl === stream.rawUrl;
                return (
                  <button
                    key={`${stream.bitrateKbps}-${idx}`}
                    onClick={() => onSelectStream?.(stream)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs border transition-all ${
                      isActive
                        ? 'border-[#8E2848] bg-[#8E2848]/20 text-white'
                        : 'border-white/5 bg-white/[0.02] text-gray-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="text-left">
                      <span className="font-bold block">{stream.badgeLabel}</span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {stream.container} • {(stream.sampleRate / 1000).toFixed(1)} kHz
                      </span>
                    </div>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-[#8E2848] text-white text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Source Provider Attribution */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-gray-400" />
            <span>Source Provider:</span>
          </div>
          <span className="font-semibold text-white">{quality.sourceProvider}</span>
        </div>
      </div>
    </div>
  );
};
