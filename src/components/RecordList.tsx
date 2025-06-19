import React, { useState } from 'react';
import { useRecordStore } from '../stores/recordStore';
import type { PomodoroRecord } from '../stores/recordStore';

const RecordList: React.FC = () => {
  const { records, updateNote, clearAll, exportToCsv } = useRecordStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<string>('');

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return `${h > 0 ? `${h}時間` : ''}${m > 0 ? `${m}分` : ''}${s > 0 || (h === 0 && m === 0) ? `${s}秒` : ''}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Start editing note
  const startEdit = (record: PomodoroRecord) => {
    setEditingId(record.id);
    setEditNote(record.note || '');
  };

  // Save note and stop editing
  const saveNote = () => {
    if (editingId) {
      updateNote(editingId, editNote);
      setEditingId(null);
    }
  };

  return (
    <div className="w-full">
      {records.length === 0 ? (
        <p className="text-center text-gray-500 my-8">記録がありません</p>
      ) : (
        <>
          <div className="mb-4 flex justify-end space-x-2">
            <button 
              onClick={exportToCsv}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              📊 CSV出力
            </button>
            <button 
              onClick={() => {
                if (confirm('すべての記録を削除しますか？')) {
                  clearAll();
                }
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              全て削除
            </button>
          </div>
          
          {/* モバイル向け表示 */}
          <div className="md:hidden space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{formatDate(record.startAt)}</span>
                  <span>～</span>
                  <span>{formatDate(record.endAt)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-red-400">作業</span>
                    <p className="font-medium">{formatTime(record.totalWork)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-green-400">休憩</span>
                    <p className="font-medium">{formatTime(record.totalBreak)}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-1">メモ</div>
                  {editingId === record.id ? (
                    <div className="mt-1">
                      <textarea 
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                        rows={2}
                      />
                      <div className="flex justify-end mt-1 space-x-2">
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="px-2 py-1 bg-gray-600 text-xs rounded"
                        >
                          キャンセル
                        </button>
                        <button 
                          onClick={saveNote}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => startEdit(record)}
                      className="p-2 bg-gray-700 text-sm rounded min-h-[3rem] cursor-pointer hover:bg-gray-600"
                    >
                      {record.note || '(メモを追加)'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* PC向け表示 */}
          <div className="hidden md:block">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2">開始</th>
                  <th className="px-4 py-2">終了</th>
                  <th className="px-4 py-2">作業時間</th>
                  <th className="px-4 py-2">休憩時間</th>
                  <th className="px-4 py-2">メモ</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-800">
                    <td className="px-4 py-2">{formatDate(record.startAt)}</td>
                    <td className="px-4 py-2">{formatDate(record.endAt)}</td>
                    <td className="px-4 py-2 text-red-400">{formatTime(record.totalWork)}</td>
                    <td className="px-4 py-2 text-green-400">{formatTime(record.totalBreak)}</td>
                    <td className="px-4 py-2">
                      {editingId === record.id ? (
                        <div>
                          <textarea 
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                            rows={2}
                          />
                          <div className="flex justify-end mt-1 space-x-2">
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="px-2 py-1 bg-gray-600 text-xs rounded"
                            >
                              キャンセル
                            </button>
                            <button 
                              onClick={saveNote}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => startEdit(record)}
                          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
                        >
                          {record.note || <span className="text-gray-500">(メモを追加)</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RecordList; 