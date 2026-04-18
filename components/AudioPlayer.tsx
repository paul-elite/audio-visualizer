'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVisualizerStore } from '@/stores/visualizerStore';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { audioFile, audioUrl, setAudioFile, playback, setPlayback } = useVisualizerStore();
  const { initializeAudio, play, pause, togglePlayback, seek } = useAudioAnalyzer();

  // Initialize audio when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    initializeAudio(audio);

    const handleLoadedMetadata = () => {
      setPlayback({ duration: audio.duration, currentTime: 0 });
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

  // Keyboard shortcut for play/pause
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
    }
  }, [setAudioFile]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  }, [seek]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />

      {/* File upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg"
        onChange={handleFileChange}
        className="hidden"
      />

      {!audioFile ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-cyan-500 hover:bg-cyan-500/5 transition-all group"
        >
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-gray-500 group-hover:text-cyan-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span className="text-gray-400 group-hover:text-gray-300 transition-colors">
              Drop audio file or click to upload
            </span>
            <span className="text-xs text-gray-600">
              MP3, WAV, OGG supported
            </span>
          </div>
        </button>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {audioFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setAudioFile(null)}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayback}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              {playback.isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <div className="flex-1 space-y-1">
              {/* Progress bar */}
              <input
                type="range"
                min={0}
                max={playback.duration || 0}
                value={playback.currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-cyan-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:hover:bg-cyan-400"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(playback.currentTime / (playback.duration || 1)) * 100}%, #374151 ${(playback.currentTime / (playback.duration || 1)) * 100}%, #374151 100%)`,
                }}
              />

              {/* Time display */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(playback.currentTime)}</span>
                <span>{formatTime(playback.duration)}</span>
              </div>
            </div>
          </div>

          {/* Keyboard hint */}
          <p className="text-xs text-gray-600 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Space</kbd> to play/pause
          </p>
        </div>
      )}
    </div>
  );
}
