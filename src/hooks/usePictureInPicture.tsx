/* eslint-disable react-refresh/only-export-components */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';

declare global {
  interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
  }
  interface DocumentPictureInPicture {
    requestWindow: (options?: DocumentPictureInPictureOptions) => Promise<Window>;
  }

  // eslint-disable-next-line no-var
  var documentPictureInPicture: DocumentPictureInPicture;
}

interface TimerState {
  mode: 'work' | 'break' | 'stopped';
  remaining: number;
  isChimePlaying: boolean;
  workDuration: number;
  breakDuration: number;
  workUrl: string;
  breakUrl: string;
}

interface PictureInPictureState {
  isSupported: boolean;
  isOpen: boolean;
  error: string | null;
  openPiP: () => Promise<void>;
  closePiP: () => void;
}

// PiPTimerコンポーネント（独立したReactコンポーネント）
const PiPTimerComponent: React.FC<{ timerState: TimerState }> = ({ timerState }) => {
  const { mode, remaining, isChimePlaying, workDuration, breakDuration, workUrl, breakUrl } = timerState;
  
  // YouTube動画IDを取得
  const currentUrl = mode === 'work' ? workUrl : breakUrl;
  const videoIdMatch = currentUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

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

  return (
    <div className="pip-container">
      {/* YouTube背景 */}
      {videoId && (
        <div className="pip-youtube-background">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&mute=1&enablejsapi=1`}
            className="pip-youtube-iframe"
            allow="autoplay; encrypted-media"
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

export const usePictureInPicture = (): PictureInPictureState => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const rootRef = useRef<Root | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Check if Document Picture-in-Picture is supported
  const isSupported = typeof documentPictureInPicture !== 'undefined';

  // 状態同期のための関数
  const syncState = useCallback(() => {
    if (!pipWindowRef.current || !rootRef.current) return;

    const timerState = useTimerStore.getState();
    const settingsState = useSettingsStore.getState();

    const combinedState: TimerState = {
      mode: timerState.mode,
      remaining: timerState.remaining,
      isChimePlaying: timerState.isChimePlaying,
      workDuration: settingsState.workDuration,
      breakDuration: settingsState.breakDuration,
      workUrl: settingsState.workUrl,
      breakUrl: settingsState.breakUrl,
    };

    rootRef.current.render(<PiPTimerComponent timerState={combinedState} />);
  }, []);

  const openPiP = useCallback(async () => {
    if (!isSupported) {
      setError('Picture-in-Picture is not supported in this browser');
      return;
    }

    if (isOpen) {
      setError('Picture-in-Picture window is already open');
      return;
    }

    try {
      setError(null);

      // Request PiP window
      const pipWindow = await documentPictureInPicture.requestWindow({
        width: 280,
        height: 200,
      });

      pipWindowRef.current = pipWindow;

      // Create style element with CSS
      const styleElement = pipWindow.document.createElement('style');
      styleElement.textContent = `
        body {
          margin: 0;
          padding: 16px;
          background: #111827;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          overflow: hidden;
        }
        
        .pip-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: calc(100vh - 32px);
          background: rgba(31, 41, 55, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 16px;
          overflow: hidden;
        }
        
        .pip-youtube-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        
        .pip-youtube-iframe {
          width: 120%;
          height: 120%;
          margin: -10%;
          border: none;
          pointer-events: none;
        }
        
        .pip-youtube-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
        }
        
        .pip-timer-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .pip-timer-circle {
          color: currentColor;
        }

        .pip-timer-text {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .pip-mode-text {
          font-size: 14px;
          opacity: 0.8;
          text-align: center;
          margin-bottom: 16px;
        }

        .text-red-500 { color: #ef4444; }
        .text-green-500 { color: #10b981; }
        .text-gray-400 { color: #9ca3af; }
        
        .relative { position: relative; }
        .inline-flex { display: inline-flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .mb-2 { margin-bottom: 0.5rem; }
        .absolute { position: absolute; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .font-bold { font-weight: 700; }
        .transform { transform: translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }
        .-rotate-90 { --tw-rotate: -90deg; }
        .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .duration-1000 { transition-duration: 1000ms; }
      `;
      pipWindow.document.head.appendChild(styleElement);

      // Create container for React app
      const container = pipWindow.document.createElement('div');
      pipWindow.document.body.appendChild(container);

      // Initialize React app in PiP window
      rootRef.current = createRoot(container);
      
      // Initial render
      syncState();

      // Set up periodic state sync
      intervalRef.current = setInterval(syncState, 100);

      // Handle window close
      pipWindow.addEventListener('pagehide', () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (rootRef.current) {
          rootRef.current.unmount();
          rootRef.current = null;
        }
        setIsOpen(false);
        pipWindowRef.current = null;
      });

      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open Picture-in-Picture window');
    }
  }, [isSupported, isOpen, syncState]);

  const closePiP = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  return {
    isSupported,
    isOpen,
    error,
    openPiP,
    closePiP,
  };
};