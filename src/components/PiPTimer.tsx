import React from 'react';
import YouTubeEmbed from './YouTubeEmbed';

interface TimerState {
  mode: 'work' | 'break' | 'stopped';
  remaining: number;
  isChimePlaying: boolean;
  workDuration: number;
  breakDuration: number;
  workUrl: string;
  breakUrl: string;
}

interface PiPTimerProps {
  timerState: TimerState;
}

const PiPTimer: React.FC<PiPTimerProps> = ({ timerState }) => {
  const { mode, remaining, isChimePlaying, workDuration, breakDuration, workUrl, breakUrl } = timerState;
  
  // Get current URL based on mode
  const currentUrl = mode === 'work' ? workUrl : breakUrl;
  
  // Calculate total duration based on current mode
  const total = mode === 'work' ? workDuration * 60 : breakDuration * 60;
  
  // Circle configuration for smaller PiP display
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (remaining / total) * circumference;

  // Format time as mm:ss
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Determine color and mode text
  const colorClass = mode === 'work' ? 'text-red-500' : 'text-green-500';
  const modeText = mode === 'work' ? '作業中' : mode === 'break' ? '休憩中' : 'ポモドーロ';

  // Special display when chime is playing
  if (isChimePlaying) {
    return (
      <div className="pip-container">
        <div className="pip-mode-text">{modeText}</div>
        <div className="pip-timer-text">準備中... ♪</div>
      </div>
    );
  }

  // Show stopped state
  if (mode === 'stopped') {
    return (
      <div className="pip-container">
        <div className="pip-mode-text">ポモドーロタイマー</div>
        <div className="pip-timer-text text-gray-400">停止中</div>
      </div>
    );
  }

  // Determine if video should be playing
  const shouldPlay = (mode === 'work' || mode === 'break') && !isChimePlaying;

  return (
    <div className="pip-container">
      {/* YouTube背景 */}
      {currentUrl && (
        <div className="pip-youtube-background">
          <YouTubeEmbed
            url={currentUrl}
            playing={shouldPlay}
            className="pip-youtube-iframe"
          />
          <div className="pip-youtube-overlay"></div>
        </div>
      )}
      
      {/* タイマー表示 */}
      <div className="pip-timer-content">
        <div className="pip-mode-text">{modeText}</div>
        <div className="relative inline-flex items-center justify-center mb-2">
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
              className={`${colorClass} transition-all duration-1000 pip-timer-circle`}
            />
          </svg>
          <div className="absolute text-xl font-bold">{displayTime}</div>
        </div>
      </div>
    </div>
  );
};

export default PiPTimer; 