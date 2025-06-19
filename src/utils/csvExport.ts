import type { PomodoroRecord } from '../stores/recordStore';

// CSV用の文字列エスケープ関数
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// 秒を HH:MM:SS 形式に変換
function formatSecondsToHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 日時を YYYY/MM/DD HH:MM:SS 形式に変換
function formatDateTimeForCsv(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// PomodoroRecord配列をCSV文字列に変換
export function recordsToCsv(records: PomodoroRecord[]): string {
  // CSVヘッダー
  const headers = ['開始日時', '終了日時', '作業時間', '休憩時間', 'メモ'];
  
  // データ行を作成
  const rows = records.map(record => {
    const startAt = formatDateTimeForCsv(record.startAt);
    const endAt = formatDateTimeForCsv(record.endAt);
    const workTime = formatSecondsToHMS(record.totalWork);
    const breakTime = formatSecondsToHMS(record.totalBreak);
    const note = escapeCsvField((record.note || '').replace(/\n/g, ' '));
    
    return [startAt, endAt, workTime, breakTime, note].join(',');
  });
  
  // ヘッダーとデータを結合
  return [headers.join(','), ...rows].join('\n');
}

// CSVファイルをダウンロード
export function downloadCsv(csvContent: string, filename: string): void {
  // UTF-8 BOM付きでBlobを作成（Excelでの文字化け防止）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // ダウンロードリンクを作成
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // オブジェクトURLを解放
  URL.revokeObjectURL(url);
}

// ファイル名を生成（pomodoro-records-YYYY-MM-DD.csv）
export function generateCsvFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  return `pomodoro-records-${year}-${month}-${day}.csv`;
}