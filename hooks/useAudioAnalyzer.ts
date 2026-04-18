'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useVisualizerStore } from '@/stores/visualizerStore';
import { AudioData } from '@/types';

export function useAudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { setAudioData, settings, setPlayback, playback } = useVisualizerStore();

  const initializeAudio = useCallback((audioElement: HTMLAudioElement) => {
    // Don't recreate if already connected to this element
    if (audioElementRef.current === audioElement && audioContextRef.current) {
      return;
    }

    // Clean up existing
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    audioElementRef.current = audioElement;

    // Create audio context
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Create analyzer
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = settings.smoothing;
    analyzerRef.current = analyzer;

    // Create source from audio element
    const source = audioContext.createMediaElementSource(audioElement);
    sourceRef.current = source;

    // Connect: source -> analyzer -> destination
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
  }, [settings.smoothing]);

  const analyze = useCallback(() => {
    const analyzer = analyzerRef.current;
    if (!analyzer) return;

    const bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    analyzer.getByteFrequencyData(frequencyData);
    analyzer.getByteTimeDomainData(timeDomainData);

    // Calculate frequency bands
    const bassEnd = Math.floor(bufferLength * 0.1);
    const midsEnd = Math.floor(bufferLength * 0.5);

    let bassSum = 0;
    let midsSum = 0;
    let highsSum = 0;
    let amplitudeSum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const value = frequencyData[i];
      amplitudeSum += value;

      if (i < bassEnd) {
        bassSum += value;
      } else if (i < midsEnd) {
        midsSum += value;
      } else {
        highsSum += value;
      }
    }

    const bass = bassSum / bassEnd / 255;
    const mids = midsSum / (midsEnd - bassEnd) / 255;
    const highs = highsSum / (bufferLength - midsEnd) / 255;
    const amplitude = amplitudeSum / bufferLength / 255;

    const audioData: AudioData = {
      frequencyData,
      timeDomainData,
      bass,
      mids,
      highs,
      amplitude,
    };

    setAudioData(audioData);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [setAudioData]);

  const startAnalysis = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    analyze();
  }, [analyze]);

  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    audio.play();
    setPlayback({ isPlaying: true });
    startAnalysis();
  }, [setPlayback, startAnalysis]);

  const pause = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audio.pause();
    setPlayback({ isPlaying: false });
    stopAnalysis();
  }, [setPlayback, stopAnalysis]);

  const togglePlayback = useCallback(() => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playback.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setPlayback({ currentTime: time });
  }, [setPlayback]);

  const setVolume = useCallback((volume: number) => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audio.volume = volume;
    setPlayback({ volume });
  }, [setPlayback]);

  // Update smoothing when settings change
  useEffect(() => {
    if (analyzerRef.current) {
      analyzerRef.current.smoothingTimeConstant = settings.smoothing;
    }
  }, [settings.smoothing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAnalysis]);

  return {
    initializeAudio,
    play,
    pause,
    togglePlayback,
    seek,
    setVolume,
    startAnalysis,
    stopAnalysis,
  };
}
