import React from 'react';

interface TimerCircleProps {
  total: number;
  remaining: number;
  colorClass: string;
}

const TimerCircle: React.FC<TimerCircleProps> = ({ total, remaining, colorClass }) => {
  const radius = 120;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (remaining / total) * circumference;

  // Format time as mm:ss
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={`${colorClass} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute text-4xl font-bold">{displayTime}</div>
      </div>
    </div>
  );
};

export default TimerCircle; 