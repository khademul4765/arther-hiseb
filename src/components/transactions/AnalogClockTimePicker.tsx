import React, { useState } from 'react';

interface AnalogClockTimePickerProps {
  value?: string; // 'HH:mm'
  onChange: (value: string) => void;
  darkMode?: boolean;
  onCancel?: () => void;
}

function getCoords(center: number, radius: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

export const AnalogClockTimePicker: React.FC<AnalogClockTimePickerProps> = ({ value, onChange, darkMode, onCancel }) => {
  // 12-hour mode with AM/PM
  const [ampm, setAMPM] = useState<'AM' | 'PM'>(() => {
    if (value) {
      const [h] = value.split(':').map(Number);
      return h >= 12 ? 'PM' : 'AM';
    }
    return 'AM';
  });
  const [selecting, setSelecting] = useState<'hour' | 'minute'>('hour');
  const [internal, setInternal] = useState(() => {
    if (value) {
      let [h, m] = value.split(':').map(Number);
      if (h === 0) h = 12;
      if (h > 12) h -= 12;
      return { hour: h, minute: m };
    }
    return { hour: 12, minute: 0 };
  });

  // Reduce the size for a more compact clock
  const size = 220;
  const center = size / 2;
  const radius = size / 2 - 22;
  const hour = internal.hour;
  const minute = internal.minute;

  const handleClockClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    let deg = angle < 0 ? angle + 360 : angle;
    if (selecting === 'hour') {
      let h = Math.round(deg / 30);
      if (h === 0) h = 12;
      setInternal(prev => ({ ...prev, hour: h }));
      setSelecting('minute');
    } else {
      let m = Math.round(deg / 6);
      if (m === 60) m = 0;
      setInternal(prev => ({ ...prev, minute: m }));
      // Stay on minute selection until OK is pressed
    }
  };

  const handAngle = selecting === 'hour' ? (hour % 12) * 30 : minute * 6;
  const handLength = selecting === 'hour' ? radius * 0.6 : radius * 0.85;
  const handCoords = getCoords(center, handLength, handAngle);

  // Theme
  const green = '#22c55e';
  const headerBg = green;
  const headerFg = '#fff';
  const clockBg = darkMode ? '#222' : '#f3f3f3';
  const fg = '#222';
  const handColor = green;
  const selectedCircle = green;
  const selectedFg = '#fff';

  // Format display time
  const displayHour = hour === 0 ? 12 : hour;
  const displayMinute = String(minute).padStart(2, '0');

  // Confirm selection
  const handleOk = () => {
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  return (
    <div style={{ width: size + 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0003', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', background: headerBg, color: headerFg, padding: '16px 0 8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: 2 }}>
          <span style={{ fontWeight: selecting === 'hour' ? 700 : 400, opacity: selecting === 'hour' ? 1 : 0.7, cursor: 'pointer' }} onClick={() => setSelecting('hour')}>{String(displayHour).padStart(2, '0')}</span>
          <span style={{ fontWeight: 400, opacity: 0.7 }}>:</span>
          <span style={{ fontWeight: selecting === 'minute' ? 700 : 400, opacity: selecting === 'minute' ? 1 : 0.7, cursor: 'pointer' }} onClick={() => setSelecting('minute')}>{displayMinute}</span>
        </div>
        <div style={{ position: 'absolute', right: 16, top: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{ fontSize: 18, fontWeight: ampm === 'AM' ? 700 : 400, color: ampm === 'AM' ? headerFg : '#d1fae5', cursor: 'pointer', lineHeight: 1 }}
            onClick={() => setAMPM('AM')}
          >AM</span>
          <span
            style={{ fontSize: 18, fontWeight: ampm === 'PM' ? 700 : 400, color: ampm === 'PM' ? headerFg : '#d1fae5', cursor: 'pointer', lineHeight: 1 }}
            onClick={() => setAMPM('PM')}
          >PM</span>
        </div>
      </div>
      {/* Clock */}
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <svg width={size} height={size} onClick={handleClockClick} style={{ cursor: 'pointer', background: 'transparent', borderRadius: '50%' }}>
          <circle cx={center} cy={center} r={radius} fill={clockBg} />
          {/* Hour numbers */}
          {selecting === 'hour' && Array.from({ length: 12 }).map((_, i) => {
            const ang = (i + 1) * 30;
            const { x, y } = getCoords(center, radius - 22, ang);
            const isSelected = hour === (i + 1);
            return (
              <g key={i}>
                {isSelected && (
                  <circle cx={x} cy={y + 7} r={16} fill={selectedCircle} />
                )}
                <text x={x} y={y + 13} textAnchor="middle" fontSize={18} fill={isSelected ? selectedFg : fg} style={{ fontWeight: isSelected ? 700 : 400 }}>{i + 1}</text>
              </g>
            );
          })}
          {/* Minute dots */}
          {selecting === 'minute' && Array.from({ length: 60 }).map((_, i) => {
            const ang = i * 6;
            const { x, y } = getCoords(center, radius - 14, ang);
            const isSelected = i === minute;
            return (
              <g key={i}>
                {isSelected && <circle cx={x} cy={y} r={7} fill={selectedCircle} />}
                <circle cx={x} cy={y} r={i % 5 === 0 ? 4 : 2} fill={isSelected ? selectedFg : fg} />
                {i % 5 === 0 && (
                  <text x={x} y={y + 6} textAnchor="middle" fontSize={10} fill={isSelected ? selectedFg : fg} style={{ fontWeight: isSelected ? 700 : 400 }}>{i === 0 ? '00' : i}</text>
                )}
              </g>
            );
          })}
          {/* Hand */}
          <line x1={center} y1={center} x2={handCoords.x} y2={handCoords.y} stroke={handColor} strokeWidth={4} />
          <circle cx={center} cy={center} r={7} fill={handColor} />
        </svg>
      </div>
      {/* Actions */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 18px 12px 18px', background: '#fff' }}>
        <button
          style={{ background: 'none', border: 'none', color: green, fontWeight: 500, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}
          onClick={onCancel}
        >CANCEL</button>
        <button
          style={{ background: 'none', border: 'none', color: green, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}
          onClick={handleOk}
        >OK</button>
      </div>
    </div>
  );
};
