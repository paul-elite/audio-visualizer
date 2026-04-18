'use client';

import AudioPlayer from '@/components/AudioPlayer';
import VisualCanvas from '@/components/VisualCanvas';
import ControlsPanel from '@/components/ControlsPanel';
import ExportPanel from '@/components/ExportPanel';
import { useVisualizerStore } from '@/stores/visualizerStore';

export default function Home() {
  const { audioData, playback } = useVisualizerStore();

  return (
    <main className="h-screen bg-gray-950 text-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Audio Visualizer
                </h1>
                <p className="text-xs text-gray-500">
                  Real-time audio effects & visualization
                </p>
              </div>
            </div>

            {/* Audio meters */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">BASS</span>
                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-75"
                    style={{ width: `${audioData.bass * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">MIDS</span>
                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-75"
                    style={{ width: `${audioData.mids * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">HIGHS</span>
                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 transition-all duration-75"
                    style={{ width: `${audioData.highs * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar - Audio Player */}
          <aside className="w-80 flex-shrink-0 p-4 border-r border-gray-800/50 flex flex-col gap-4">
            <AudioPlayer />
            <ExportPanel />
          </aside>

          {/* Center - Visual Canvas */}
          <div className="flex-1 p-4 min-w-0">
            <VisualCanvas />
          </div>

          {/* Right sidebar - Controls */}
          <aside className="w-72 flex-shrink-0 border-l border-gray-800/50 bg-gray-900/30">
            <ControlsPanel />
          </aside>
        </div>

        {/* Footer */}
        <footer className="flex-shrink-0 px-6 py-2 border-t border-gray-800/50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {playback.isPlaying ? '● Playing' : '○ Paused'}
            </span>
            <span>
              Built with Next.js, Web Audio API & Canvas
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
