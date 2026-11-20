import React from 'react';
import {
  X,
  Camera,
  Mic,
  Volume2,
  Sliders,
  Sparkles,
  Flame,
  Moon,
  Tv,
  Check,
  ShieldCheck,
  Film,
} from 'lucide-react';
import { RoomSettings, AmbientLightingMood } from '../types';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onUpdateSettings: (newSettings: RoomSettings) => void;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedVideoDevice: string;
  selectedAudioDevice: string;
  selectedAudioOutput: string;
  onSelectVideoDevice: (id: string) => void;
  onSelectAudioDevice: (id: string) => void;
  onSelectAudioOutput: (id: string) => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  videoDevices,
  audioDevices,
  audioOutputDevices,
  selectedVideoDevice,
  selectedAudioDevice,
  selectedAudioOutput,
  onSelectVideoDevice,
  onSelectAudioDevice,
  onSelectAudioOutput,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof RoomSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleLightingChange = (mode: AmbientLightingMood) => {
    onUpdateSettings({
      ...settings,
      ambientLighting: mode,
      ambientLightingEnabled: true,
    });
  };

  const handleToggleAmbientLighting = () => {
    const isCurrentlyEnabled = settings.ambientLightingEnabled !== false;
    onUpdateSettings({
      ...settings,
      ambientLightingEnabled: !isCurrentlyEnabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-white text-base">Room & Device Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-5">
          {/* Hardware Devices */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Audio & Video Hardware
            </h4>

            {/* Camera */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                <Camera className="w-3.5 h-3.5 text-zinc-400" />
                <span>Camera Device</span>
              </label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => onSelectVideoDevice(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-200 p-2.5 focus:outline-none focus:border-rose-500"
              >
                <option value="">Default Web Camera</option>
                {videoDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Microphone */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                <Mic className="w-3.5 h-3.5 text-zinc-400" />
                <span>Microphone Device</span>
              </label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => onSelectAudioDevice(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-200 p-2.5 focus:outline-none focus:border-rose-500"
              >
                <option value="">Default Microphone</option>
                {audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker */}
            {audioOutputDevices.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Audio Output (Speakers / Headphones)</span>
                </label>
                <select
                  value={selectedAudioOutput}
                  onChange={(e) => onSelectAudioOutput(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-200 p-2.5 focus:outline-none focus:border-rose-500"
                >
                  <option value="">Default Audio Output</option>
                  {audioOutputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="h-px bg-white/5" />

          {/* Ambient Lighting / Atmosphere */}
          <div className="space-y-3.5">
            {/* Ambient Lighting Toggle Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5">
              <div className="pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <p className="text-xs font-semibold text-white">Ambient Lighting</p>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Adjusts the background backdrop color to simulate different moods
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAmbientLighting}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  settings.ambientLightingEnabled !== false ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
                title="Toggle Ambient Lighting"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.ambientLightingEnabled !== false ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Mood Cards */}
            <div
              className={`transition-all duration-300 ${
                settings.ambientLightingEnabled !== false ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Backdrop Mood & Aura
                </span>
                <span className="text-[10px] text-zinc-500">
                  {settings.ambientLighting === 'candlelight'
                    ? 'Warm Glow Active'
                    : settings.ambientLighting === 'midnight'
                    ? 'Deep Blue Active'
                    : settings.ambientLighting === 'cinema'
                    ? 'Dim Grey Active'
                    : settings.ambientLighting === 'neon-rose'
                    ? 'Magenta Active'
                    : 'Pure OLED Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'candlelight',
                    label: 'Candlelight',
                    tag: 'Warm Glow',
                    desc: 'Warm romantic amber ambiance',
                    icon: Flame,
                    glowColor: 'from-amber-500/30 to-amber-900/10',
                    dotColor: 'bg-amber-400',
                    borderColor: 'border-amber-500/50',
                    activeBg: 'bg-amber-950/30',
                  },
                  {
                    id: 'midnight',
                    label: 'Midnight',
                    tag: 'Deep Blue',
                    desc: 'Deep atmospheric indigo night',
                    icon: Moon,
                    glowColor: 'from-blue-500/30 to-blue-900/10',
                    dotColor: 'bg-blue-400',
                    borderColor: 'border-blue-500/50',
                    activeBg: 'bg-blue-950/30',
                  },
                  {
                    id: 'cinema',
                    label: 'Cinema',
                    tag: 'Dim Grey',
                    desc: 'Dim grey theatrical contrast',
                    icon: Film,
                    glowColor: 'from-zinc-400/20 to-zinc-800/10',
                    dotColor: 'bg-zinc-300',
                    borderColor: 'border-zinc-400/50',
                    activeBg: 'bg-zinc-800/40',
                  },
                  {
                    id: 'neon-rose',
                    label: 'Neon Rose',
                    tag: 'Romantic Aura',
                    desc: 'Soft cinematic magenta aura',
                    icon: Sparkles,
                    glowColor: 'from-rose-500/30 to-pink-900/10',
                    dotColor: 'bg-rose-400',
                    borderColor: 'border-rose-500/50',
                    activeBg: 'bg-rose-950/30',
                  },
                  {
                    id: 'pure-oled',
                    label: 'Pure OLED',
                    tag: 'Pitch Black',
                    desc: 'Zero backlight, max contrast',
                    icon: Tv,
                    glowColor: 'from-zinc-800/10 to-black',
                    dotColor: 'bg-zinc-600',
                    borderColor: 'border-zinc-500/40',
                    activeBg: 'bg-zinc-950',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = settings.ambientLighting === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLightingChange(item.id as AmbientLightingMood)}
                      className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden group ${
                        isSelected
                          ? `${item.borderColor} ${item.activeBg} shadow-md`
                          : 'border-white/5 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/10'
                      }`}
                    >
                      {/* Ambient swatch glow preview */}
                      <div
                        className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-gradient-to-br ${item.glowColor} blur-xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
                      />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                            <span className="text-xs font-bold text-white">{item.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-rose-300/90">{item.tag}</span>
                          <span className="text-zinc-600 text-[10px]">·</span>
                          <span className="text-[10px] text-zinc-400 truncate">{item.desc}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Room Permissions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Date Room Permissions</span>
            </h4>

            {/* Allow Guest Controls */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Allow Partner to Control Playback</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Your partner can pause, seek, and resume the movie.
                </p>
              </div>
              <button
                onClick={() => handleToggle('allowGuestControl')}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.allowGuestControl ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.allowGuestControl ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Chat Enabled */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Enable Live Chat</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Show side chat panel and text bubbles</p>
              </div>
              <button
                onClick={() => handleToggle('chatEnabled')}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.chatEnabled ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.chatEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Reactions Enabled */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Floating Screen Reactions</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Show animated floating hearts and popcorn</p>
              </div>
              <button
                onClick={() => handleToggle('reactionsEnabled')}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.reactionsEnabled ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.reactionsEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
