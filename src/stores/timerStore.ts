import { create } from 'zustand';

export type TimerMode = 'work' | 'break' | 'stopped';

interface TimerState {
  mode: TimerMode;
  remaining: number; // 秒
  isRunning: boolean;
  start: (mode: TimerMode, seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  mode: 'stopped',
  remaining: 0,
  isRunning: false,
  start: (mode, seconds) => set({ mode, remaining: seconds, isRunning: false }),
  pause: () => set({ isRunning: false }),
  resume: () => set((s) => ({ isRunning: true })),
  stop: () => set({ mode: 'stopped', remaining: 0, isRunning: false }),
  tick: () => set((s) => ({ remaining: Math.max(0, s.remaining - 1) })),
})); 