import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recordsToCsv, downloadCsv, generateCsvFilename } from '../utils/csvExport';

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
  deleteRecord: (id: string) => void;
  clearAll: () => void;
  exportToCsv: () => void;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
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
      deleteRecord: (id) =>
        set((s) => ({
          records: s.records.filter((r) => r.id !== id),
        })),
      clearAll: () => set({ records: [] }),
      exportToCsv: () => {
        const { records } = get();
        if (records.length === 0) {
          alert('出力する記録がありません。');
          return;
        }
        
        const csvContent = recordsToCsv(records);
        const filename = generateCsvFilename();
        downloadCsv(csvContent, filename);
      },
    }),
    { name: 'pomodoro-records' }
  )
); 