import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import { useRecordStore } from '../stores/recordStore';
import { useInterval } from '../hooks/useInterval';
import { useYouTubeEmbed } from '../hooks/useYouTubeEmbed';
import TimerCircle from '../components/TimerCircle';
import TimerControls from '../components/TimerControls';
import YouTubeBackground, { type YouTubePlayerRef } from '../components/YouTubeBackground';
import RecordList from '../components/RecordList';
import SettingsForm from '../components/SettingsForm';

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
    stop
  } = useTimerStore();
  
  const { addRecord } = useRecordStore();
  
  // Timer session tracking
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [totalWork, setTotalWork] = useState(0);
  const [totalBreak, setTotalBreak] = useState(0);
  const [lastTick, setLastTick] = useState<number | null>(null);
  
  // Chime management
  const [hasPlayedWarningChime, setHasPlayedWarningChime] = useState(false);
  
  // Settings sidebar control
  const [showSettings, setShowSettings] = useState(false);
  
  // Error message state
  const [errorMessage, setErrorMessage] = useState('');
  
  // Audio for timer start/end
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // YouTube player ref for controlling video
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
  
  // Get video ID based on current mode
  const currentUrl = mode === 'work' ? workUrl : breakUrl;
  const { videoId } = useYouTubeEmbed(currentUrl);

  // chime.wavのURLを、場合に応じて変更する
  // 開発中は、/src/assets/chime.wav を使用する
  // https://xxx.github.ioの場合、/assets/chime.wav を使用する
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
      const audio = new Audio(chimeUrl);
      audio.play();
      setHasPlayedWarningChime(true);
    }
  }, [remaining, isRunning, hasPlayedWarningChime]);
  
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
    
    // Play start sound
    if (!audioRef.current) {
      audioRef.current = new Audio(chimeUrl);
    } else {
      audioRef.current.currentTime = 0;
    }
    
    audioRef.current.play();
    // When sound finishes, start the actual timer
    audioRef.current.onended = () => {
      useTimerStore.getState().resume();
      setSessionStart(new Date());
      setLastTick(Date.now());
    };
  };
  
  // Handle pausing timer
  const handlePause = () => {
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
  
  // Toggle settings sidebar
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  return (
    <div className="relative min-h-screen">
      {/* Settings sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-80 bg-gray-800 z-40 transition-transform duration-300 overflow-auto ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">設定</h2>
            <button 
              onClick={toggleSettings}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
          <SettingsForm />
        </div>
      </div>
      
      {/* Settings button */}
      <button 
        onClick={toggleSettings} 
        className="fixed top-4 right-4 z-50 bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-700"
      >
        ⚙️
      </button>
      
      {/* Page content with snap scroll */}
      <div className="h-screen snap-y snap-mandatory overflow-auto">
        {/* Timer section */}
        <section className="snap-start h-screen flex items-center justify-center bg-gray-900 text-white relative">
          <div className="relative w-full max-w-md px-4">
            {videoId && (
              <YouTubeBackground
                ref={youtubePlayerRef}
                videoId={videoId}
                playing={isRunning}
                startTime={getStartTime()}
              />
            )}
            
            <div className="relative z-20 flex flex-col items-center justify-center glass rounded-xl shadow-2xl py-10 px-6">
              <h1 className="text-xl font-bold mb-4">
                {mode === 'work' ? '作業中' : mode === 'break' ? '休憩中' : 'Pomodoro Timer'}
              </h1>
              
              <TimerCircle 
                total={mode === 'work' ? workDuration * 60 : breakDuration * 60}
                remaining={remaining}
                colorClass={colorClass}
              />
              
              <TimerControls 
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
              />
              
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center backdrop-blur-sm">
                  {errorMessage}
                </div>
              )}
              
              {mode !== 'stopped' && (
                <button
                  onClick={handleSwitchMode}
                  className="mt-4 text-sm text-gray-300 hover:text-white"
                >
                  {mode === 'work' ? '休憩モードに切替' : '作業モードに切替'}
                </button>
              )}
            </div>
            
            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-400">
              <span className="mb-2">記録を表示</span>
              <svg className="animate-bounce w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>
        
        {/* Record section */}
        <section className="snap-start min-h-screen flex flex-col items-center bg-gray-900 text-white py-16 px-4">
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">ポモドーロ記録</h2>
            <RecordList />
          </div>
        </section>
      </div>
    </div>
  );
};

export default PomodoroPage; 