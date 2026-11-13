import React, { useState } from 'react';
import { X, Speaker, Bluetooth, Usb, Check, Headphones, Sliders } from 'lucide-react';
import { MasterWaveSettings } from '../services/themeService';
import { AUTO_EQ_HEADPHONES, audioEngine } from '../services/audioEngine';

interface AudioOutputModalProps {
  settings?: MasterWaveSettings;
  onUpdateSettings?: (patch: Partial<MasterWaveSettings>) => void;
  onOpenEqualizer?: () => void;
  onClose: () => void;
}

export const AudioOutputModal: React.FC<AudioOutputModalProps> = ({
  settings,
  onUpdateSettings,
  onOpenEqualizer,
  onClose
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string>(
    settings?.usbExclusiveOutput
      ? 'usbdac'
      : settings?.internalDirectOutput
      ? 'internal_direct'
      : 'phone'
  );
  const currentEq = audioEngine.getEqState();

  const devices = [
    {
      id: 'phone',
      title: 'Device Internal Speakers',
      desc: '48 kHz System Resampled · Standard HAL',
      icon: Speaker,
      isLossless: false
    },
    {
      id: 'internal_direct',
      title: 'Internal Direct HiRes Path',
      desc: 'Like UAPP HiRes Direct · 24-bit 192 kHz Bypass',
      icon: Speaker,
      isLossless: true
    },
    {
      id: 'bluetooth',
      title: 'Bluetooth Audio (LDAC / AAC)',
      desc: '990 kbps Adaptive Wireless Hi-Res',
      icon: Bluetooth,
      isLossless: false
    },
    {
      id: 'usbdac',
      title: 'USB Audio Class 2 DAC (Bit-Perfect)',
      desc: 'Dual-Crystal UAC2 · Bypasses OS AudioFlinger',
      icon: Usb,
      isLossless: true
    }
  ];

  const handleSelectDevice = (id: string) => {
    setSelectedDevice(id);
    if (onUpdateSettings) {
      if (id === 'usbdac') {
        onUpdateSettings({
          usbExclusiveOutput: true,
          internalDirectOutput: false,
          bitPerfectMode: true
        });
      } else if (id === 'internal_direct') {
        onUpdateSettings({
          usbExclusiveOutput: false,
          internalDirectOutput: true,
          bitPerfectMode: false
        });
      } else {
        onUpdateSettings({
          usbExclusiveOutput: false,
          internalDirectOutput: false,
          bitPerfectMode: false
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-[#141716] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[88dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-display text-base font-extrabold text-white tracking-tight">
              Audio Output &amp; AutoEQ Panel
            </h3>
            <p className="text-xs text-gray-400">Select Hardware Path, Bit-Perfect DAC &amp; AutoEQ</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device List */}
        <div className="space-y-2.5 py-4">
          {devices.map((device) => {
            const Icon = device.icon;
            const isSelected = selectedDevice === device.id;

            return (
              <button
                key={device.id}
                onClick={() => handleSelectDevice(device.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{device.title}</span>
                      {device.isLossless && (
                        <span className="text-[10px] font-mono font-bold text-emerald-300">
                          BIT-PERFECT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{device.desc}</p>
                  </div>
                </div>

                {isSelected && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Quick AutoEQ & Parametric EQ Shortcut (LastWave "Show Auto EQ in volume panel") */}
        {(!settings || settings.showAutoEqInVolume) && (
          <div className="mb-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>Quick AutoEQ Curve</span>
              </div>
              {onOpenEqualizer && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenEqualizer();
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>15-Band EQ</span>
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {AUTO_EQ_HEADPHONES.slice(0, 5).map((hp) => {
                const active = currentEq.autoEqProfile === hp.name;
                return (
                  <button
                    key={hp.name}
                    onClick={() => {
                      audioEngine.setEqualizerGains(hp.gains, hp.name, -3, hp.name);
                      onUpdateSettings?.({ autoEqEnabled: true });
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    {hp.name.split(' (')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.99]"
        >
          Confirm Output
        </button>
      </div>
    </div>
  );
};
