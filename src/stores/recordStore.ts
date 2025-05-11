import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            { id: crypto.randomUUID(), ...rec },
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