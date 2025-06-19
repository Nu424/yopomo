import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simple UUID generation function
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export interface PomodoroRecord {
  id: string;
  startAt: string;
  endAt: string;
  totalWork: number;
  totalBreak: number;
  note?: string;
}

interface RecordState {
  records: PomodoroRecord[];
  addRecord: (rec: Omit<PomodoroRecord,'id'>) => void;
  updateNote: (id: string, note: string) => void;
  clearAll: () => void;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (rec) =>
        set((s) => ({
          records: [
            ...s.records,
            { id: generateId(), ...rec },
          ],
        })),
      updateNote: (id, note) =>
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, note } : r
          ),
        })),
      clearAll: () => set({ records: [] }),
    }),
    { name: 'pomodoro-records' }
  )
); 