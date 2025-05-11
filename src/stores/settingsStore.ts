import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  workUrl: string;
  breakUrl: string;
  workDuration: number;  // 分
  breakDuration: number; // 分
  setWorkUrl: (url: string) => void;
  setBreakUrl: (url: string) => void;
  setWorkDuration: (m: number) => void;
  setBreakDuration: (m: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workUrl: '',
      breakUrl: '',
      workDuration: 25,
      breakDuration: 5,
      setWorkUrl: (workUrl) => set({ workUrl }),
      setBreakUrl: (breakUrl) => set({ breakUrl }),
      setWorkDuration: (workDuration) => set({ workDuration }),
      setBreakDuration: (breakDuration) => set({ breakDuration }),
    }),
    { name: 'pomodoro-settings' }
  )
); 