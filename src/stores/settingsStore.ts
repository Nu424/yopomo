import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  workUrl: string;
  breakUrl: string;
  workDuration: number;  // 分
  breakDuration: number; // 分
  workVideoProgress: number;  // 作業モード動画の進行時間（秒）
  breakVideoProgress: number; // 休憩モード動画の進行時間（秒）
  setWorkUrl: (url: string) => void;
  setBreakUrl: (url: string) => void;
  setWorkDuration: (m: number) => void;
  setBreakDuration: (m: number) => void;
  setWorkVideoProgress: (seconds: number) => void;
  setBreakVideoProgress: (seconds: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workUrl: '',
      breakUrl: '',
      workDuration: 25,
      breakDuration: 5,
      workVideoProgress: 0,
      breakVideoProgress: 0,
      setWorkUrl: (workUrl) => set({ workUrl }),
      setBreakUrl: (breakUrl) => set({ breakUrl }),
      setWorkDuration: (workDuration) => set({ workDuration }),
      setBreakDuration: (breakDuration) => set({ breakDuration }),
      setWorkVideoProgress: (workVideoProgress) => set({ workVideoProgress }),
      setBreakVideoProgress: (breakVideoProgress) => set({ breakVideoProgress }),
    }),
    { name: 'pomodoro-settings' }
  )
); 