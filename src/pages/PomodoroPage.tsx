import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import { useRecordStore } from '../stores/recordStore';
import { useInterval } from '../hooks/useInterval';
import { useYouTubeEmbed } from '../utils/youtube';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import TimerCircle from '../components/TimerCircle';
import TimerControls from '../components/TimerControls';
import YouTubeBackground, { type YouTubePlayerRef } from '../components/YouTubeBackground';
import RecordList from '../components/RecordList';
import SettingsForm from '../components/SettingsForm';
import YouTubeEmbed from '../components/YouTubeEmbed';
import TabBar from '../components/TabBar';

type TabType = 'timer' | 'record' | 'settings';

const PomodoroPage: React.FC = () => {
  const {
    workUrl,
    breakUrl,
    workDuration,
    breakDuration,
    workVideoProgress,
    breakVideoProgress,
    setWorkVideoProgress,
    setBreakVideoProgress
  } = useSettingsStore();

  const {
    mode,
    remaining,
    isRunning,
    start,
    tick,
    stop,
    setChimePlaying
  } = useTimerStore();

  const { addRecord } = useRecordStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('timer');

  // Picture-in-Picture
  const { isSupported: pipSupported, isOpen: pipOpen, error: pipError, pipWindow, openPiP, closePiP } = usePictureInPicture();

  // Timer session tracking
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [totalWork, setTotalWork] = useState(0);
  const [totalBreak, setTotalBreak] = useState(0);
  const [lastTick, setLastTick] = useState<number | null>(null);

  // Chime management
  const [hasPlayedWarningChime, setHasPlayedWarningChime] = useState(false);

  // Error message state
  const [errorMessage, setErrorMessage] = useState('');

  // Audio for timer start/end
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio for warning chime (3 seconds before end)
  const warningAudioRef = useRef<HTMLAudioElement | null>(null);

  // YouTube player ref for controlling video
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null);

  // PiP user interaction tracking
  const [pipHasInteracted, setPipHasInteracted] = useState(false);

  // Ad bypass state for temporarily disabling pointer events
  const [adBypassActive, setAdBypassActive] = useState(false);
  const adBypassTimerRef = useRef<number | null>(null);

  // Helper function to stop chime audio completely
  const stopChimeAudio = useCallback(() => {
    // Stop start chime
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
    }

    // Stop warning chime
    if (warningAudioRef.current) {
      warningAudioRef.current.pause();
      warningAudioRef.current.currentTime = 0;
    }

    setChimePlaying(false);
  }, [setChimePlaying]);

  // Get video ID based on current mode
  const currentUrl = mode === 'work' ? workUrl : breakUrl;
  const { videoId } = useYouTubeEmbed(currentUrl);

  // chime.wavのURLを、場合に応じて変更する
  const isGitHubPages = window.location.hostname.includes('github.io');
  const chimeUrl = isGitHubPages ? '/yopomo/assets/chime.wav' : '/src/assets/chime.wav';

  // Function to save current video progress
  const saveVideoProgress = useCallback(() => {
    if (youtubePlayerRef.current && mode !== 'stopped') {
      const currentTime = youtubePlayerRef.current.getCurrentTime();
      if (mode === 'work') {
        setWorkVideoProgress(currentTime);
      } else if (mode === 'break') {
        setBreakVideoProgress(currentTime);
      }
    }
  }, [mode, setWorkVideoProgress, setBreakVideoProgress]);

  // Get start time for current mode
  const getStartTime = () => {
    if (mode === 'work') {
      return workVideoProgress;
    } else if (mode === 'break') {
      return breakVideoProgress;
    }
    return 0;
  };

  // Setup the interval for timer ticking
  useInterval(
    () => {
      tick();
      // Track time spent in each mode
      const now = Date.now();
      if (lastTick && isRunning) {
        const diff = (now - lastTick) / 1000;
        if (mode === 'work') {
          setTotalWork(prev => prev + diff);
        } else if (mode === 'break') {
          setTotalBreak(prev => prev + diff);
        }
      }
      setLastTick(now);
    },
    isRunning ? 1000 : null
  );

  // Handle 3-second warning chime
  useEffect(() => {
    if (remaining === 3 && isRunning && !hasPlayedWarningChime) {
      const { isChimePlaying } = useTimerStore.getState();
      if (!isChimePlaying) {
        if (!warningAudioRef.current) {
          warningAudioRef.current = new Audio(chimeUrl);
        } else {
          warningAudioRef.current.currentTime = 0;
        }
        warningAudioRef.current.play();
        setHasPlayedWarningChime(true);
      }
    }
  }, [remaining, isRunning, hasPlayedWarningChime, chimeUrl]);

  // Handle timer completion and auto-switch between work/break
  useEffect(() => {
    if (remaining === 0 && isRunning) {
      // Save current video progress before switching modes
      saveVideoProgress();

      // Auto-switch to next phase (no chime)
      if (mode === 'work') {
        // Work finished -> Start break
        start('break', breakDuration * 60, true);
      } else if (mode === 'break') {
        // Break finished -> Start work
        start('work', workDuration * 60, true);
      }

      // Reset warning chime flag for next cycle
      setHasPlayedWarningChime(false);
      setLastTick(Date.now());
    }
  }, [remaining, isRunning, mode, workDuration, breakDuration, saveVideoProgress, start]);

  // Reset video progress when URL changes
  useEffect(() => {
    setWorkVideoProgress(0);
  }, [workUrl, setWorkVideoProgress]);

  useEffect(() => {
    setBreakVideoProgress(0);
  }, [breakUrl, setBreakVideoProgress]);

  // Cleanup chime audio on unmount
  useEffect(() => {
    return () => {
      stopChimeAudio();
    };
  }, [stopChimeAudio]);

  // Handle starting timer
  const handleStart = () => {
    // Check if YouTube URL is set
    if (!workUrl.trim()) {
      setErrorMessage('作業用のYouTube動画URLを設定してください');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Start with work mode
    start('work', workDuration * 60);

    // Set chime playing state
    setChimePlaying(true);

    // Play start sound
    if (!audioRef.current) {
      audioRef.current = new Audio(chimeUrl);
    } else {
      audioRef.current.currentTime = 0;
    }

    audioRef.current.play();
    // When sound finishes, start the actual timer
    audioRef.current.onended = () => {
      setChimePlaying(false);
      useTimerStore.getState().resume();
      setSessionStart(new Date());
      setLastTick(Date.now());
    };
  };

  // Handle pausing timer
  const handlePause = () => {
    // Stop chime audio if playing
    stopChimeAudio();

    // Save current video progress before pausing
    saveVideoProgress();
    useTimerStore.getState().pause();
  };

  // Handle resuming from pause (no chime)
  const handleResume = () => {
    useTimerStore.getState().resume();
    setLastTick(Date.now());

    // Seek to saved position when resuming
    if (youtubePlayerRef.current) {
      const startTime = getStartTime();
      youtubePlayerRef.current.seekTo(startTime);
    }
  };

  // Handle manual stop with session recording
  const handleStop = () => {
    // Stop chime audio immediately
    stopChimeAudio();

    // Record session if one is active
    if (sessionStart) {
      const now = new Date();
      addRecord({
        startAt: sessionStart.toISOString(),
        endAt: now.toISOString(),
        totalWork: Math.round(totalWork),
        totalBreak: Math.round(totalBreak),
      });

      // Reset session tracking
      setSessionStart(null);
      setTotalWork(0);
      setTotalBreak(0);
    }

    // Reset video progress for both modes
    setWorkVideoProgress(0);
    setBreakVideoProgress(0);

    // Stop the timer
    stop();
  };

  // Switch between work/break modes
  const handleSwitchMode = () => {
    // Save current video progress before switching modes
    saveVideoProgress();

    if (mode === 'work') {
      start('break', breakDuration * 60, true);
    } else {
      start('work', workDuration * 60, true);
    }
    // Reset warning chime flag for new mode
    setHasPlayedWarningChime(false);
    setLastTick(Date.now());
  };

  // Determine color class based on mode
  const colorClass = mode === 'work' ? 'text-red-500' : 'text-green-500';

  // Handle PiP interaction
  const handlePipInteraction = () => {
    setPipHasInteracted(true);
  };

  // Reset PiP interaction when PiP opens
  useEffect(() => {
    if (pipOpen) {
      setPipHasInteracted(false);
    }
  }, [pipOpen]);

  // Ad bypass handler - temporarily disable pointer events for 3 seconds
  const triggerAdBypass = useCallback(() => {
    if (adBypassTimerRef.current) {
      window.clearTimeout(adBypassTimerRef.current);
    }
    setAdBypassActive(true);
    adBypassTimerRef.current = window.setTimeout(() => {
      setAdBypassActive(false);
      adBypassTimerRef.current = null;
    }, 3000);
  }, []);

  // Cleanup ad bypass timer on unmount
  useEffect(() => {
    return () => {
      if (adBypassTimerRef.current) {
        window.clearTimeout(adBypassTimerRef.current);
      }
    };
  }, []);

  // Common PiP button component
  const pipButton = pipSupported && (
    <button
      onClick={pipOpen ? closePiP : () => openPiP()}
      className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-gray-700/80 transition-all border border-white/10"
      title={pipOpen ? "PiPを終了" : "PiPモード"}
    >
      {pipOpen ? '🔗' : '📱'}
    </button>
  );

  // Ad Skip button component
  const adSkipButton = (!pipOpen && videoId) && (
    <button
      onClick={triggerAdBypass}
      className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-gray-700/80 transition-all border border-white/10"
      title="広告スキップ補助（3秒間クリック可）"
    >
      ⏭️
    </button>
  );

  // Action buttons for desktop TabBar
  const actionButtons = (
    <div className="flex gap-2">
      {pipButton}
      {adSkipButton}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background Video Layer */}
      <div className="fixed inset-0 z-0">
        {!pipOpen && videoId && (
          <YouTubeBackground
            ref={youtubePlayerRef}
            videoId={videoId}
            playing={isRunning}
            startTime={getStartTime()}
          />
        )}
        {/* Overlay - Darker for non-timer tabs */}
        <div 
          className={`absolute inset-0 transition-colors duration-500 ${
            activeTab === 'timer' ? 'bg-black/30' : 'bg-black/80'
          } ${adBypassActive ? 'pointer-events-none opacity-50' : ''}`}
        />
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 h-screen flex flex-col ${
        adBypassActive ? 'pointer-events-none opacity-60' : ''
      }`}>
        {/* Header Area for PiP button - Mobile Only */}
        <div className="absolute top-4 right-4 z-50 flex gap-2 md:hidden">
           {pipButton}
           {adSkipButton}
        </div>

        {/* PiP error message */}
        {pipError && (
          <div className="fixed top-20 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm backdrop-blur-sm">
            {pipError}
          </div>
        )}

        {/* Content Container - Padded for TabBar */}
        <div className="flex-1 overflow-auto pb-20 md:pt-20 md:pb-0">
          <div className="max-w-screen-md mx-auto h-full px-4">
            
            {/* Timer View */}
            {activeTab === 'timer' && (
              <div className="h-full flex flex-col items-center justify-center">
                 <div className="w-full max-w-md flex flex-col items-center justify-center glass rounded-3xl shadow-2xl py-12 px-8 border border-white/10">
                  <h1 className="text-2xl font-bold mb-8 tracking-wide drop-shadow-lg">
                    {mode === 'work' ? '作業中' : mode === 'break' ? '休憩中' : 'Pomodoro Timer'}
                  </h1>

                  <div className="mb-8">
                    <TimerCircle
                      total={mode === 'work' ? workDuration * 60 : breakDuration * 60}
                      remaining={remaining}
                      colorClass={colorClass}
                    />
                  </div>

                  <TimerControls
                    onStart={handleStart}
                    onPause={handlePause}
                    onResume={handleResume}
                    onStop={handleStop}
                  />

                  {errorMessage && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center backdrop-blur-sm animate-pulse">
                      {errorMessage}
                    </div>
                  )}

                  {mode !== 'stopped' && (
                    <button
                      onClick={handleSwitchMode}
                      className="mt-6 text-sm text-gray-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
                    >
                      {mode === 'work' ? '休憩モードに切替' : '作業モードに切替'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Record View */}
            {activeTab === 'record' && (
              <div className="py-8 min-h-full">
                <h2 className="text-2xl font-bold mb-8 text-center sticky top-0 z-20 py-4 bg-transparent backdrop-blur-md rounded-xl">ポモドーロ記録</h2>
                <div className="glass rounded-xl p-4 md:p-6 shadow-xl">
                  <RecordList />
                </div>
              </div>
            )}

            {/* Settings View */}
            {activeTab === 'settings' && (
              <div className="py-8 min-h-full">
                <h2 className="text-2xl font-bold mb-8 text-center sticky top-0 z-20 py-4 bg-transparent backdrop-blur-md rounded-xl">設定</h2>
                <div className="glass rounded-xl p-6 shadow-xl max-w-2xl mx-auto">
                   <SettingsForm />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Tab Navigation - Pass PiP button as action for PC */}
        <TabBar 
          currentTab={activeTab} 
          onTabChange={setActiveTab} 
          action={actionButtons} 
        />
      </div>

      {/* PiP Portal */}
      {pipWindow && createPortal(
        (() => {
          const { isChimePlaying } = useTimerStore.getState();
          const pipCurrentUrl = mode === 'work' ? workUrl : breakUrl;
          const pipColorClass = mode === 'work' ? 'text-red-500' : 'text-green-500';
          const pipModeText = mode === 'work' ? '作業中' : mode === 'break' ? '休憩中' : 'ポモドーロ';

          // Special display when chime is playing
          if (isChimePlaying) {
            return (
              <div className="pip-container">
                <div className="pip-mode-text">{pipModeText}</div>
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
            <div className="pip-container" onClick={handlePipInteraction}>
              {/* YouTube背景 */}
              {pipCurrentUrl && (
                <div className="pip-youtube-background">
                  <YouTubeEmbed
                    ref={youtubePlayerRef}
                    url={pipCurrentUrl}
                    playing={isRunning && pipHasInteracted}
                    className="pip-youtube-iframe"
                    startTime={getStartTime()}
                  />
                  <div className="pip-youtube-overlay"></div>
                </div>
              )}

              {/* インタラクション促進メッセージ */}
              {!pipHasInteracted && (
                <div className="pip-interaction-message">
                  <div className="pip-interaction-text">
                    🎵 クリックして動画を再生
                  </div>
                  <div className="pip-interaction-subtext">
                    ブラウザの制限により、一度クリックが必要です
                  </div>
                </div>
              )}

              {/* タイマー表示 */}
              <div className="pip-timer-content">
                <div className="pip-mode-text">{pipModeText}</div>
                <div className="relative inline-flex items-center justify-center mb-2">
                  <TimerCircle
                    total={mode === 'work' ? workDuration * 60 : breakDuration * 60}
                    remaining={remaining}
                    colorClass={pipColorClass}
                  />
                </div>
              </div>
            </div>
          );
        })(),
        pipWindow.document.body
      )}
    </div>
  );
};

export default PomodoroPage;
