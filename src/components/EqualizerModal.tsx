import React, { useRef, useState } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  Headphones,
  Download,
  Upload,
  Check
} from 'lucide-react';
import {
  audioEngine,
  EQ_PRESETS,
  AUTO_EQ_HEADPHONES,
  EQ_15_LABELS,
  Eq15Gains,
  EqualizerPreset
} from '../services/audioEngine';

interface EqualizerModalProps {
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ onClose }) => {
  const initial = audioEngine.getEqState();
  const [gains, setGains] = useState<Eq15Gains>(initial.gains);
  const [preampDb, setPreampDb] = useState<number>(initial.preampDb);
  const [activePreset, setActivePreset] = useState<string>(initial.presetName);
  const [autoEqProfile, setAutoEqProfile] = useState<string | null>(initial.autoEqProfile || null);
  const [tab, setTab] = useState<'eq15' | 'autoeq'>('eq15');
  const [headphoneQuery, setHeadphoneQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGainChange = (index: number, val: number) => {
    const updated = [...gains] as Eq15Gains;
    updated[index] = val;
    setGains(updated);
    setActivePreset('Custom');
    setAutoEqProfile(null);
    audioEngine.setEqualizerGains(updated, 'Custom', preampDb, null);
  };

  const handlePreampChange = (val: number) => {
    setPreampDb(val);
    audioEngine.setEqualizerGains(gains, activePreset, val, autoEqProfile);
  };

  const applyPreset = (preset: EqualizerPreset) => {
    const isAutoEq = preset.category === 'autoeq';
    const nextPreamp = isAutoEq ? -3 : 0;
    setActivePreset(preset.name);
    setGains([...preset.gains]);
    setPreampDb(nextPreamp);
    setAutoEqProfile(isAutoEq ? preset.name : null);
    audioEngine.setEqualizerGains(
      preset.gains,
      preset.name,
      nextPreamp,
      isAutoEq ? preset.name : null
    );
    setNotice(isAutoEq ? `AutoEQ calibrated for ${preset.name}` : `Profile "${preset.name}" applied`);
    setTimeout(() => setNotice(null), 2000);
  };

  const handleExportProfile = () => {
    const payload = {
      app: 'MasterWave',
      type: '15-band-parametric-eq',
      presetName: activePreset,
      preampDb,
      autoEqProfile,
      frequenciesHz: [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000],
      gains,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masterwave_eq_${activePreset.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Exported 15-band EQ profile JSON');
  };

  const handleImportProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        gains?: number[];
        presetName?: string;
        preampDb?: number;
      };
      if (Array.isArray(parsed.gains) && parsed.gains.length === 15) {
        const imported = parsed.gains.map((n) => Math.max(-12, Math.min(12, Number(n) || 0))) as Eq15Gains;
        const name = parsed.presetName || file.name.replace(/\.json$/i, '');
        const pre = typeof parsed.preampDb === 'number' ? parsed.preampDb : 0;
        setGains(imported);
        setActivePreset(name);
        setPreampDb(pre);
        setAutoEqProfile(null);
        audioEngine.setEqualizerGains(imported, name, pre, null);
        setNotice(`Imported EQ profile "${name}"`);
      } else {
        setNotice('Expected 15-band gains array in JSON profile.');
      }
    } catch {
      setNotice('Invalid EQ profile JSON file.');
    }
    e.target.value = '';
  };

  const filteredHeadphones = AUTO_EQ_HEADPHONES.filter(
    (h) =>
      !headphoneQuery.trim() ||
      h.name.toLowerCase().includes(headphoneQuery.toLowerCase()) ||
      (h.target || '').toLowerCase().includes(headphoneQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-[#141716] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              style={{ backgroundColor: 'var(--mw-tint-dark, rgba(22,91,51,0.3))', color: 'var(--mw-primary)' }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base font-extrabold text-white tracking-tight truncate">
                15-Band Parametric EQ &amp; AutoEQ
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {autoEqProfile ? `AutoEQ · ${autoEqProfile}` : `Active Profile · ${activePreset}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleExportProfile}
              aria-label="Export EQ profile"
              title="Export EQ JSON"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-gray-300"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Import EQ profile"
              title="Import EQ JSON"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-gray-300"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={(e) => void handleImportProfile(e)}
              className="hidden"
            />
            <button
              onClick={() => applyPreset(EQ_PRESETS[0])}
              aria-label="Reset to Flat"
              title="Reset Flat"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-gray-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Segmented Switch */}
        <div className="flex items-center justify-between gap-3 pt-3.5 pb-2">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.07] w-full sm:w-auto">
            <button
              onClick={() => setTab('eq15')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'eq15' ? 'bg-white text-black shadow-xs' : 'text-gray-300 hover:text-white'
              }`}
            >
              15-Band Parametric
            </button>
            <button
              onClick={() => setTab('autoeq')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'autoeq' ? 'bg-white text-black shadow-xs' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>AutoEQ Headphone DB</span>
            </button>
          </div>

          {notice && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              {notice}
            </span>
          )}
        </div>

        {tab === 'eq15' ? (
          <div className="flex-1 overflow-y-auto space-y-4 pt-2 scrollbar-none">
            {/* Sound Profiles */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {EQ_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  style={
                    activePreset === preset.name
                      ? { backgroundColor: 'var(--mw-primary)', color: '#FFFFFF' }
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    activePreset === preset.name
                      ? 'shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Preamp Gain Control */}
            <div className="flex items-center justify-between gap-4 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">
                Preamp Gain
              </span>
              <input
                type="range"
                min={-12}
                max={6}
                step={0.5}
                value={preampDb}
                onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-300 w-14 text-right">
                {preampDb > 0 ? `+${preampDb}` : preampDb} dB
              </span>
            </div>

            {/* 15-Band Parametric Vertical Sliders */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto scrollbar-none">
              <div
                style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
                className="min-w-[560px] grid gap-1.5"
              >
                {gains.map((gain, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono tabular-nums text-emerald-300 font-bold">
                      {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                    </span>

                    <div className="h-36 flex items-center justify-center py-1">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={0.5}
                        value={gain}
                        onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                        aria-label={`${EQ_15_LABELS[index]} Hz`}
                        className="h-32 w-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>

                    <span className="text-[10px] font-mono tabular-nums font-semibold text-gray-300">
                      {EQ_15_LABELS[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pt-2 scrollbar-none">
            <input
              type="text"
              value={headphoneQuery}
              onChange={(e) => setHeadphoneQuery(e.target.value)}
              placeholder="Search headphone or IEM model (e.g. Sony, AirPods, Moondrop, HD 600)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] text-xs font-medium text-white placeholder-gray-400 focus:outline-none"
            />

            <div className="divide-y divide-white/[0.07] rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              {filteredHeadphones.map((hp) => {
                const isSelected = autoEqProfile === hp.name;
                return (
                  <button
                    key={hp.name}
                    onClick={() => applyPreset(hp)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-sm font-bold text-white truncate">{hp.name}</h4>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Target Curve · {hp.target}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
                        Apply
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-3">
          15-Band Web Audio BiquadFilter cascade + Anti-Clipping Limiter · ReplayGain &amp; AutoEQ ready
        </p>
      </div>
    </div>
  );
};
