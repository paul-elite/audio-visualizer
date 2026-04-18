'use client';

import { useVisualizerStore } from '@/stores/visualizerStore';
import { VisualizerMode } from '@/types';
import Dial from './Dial';

const modes: { key: VisualizerMode; label: string; icon: string }[] = [
  { key: 'bars', label: 'Bars', icon: '▮▯▮▯' },
  { key: 'waveform', label: 'Wave', icon: '∿' },
  { key: 'circular', label: 'Radial', icon: '◎' },
  { key: 'particles', label: 'Particles', icon: '✦' },
];

export default function ControlsPanel() {
  const { settings, updateSettings, setMode, presets, activePreset, applyPreset } = useVisualizerStore();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-6 p-4">
        {/* Mode Selection */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Visualization Mode
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setMode(mode.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.mode === mode.key
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        {/* Presets */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Presets
          </h3>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activePreset === preset.name
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-gray-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Colors
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Primary</span>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Secondary</span>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Background</span>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>
        </section>

        {/* Visual Controls (Dials) */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Visual Controls
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Dial
              label="Glow"
              value={settings.glowIntensity}
              min={0}
              max={1}
              onChange={(v) => updateSettings({ glowIntensity: v })}
              color="#06b6d4"
            />
            <Dial
              label="Lines"
              value={settings.lineThickness}
              min={1}
              max={10}
              step={1}
              onChange={(v) => updateSettings({ lineThickness: v })}
              color="#a855f7"
            />
            <Dial
              label="Particles"
              value={settings.particleCount}
              min={20}
              max={300}
              step={10}
              onChange={(v) => updateSettings({ particleCount: v })}
              color="#f97316"
            />
          </div>
        </section>

        {/* Motion Controls */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Motion
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Dial
              label="Sensitivity"
              value={settings.sensitivity}
              min={0.1}
              max={2}
              onChange={(v) => updateSettings({ sensitivity: v })}
              color="#22c55e"
            />
            <Dial
              label="Speed"
              value={settings.speed}
              min={0.1}
              max={2}
              onChange={(v) => updateSettings({ speed: v })}
              color="#eab308"
            />
            <Dial
              label="Smooth"
              value={settings.smoothing}
              min={0}
              max={0.99}
              onChange={(v) => updateSettings({ smoothing: v })}
              color="#ec4899"
            />
          </div>
        </section>

        {/* Audio Mapping */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Audio Mapping
          </h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-gray-400 group-hover:text-gray-300">
                Bass → Scale
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.bassToScale}
                  onChange={(e) => updateSettings({ bassToScale: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-cyan-500/50 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-gray-400 rounded-full peer-checked:translate-x-5 peer-checked:bg-cyan-400 transition-all" />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-gray-400 group-hover:text-gray-300">
                Mids → Rotation
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.midsToRotation}
                  onChange={(e) => updateSettings({ midsToRotation: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-500/50 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-gray-400 rounded-full peer-checked:translate-x-5 peer-checked:bg-purple-400 transition-all" />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-gray-400 group-hover:text-gray-300">
                Highs → Color
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.highsToColor}
                  onChange={(e) => updateSettings({ highsToColor: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-pink-500/50 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-gray-400 rounded-full peer-checked:translate-x-5 peer-checked:bg-pink-400 transition-all" />
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
