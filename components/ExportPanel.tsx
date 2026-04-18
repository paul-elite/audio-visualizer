'use client';

import { useState, useRef, useCallback } from 'react';
import { useVisualizerStore } from '@/stores/visualizerStore';

type ExportFormat = 'mp4' | 'gif' | 'png';
type Resolution = '1080p' | '4k';

const resolutions: Record<Resolution, { width: number; height: number }> = {
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
};

export default function ExportPanel() {
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [duration, setDuration] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { playback, audioUrl } = useVisualizerStore();

  const handleExport = useCallback(async () => {
    if (!audioUrl) {
      alert('Please upload an audio file first');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      // Get the canvas element
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      if (format === 'png') {
        // Export single frame as PNG
        const link = document.createElement('a');
        link.download = `visualizer-frame-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setProgress(100);
      } else if (format === 'gif' || format === 'mp4') {
        // For video/gif export, we need MediaRecorder
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: format === 'mp4' ? 'video/webm;codecs=vp9' : 'video/webm',
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, {
            type: format === 'mp4' ? 'video/webm' : 'video/webm',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `visualizer-${Date.now()}.${format === 'mp4' ? 'webm' : 'webm'}`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setProgress(100);
        };

        mediaRecorder.start();

        // Record for specified duration
        const totalMs = duration * 1000;
        const updateInterval = 100;
        let elapsed = 0;

        const progressInterval = setInterval(() => {
          elapsed += updateInterval;
          setProgress((elapsed / totalMs) * 100);

          if (elapsed >= totalMs) {
            clearInterval(progressInterval);
            mediaRecorder.stop();
          }
        }, updateInterval);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 1000);
    }
  }, [audioUrl, format, duration]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-white mb-4">Export</h3>

      <div className="space-y-4">
        {/* Format selection */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Format</label>
          <div className="flex gap-2">
            {(['mp4', 'gif', 'png'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium uppercase transition-all ${
                  format === f
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution selection */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Resolution</label>
          <div className="flex gap-2">
            {(['1080p', '4k'] as Resolution[]).map((r) => (
              <button
                key={r}
                onClick={() => setResolution(r)}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  resolution === r
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                }`}
              >
                {r}
                <span className="text-gray-600 ml-1">
                  ({resolutions[r].width}x{resolutions[r].height})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration (for video/gif) */}
        {format !== 'png' && (
          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Duration: {duration}s
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-purple-500
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        )}

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting || !audioUrl}
          className={`w-full py-2.5 rounded-lg font-medium transition-all ${
            isExporting || !audioUrl
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
          }`}
        >
          {isExporting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Exporting... {Math.round(progress)}%
            </span>
          ) : (
            `Export ${format.toUpperCase()}`
          )}
        </button>

        {/* Progress bar */}
        {isExporting && (
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {!audioUrl && (
          <p className="text-xs text-gray-500 text-center">
            Upload audio to enable export
          </p>
        )}
      </div>
    </div>
  );
}
