'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface DialProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  color?: string;
}

export default function Dial({
  value,
  min,
  max,
  step = 0.01,
  label,
  unit = '',
  onChange,
  color = '#06b6d4',
}: DialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135; // -135 to 135 degrees

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  }, [value]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const sensitivity = (max - min) / 150; // Adjust sensitivity
      let newValue = startValue.current + deltaY * sensitivity;

      // Clamp and step
      newValue = Math.max(min, Math.min(max, newValue));
      newValue = Math.round(newValue / step) * step;

      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  // Format display value
  const displayValue = step >= 1 ? Math.round(value) : value.toFixed(2);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>

      <div
        ref={dialRef}
        className={`relative w-14 h-14 rounded-full cursor-pointer select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        style={{
          background: `conic-gradient(from -135deg, ${color} ${percentage * 0.75}%, #1f2937 ${percentage * 0.75}%)`,
        }}
      >
        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-gray-900 flex items-center justify-center">
          {/* Indicator line */}
          <div
            className="absolute w-0.5 h-4 rounded-full"
            style={{
              backgroundColor: color,
              transformOrigin: 'bottom center',
              transform: `translateY(-8px) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Glow effect when dragging */}
        {isDragging && (
          <div
            className="absolute -inset-1 rounded-full opacity-30 blur-md"
            style={{ backgroundColor: color }}
          />
        )}
      </div>

      <span className="text-sm font-mono text-gray-300">
        {displayValue}
        {unit && <span className="text-gray-500 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
