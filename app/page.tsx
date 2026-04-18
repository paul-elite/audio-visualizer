'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVisualizerStore } from '@/stores/visualizerStore';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number | null>(null);

  const { audioFile, audioUrl, setAudioFile, playback, setPlayback, audioData } = useVisualizerStore();
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

    // Draw waveform bars
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      if (x < progressX) {
        ctx.fillStyle = '#1a1a1a';
      } else {
        ctx.fillStyle = '#a0a0a0';
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw playhead
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
        <div className="mb-8">
          <div
            className="neu-pressed rounded-xl p-4 cursor-pointer"
            onClick={() => !audioFile && fileInputRef.current?.click()}
          >
            {audioFile ? (
              <canvas
                ref={canvasRef}
                className="w-full h-24 cursor-pointer"
                onClick={handleWaveformClick}
              />
            ) : (
              <div className="h-24 flex items-center justify-center">
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

        {/* Controls Section */}
        <div className="flex gap-6">
          {/* Info Panel */}
          <div className="flex-1 bg-[#1a1a1a] rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {playback.isPlaying && (
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    REC
                  </span>
                )}
                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">HD</span>
              </div>
              <span className="text-xs text-gray-400">
                {audioFile ? '1/1' : '0/0'}
              </span>
            </div>

            <div className="text-xs text-gray-400 mb-3">
              48.00 kHz • 16 bit
            </div>

            {/* Time Display */}
            <div className="font-mono-display text-4xl tracking-tight flex items-baseline gap-1">
              <span>{time.h.toString().padStart(2, '0')}</span>
              <span className="text-base text-gray-500">H</span>
              <span className="ml-2">{time.m.toString().padStart(2, '0')}</span>
              <span className="text-base text-gray-500">M</span>
              <span className="ml-2">{time.s.toString().padStart(2, '0')}</span>
              <span className="text-base text-gray-500">S</span>
            </div>
          </div>

          {/* File Info & Meters */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <p className="font-medium text-gray-800 truncate">
                {audioFile?.name || 'No file loaded'}
              </p>
              <p className="text-sm text-gray-500">
                {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(1)} MB` : '--'}
              </p>
            </div>

            {/* Level Meters */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">L</span>
                <div className="flex-1 h-3 bg-gray-300 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                    style={{ width: `${audioData.amplitude * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {audioData.amplitude > 0 ? `${Math.round(-60 + audioData.amplitude * 60)}dB` : '-∞dB'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">R</span>
                <div className="flex-1 h-3 bg-gray-300 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                    style={{ width: `${audioData.amplitude * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {audioData.amplitude > 0 ? `${Math.round(-60 + audioData.amplitude * 60)}dB` : '-∞dB'}
                </span>
              </div>
            </div>
          </div>

          {/* Circular Control */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Outer ring */}
              <div className="w-32 h-32 neu-convex rounded-full flex items-center justify-center">
                {/* Inner play button */}
                <button
                  onClick={togglePlayback}
                  disabled={!audioFile}
                  className="w-16 h-16 neu-button rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  {playback.isPlaying ? (
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Direction indicators */}
              <button className="absolute top-1 left-1/2 -translate-x-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button className="absolute bottom-1 left-1/2 -translate-x-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => seek(Math.max(0, playback.currentTime - 10))}
                className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => seek(Math.min(playback.duration, playback.currentTime + 10))}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Side buttons */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { seek(0); setPlayback({ isPlaying: false }); }}
                className="w-14 h-14 neu-button rounded-xl flex flex-col items-center justify-center gap-1"
              >
                <div className="w-4 h-4 bg-gray-700 rounded-sm" />
                <span className="text-[10px] text-gray-500">STOP</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 neu-button rounded-xl flex flex-col items-center justify-center gap-1"
              >
                <div className="w-4 h-4 bg-red-500 rounded-full" />
                <span className="text-[10px] text-gray-500">LOAD</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center gap-4 mt-8">
          <button className="w-12 h-12 neu-button rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="px-6 py-3 neu-button rounded-xl text-sm font-medium text-gray-600">
            HOME
          </button>
          <button className="px-6 py-3 neu-button rounded-xl text-sm font-medium text-gray-600">
            BACK
          </button>
          <button className="px-6 py-3 neu-pressed rounded-xl text-sm font-medium text-gray-800">
            DIVIDE
          </button>
          <button className="px-6 py-3 neu-button rounded-xl text-sm font-medium text-gray-600">
            OPTIONS
          </button>
        </div>
      </div>
    </main>
  );
}
