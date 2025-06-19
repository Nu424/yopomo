import React from 'react';
import { useTimerStore } from '../stores/timerStore';

interface TimerControlsProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({ onStart, onPause, onResume, onStop }) => {
  const { isRunning, mode } = useTimerStore();

  return (
    <div className="flex justify-center space-x-4 mt-8">
      {mode === 'stopped' ? (
        <button
          onClick={onStart}
          className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 active:bg-red-700 transition"
        >
          開始 ▶
        </button>
      ) : isRunning ? (
        <>
          <button
            onClick={onPause}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600 active:bg-yellow-700 transition"
          >
            一時停止 ⏸
          </button>
          <button
            onClick={onStop}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 active:bg-gray-700 transition"
          >
            終了 ■
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onResume}
            className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 active:bg-green-700 transition"
          >
            再開 ▶
          </button>
          <button
            onClick={onStop}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 active:bg-gray-700 transition"
          >
            終了 ■
          </button>
        </>
      )}
    </div>
  );
};

export default TimerControls; 