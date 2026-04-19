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

  // Effect nodes
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);

  const { setAudioData, settings, setPlayback, playback } = useVisualizerStore();

  const createImpulseResponse = (context: AudioContext, duration: number, decay: number) => {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    return impulse;
  };

  const initializeAudio = useCallback((audioElement: HTMLAudioElement) => {
    if (audioElementRef.current === audioElement && audioContextRef.current) {
      return;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    audioElementRef.current = audioElement;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Create analyzer
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;
    analyzerRef.current = analyzer;

    // Create source
    const source = audioContext.createMediaElementSource(audioElement);
    sourceRef.current = source;

    // Create bass filter (low shelf)
    const bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = 0;
    bassFilterRef.current = bassFilter;

    // Create treble filter (high shelf)
    const trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3000;
    trebleFilter.gain.value = 0;
    trebleFilterRef.current = trebleFilter;

    // Create delay (echo)
    const delayNode = audioContext.createDelay(1.0);
    delayNode.delayTime.value = 0.3;
    delayNodeRef.current = delayNode;

    const delayGain = audioContext.createGain();
    delayGain.gain.value = 0;
    delayGainRef.current = delayGain;

    // Create convolver (reverb)
    const convolver = audioContext.createConvolver();
    convolver.buffer = createImpulseResponse(audioContext, 2, 2);
    convolverRef.current = convolver;

    const dryGain = audioContext.createGain();
    dryGain.gain.value = 1;
    dryGainRef.current = dryGain;

    const wetGain = audioContext.createGain();
    wetGain.gain.value = 0;
    wetGainRef.current = wetGain;

    // Connect nodes: source -> bass -> treble -> analyzer -> dry/wet -> destination
    source.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    trebleFilter.connect(analyzer);

    // Dry path
    analyzer.connect(dryGain);
    dryGain.connect(audioContext.destination);

    // Wet path (reverb)
    analyzer.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(audioContext.destination);

    // Echo path
    analyzer.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(audioContext.destination);
    delayGain.connect(delayNode); // Feedback loop

  }, []);

  const analyze = useCallback(() => {
    const analyzer = analyzerRef.current;
    if (!analyzer) return;

    const bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    analyzer.getByteFrequencyData(frequencyData);
    analyzer.getByteTimeDomainData(timeDomainData);

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

  // Update audio settings when they change
  useEffect(() => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.playbackRate = settings.speed;
    }
  }, [settings.speed]);

  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = settings.bass * 15; // -15 to +15 dB
    }
  }, [settings.bass]);

  useEffect(() => {
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = settings.treble * 15;
    }
  }, [settings.treble]);

  useEffect(() => {
    if (delayGainRef.current) {
      delayGainRef.current.gain.value = settings.echo ? 0.4 : 0;
    }
  }, [settings.echo]);

  useEffect(() => {
    if (wetGainRef.current && dryGainRef.current) {
      wetGainRef.current.gain.value = settings.reverb ? 0.5 : 0;
      dryGainRef.current.gain.value = settings.reverb ? 0.7 : 1;
    }
  }, [settings.reverb]);

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
    startAnalysis,
    stopAnalysis,
  };
}
