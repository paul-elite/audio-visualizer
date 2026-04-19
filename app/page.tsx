'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVisualizerStore } from '@/stores/visualizerStore';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { audioFile, audioUrl, setAudioFile, playback, setPlayback, audioData, settings, updateSettings } = useVisualizerStore();
  const { initializeAudio, togglePlayback, seek } = useAudioAnalyzer();

  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Initialize audio when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    initializeAudio(audio);

    const handleLoadedMetadata = () => {
      setPlayback({ duration: audio.duration, currentTime: 0 });
      generateWaveform(audio);
    };

    const handleTimeUpdate = () => {
      setPlayback({ currentTime: audio.currentTime });
    };

    const handleEnded = () => {
      setPlayback({ isPlaying: false, currentTime: 0 });
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, initializeAudio, setPlayback]);

  // Generate static waveform visualization
  const generateWaveform = async (audio: HTMLAudioElement) => {
    try {
      const response = await fetch(audio.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const rawData = audioBuffer.getChannelData(0);
      const samples = 200;
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData: number[] = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        filteredData.push(sum / blockSize);
      }

      const maxVal = Math.max(...filteredData);
      const normalized = filteredData.map(v => v / maxVal);
      setWaveformData(normalized);

      audioContext.close();
    } catch (e) {
      console.error('Failed to generate waveform:', e);
    }
  };

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const progress = playback.duration ? playback.currentTime / playback.duration : 0;
    const progressX = progress * width;

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = x < progressX ? '#1a1a1a' : '#a0a0a0';
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(progressX - 1, 0, 2, height);
  }, [waveformData, playback.currentTime, playback.duration]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && audioUrl) {
        e.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioUrl, togglePlayback]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setWaveformData([]);
    }
  }, [setAudioFile]);

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !playback.duration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    seek(progress * playback.duration);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return { h, m, s };
  };

  const formatTimeString = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const time = formatTime(playback.currentTime);
  const timeMarkers = playback.duration
    ? Array.from({ length: Math.ceil(playback.duration / 15) + 1 }, (_, i) => i * 15)
    : [0, 15, 30, 45, 60, 75, 90];

  return (
    <main className="min-h-screen bg-[#e8e8e8] flex items-center justify-center p-8">
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Container */}
      <div className="w-full max-w-4xl neu-flat rounded-3xl p-8">
        {/* Waveform Section */}
        <div className="mb-6">
          <div
            className="neu-pressed rounded-xl p-4 cursor-pointer"
            onClick={() => !audioFile && fileInputRef.current?.click()}
          >
            {audioFile ? (
              <canvas
                ref={canvasRef}
                className="w-full h-20 cursor-pointer"
                onClick={handleWaveformClick}
              />
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-gray-400">Click to upload audio file</p>
              </div>
            )}
          </div>

          {/* Time markers */}
          <div className="flex justify-between mt-2 px-2 text-xs text-gray-500">
            {timeMarkers.slice(0, 8).map((t) => (
              <span key={t}>{formatTimeString(t)}</span>
            ))}
          </div>
        </div>

        {/* Info & Controls Row */}
        <div className="flex gap-6 mb-6">
          {/* Info Panel */}
          <div className="w-48 bg-[#1a1a1a] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              {playback.isPlaying && (
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  PLAY
                </span>
              )}
              <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">HD</span>
            </div>

            <div className="text-xs text-gray-400 mb-2">
              {settings.speed.toFixed(1)}x speed
            </div>

            {/* Time Display */}
            <div className="font-mono-display text-2xl tracking-tight flex items-baseline gap-0.5">
              <span>{time.h.toString().padStart(2, '0')}</span>
              <span className="text-sm text-gray-500">H</span>
              <span className="ml-1">{time.m.toString().padStart(2, '0')}</span>
              <span className="text-sm text-gray-500">M</span>
              <span className="ml-1">{time.s.toString().padStart(2, '0')}</span>
              <span className="text-sm text-gray-500">S</span>
            </div>

            {/* File info */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 truncate">
                {audioFile?.name || 'No file'}
              </p>
              <p className="text-xs text-gray-500">
                {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(1)} MB` : '--'}
              </p>
            </div>
          </div>

          {/* Level Meters & Play Control */}
          <div className="flex-1 flex items-center gap-6">
            {/* Meters */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">L</span>
                <div className="flex-1 h-3 bg-gray-300 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                    style={{ width: `${audioData.amplitude * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">R</span>
                <div className="flex-1 h-3 bg-gray-300 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                    style={{ width: `${audioData.amplitude * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={togglePlayback}
              disabled={!audioFile}
              className="w-20 h-20 neu-button rounded-full flex items-center justify-center disabled:opacity-50"
            >
              {playback.isPlaying ? (
                <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            {/* Stop & Load */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { seek(0); setPlayback({ isPlaying: false }); }}
                className="px-4 py-2 neu-button rounded-lg text-xs font-medium text-gray-600"
              >
                STOP
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 neu-button rounded-lg text-xs font-medium text-gray-600"
              >
                LOAD
              </button>
            </div>
          </div>
        </div>

        {/* Effects Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Speed */}
          <div className="neu-pressed rounded-xl p-4">
            <label className="text-xs text-gray-500 block mb-2">SPEED</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speed}
              onChange={(e) => updateSettings({ speed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-400 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gray-700
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <span className="text-sm font-medium text-gray-700 mt-1 block">{settings.speed.toFixed(1)}x</span>
          </div>

          {/* Bass */}
          <div className="neu-pressed rounded-xl p-4">
            <label className="text-xs text-gray-500 block mb-2">BASS</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={settings.bass}
              onChange={(e) => updateSettings({ bass: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-400 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gray-700
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <span className="text-sm font-medium text-gray-700 mt-1 block">{settings.bass > 0 ? '+' : ''}{(settings.bass * 15).toFixed(0)} dB</span>
          </div>

          {/* Treble */}
          <div className="neu-pressed rounded-xl p-4">
            <label className="text-xs text-gray-500 block mb-2">TREBLE</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={settings.treble}
              onChange={(e) => updateSettings({ treble: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-400 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gray-700
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <span className="text-sm font-medium text-gray-700 mt-1 block">{settings.treble > 0 ? '+' : ''}{(settings.treble * 15).toFixed(0)} dB</span>
          </div>

          {/* Pitch */}
          <div className="neu-pressed rounded-xl p-4">
            <label className="text-xs text-gray-500 block mb-2">PITCH</label>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={settings.pitch}
              onChange={(e) => updateSettings({ pitch: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-400 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gray-700
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <span className="text-sm font-medium text-gray-700 mt-1 block">{settings.pitch > 0 ? '+' : ''}{settings.pitch} st</span>
          </div>
        </div>

        {/* Effect Toggles */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => updateSettings({ reverb: !settings.reverb })}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              settings.reverb ? 'neu-pressed text-gray-800' : 'neu-button text-gray-600'
            }`}
          >
            REVERB
          </button>
          <button
            onClick={() => updateSettings({ echo: !settings.echo })}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              settings.echo ? 'neu-pressed text-gray-800' : 'neu-button text-gray-600'
            }`}
          >
            ECHO
          </button>
          <button
            onClick={() => updateSettings({ vocalsOnly: !settings.vocalsOnly })}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              settings.vocalsOnly ? 'neu-pressed text-gray-800' : 'neu-button text-gray-600'
            }`}
          >
            VOCALS
          </button>
        </div>
      </div>
    </main>
  );
}
