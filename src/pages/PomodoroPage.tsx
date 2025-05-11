import React, { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import type { TimerMode } from '../stores/timerStore';
import { useRecordStore } from '../stores/recordStore';
import { useInterval } from '../hooks/useInterval';
import { useYouTubeEmbed } from '../hooks/useYouTubeEmbed';
import TimerCircle from '../components/TimerCircle';
import TimerControls from '../components/TimerControls';
import YouTubeBackground from '../components/YouTubeBackground';

const PomodoroPage: React.FC = () => {
  const { 
    workUrl, 
    breakUrl, 
    workDuration, 
    breakDuration 
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
  
  // Audio for timer start/end
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Get video ID based on current mode
  const currentUrl = mode === 'work' ? workUrl : breakUrl;
  const { videoId } = useYouTubeEmbed(currentUrl);
  
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
  
  // Handle timer completion
  useEffect(() => {
    if (remaining === 0 && isRunning) {
      // Play end sound
      const audio = new Audio('/src/assets/chime.wav');
      audio.play();
      
      // Stop timer
      stop();
      
      // If in a session, record it
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
    }
  }, [remaining, isRunning]);
  
  // Handle starting timer
  const handleStart = () => {
    // Start with work mode
    start('work', workDuration * 60);
    
    // Play start sound
    if (!audioRef.current) {
      audioRef.current = new Audio('/src/assets/chime.wav');
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
  
  // Handle resuming from pause
  const handleResume = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/src/assets/chime.wav');
    } else {
      audioRef.current.currentTime = 0;
    }
    
    audioRef.current.play();
    // When sound finishes, resume the timer
    audioRef.current.onended = () => {
      useTimerStore.getState().resume();
      setLastTick(Date.now());
    };
  };
  
  // Switch between work/break modes
  const handleSwitchMode = () => {
    if (mode === 'work') {
      start('break', breakDuration * 60);
    } else {
      start('work', workDuration * 60);
    }
  };
  
  // Determine color class based on mode
  const colorClass = mode === 'work' ? 'text-red-500' : 'text-green-500';
  
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-900 text-white">
      <div className="relative w-full max-w-md">
        {videoId && (
          <YouTubeBackground
            videoId={videoId}
            playing={isRunning}
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
            onResume={handleResume}
          />
          
          {mode !== 'stopped' && (
            <button
              onClick={handleSwitchMode}
              className="mt-4 text-sm text-gray-300 hover:text-white"
            >
              {mode === 'work' ? '休憩モードに切替' : '作業モードに切替'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage; 