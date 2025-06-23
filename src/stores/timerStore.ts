import { create } from 'zustand';

export type TimerMode = 'work' | 'break' | 'stopped';

interface TimerState {
  mode: TimerMode;
  remaining: number; // 秒
  isRunning: boolean;
  isChimePlaying: boolean;
  start: (mode: TimerMode, seconds: number, autoStart?: boolean) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
  setChimePlaying: (playing: boolean) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  mode: 'stopped',
  remaining: 0,
  isRunning: false,
  isChimePlaying: false,
  start: (mode, seconds, autoStart = false) => set({ mode, remaining: seconds, isRunning: autoStart }),
  pause: () => set({ isRunning: false }),
  resume: () => set(() => ({ isRunning: true })),
  stop: () => set({ mode: 'stopped', remaining: 0, isRunning: false, isChimePlaying: false }),
  tick: () => set((s) => ({ remaining: Math.max(0, s.remaining - 1) })),
  setChimePlaying: (playing) => set({ isChimePlaying: playing }),
})); 