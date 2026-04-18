'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVisualizerStore } from '@/stores/visualizerStore';

export default function VisualCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  const { audioData, settings, playback } = useVisualizerStore();

  // Resize canvas to container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const drawBars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { frequencyData, bass } = audioData;
    const barCount = frequencyData.length;
    const barWidth = width / barCount;
    const sensitivity = settings.sensitivity;
    const scale = settings.bassToScale ? 1 + bass * 0.3 : 1;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, settings.primaryColor);
    gradient.addColorStop(1, settings.secondaryColor);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i] / 255;
      const barHeight = value * height * 0.8 * sensitivity;
      const x = i * barWidth;
      const y = height - barHeight;

      ctx.fillStyle = gradient;

      // Add glow
      if (settings.glowIntensity > 0) {
        ctx.shadowColor = settings.primaryColor;
        ctx.shadowBlur = 20 * settings.glowIntensity;
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    ctx.restore();
  }, [audioData, settings]);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { timeDomainData, amplitude } = audioData;
    const sensitivity = settings.sensitivity;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness;

    if (settings.glowIntensity > 0) {
      ctx.shadowColor = settings.primaryColor;
      ctx.shadowBlur = 15 * settings.glowIntensity;
    }

    const sliceWidth = width / timeDomainData.length;
    let x = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const value = timeDomainData[i] / 128.0 - 1;
      const y = centerY + value * (height / 2) * sensitivity;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Mirror effect
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.strokeStyle = settings.secondaryColor;
    x = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const value = timeDomainData[i] / 128.0 - 1;
      const y = centerY - value * (height / 2) * sensitivity;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [audioData, settings]);

  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { frequencyData, bass, mids } = audioData;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.25;
    const sensitivity = settings.sensitivity;

    // Update rotation
    if (settings.midsToRotation && playback.isPlaying) {
      rotationRef.current += mids * settings.speed * 0.05;
    }

    const scale = settings.bassToScale ? 1 + bass * 0.2 : 1;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRef.current);
    ctx.scale(scale, scale);

    // Draw circular bars
    const barCount = frequencyData.length / 2;
    const angleStep = (Math.PI * 2) / barCount;

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i] / 255;
      const barHeight = value * baseRadius * sensitivity;
      const angle = i * angleStep;

      const x1 = Math.cos(angle) * baseRadius;
      const y1 = Math.sin(angle) * baseRadius;
      const x2 = Math.cos(angle) * (baseRadius + barHeight);
      const y2 = Math.sin(angle) * (baseRadius + barHeight);

      // Color shift based on highs
      let color = settings.primaryColor;
      if (settings.highsToColor) {
        const hue = (i / barCount) * 360;
        color = `hsl(${hue}, 80%, 60%)`;
      }

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = settings.lineThickness;

      if (settings.glowIntensity > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * settings.glowIntensity;
      }

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Inner circle
    ctx.beginPath();
    ctx.strokeStyle = settings.secondaryColor;
    ctx.lineWidth = 2;
    ctx.arc(0, 0, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [audioData, settings, playback.isPlaying]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { amplitude, bass, highs } = audioData;
    const particleCount = settings.particleCount;
    const sensitivity = settings.sensitivity;
    const time = Date.now() * 0.001 * settings.speed;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time;
      const baseRadius = Math.min(width, height) * 0.3;
      const radiusVariation = amplitude * baseRadius * sensitivity;
      const radius = baseRadius + radiusVariation + Math.sin(angle * 3 + time) * 20;

      const x = width / 2 + Math.cos(angle) * radius;
      const y = height / 2 + Math.sin(angle) * radius;
      const size = 2 + bass * 8;

      // Color based on position and highs
      let color = settings.primaryColor;
      if (settings.highsToColor) {
        const hue = ((i / particleCount) * 360 + highs * 180) % 360;
        color = `hsl(${hue}, 80%, 60%)`;
      }

      ctx.beginPath();
      ctx.fillStyle = color;

      if (settings.glowIntensity > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * settings.glowIntensity;
      }

      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [audioData, settings]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw based on mode
    switch (settings.mode) {
      case 'bars':
        drawBars(ctx, width, height);
        break;
      case 'waveform':
        drawWaveform(ctx, width, height);
        break;
      case 'circular':
        drawCircular(ctx, width, height);
        break;
      case 'particles':
        drawParticles(ctx, width, height);
        break;
    }

    animationRef.current = requestAnimationFrame(render);
  }, [settings, drawBars, drawWaveform, drawCircular, drawParticles]);

  // Start/stop rendering based on playback
  useEffect(() => {
    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden border border-gray-800"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
