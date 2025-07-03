import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useYouTubeEmbed } from '../utils/youtube';
import { usePictureInPicture } from '../hooks/usePictureInPicture';

const SettingsForm: React.FC = () => {
  const {
    workUrl,
    breakUrl,
    workDuration,
    breakDuration,
    setWorkUrl,
    setBreakUrl,
    setWorkDuration,
    setBreakDuration,
  } = useSettingsStore();

  const [tempWorkUrl, setTempWorkUrl] = useState(workUrl);
  const [tempBreakUrl, setTempBreakUrl] = useState(breakUrl);
  const [showWorkPreview, setShowWorkPreview] = useState(false);
  const [showBreakPreview, setShowBreakPreview] = useState(false);

  const workYouTube = useYouTubeEmbed(tempWorkUrl);
  const breakYouTube = useYouTubeEmbed(tempBreakUrl);

  // Picture-in-Picture functionality
  const { isSupported: pipSupported, isOpen: pipOpen, error: pipError, openPiP, closePiP } = usePictureInPicture();

  const handleSaveWorkUrl = () => {
    setWorkUrl(tempWorkUrl);
    setShowWorkPreview(false);
  };

  const handleSaveBreakUrl = () => {
    setBreakUrl(tempBreakUrl);
    setShowBreakPreview(false);
  };

  const handleTogglePiP = async () => {
    if (pipOpen) {
      closePiP();
    } else {
      await openPiP();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>
      
      {/* 作業時BGM設定 */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium">作業時のBGM</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={tempWorkUrl}
            onChange={(e) => setTempWorkUrl(e.target.value)}
            placeholder="YouTube動画のURL"
            className="flex-1 py-2 px-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => setShowWorkPreview(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            読み込み確認
          </button>
        </div>

        {showWorkPreview && (
          <div className="mt-4">
            {workYouTube.videoId ? (
              <div className="space-y-4">
                <div className="relative h-0 pb-[56.25%]">
                  <iframe
                    src={workYouTube.src}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveWorkUrl}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                  >
                    この動画を使用
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-red-400 p-4 bg-red-900 bg-opacity-25 rounded-md">
                URLから動画を読み込めませんでした。有効なYouTube URLを入力してください。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 休憩時BGM設定 */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium">休憩時のBGM</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={tempBreakUrl}
            onChange={(e) => setTempBreakUrl(e.target.value)}
            placeholder="YouTube動画のURL"
            className="flex-1 py-2 px-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => setShowBreakPreview(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            読み込み確認
          </button>
        </div>

        {showBreakPreview && (
          <div className="mt-4">
            {breakYouTube.videoId ? (
              <div className="space-y-4">
                <div className="relative h-0 pb-[56.25%]">
                  <iframe
                    src={breakYouTube.src}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveBreakUrl}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                  >
                    この動画を使用
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-red-400 p-4 bg-red-900 bg-opacity-25 rounded-md">
                URLから動画を読み込めませんでした。有効なYouTube URLを入力してください。
              </div>
            )}
          </div>
        )}
      </div>

      {/* タイマー設定 */}
      <div className="pt-4 border-t border-gray-700">
        <h2 className="text-lg font-medium mb-3">タイマー設定</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workDuration" className="block text-sm font-medium text-gray-400 mb-1">
              作業時間 (分)
            </label>
            <input
              id="workDuration"
              type="number"
              min="0.1"
              max="60"
              step="0.1"
              value={workDuration}
              onChange={(e) => setWorkDuration(Math.max(0.1, Math.min(60, parseFloat(e.target.value) || 0.1)))}
              className="w-full py-2 px-3 bg-gray-700 rounded-md text-white border border-gray-600"
            />
          </div>
          
          <div>
            <label htmlFor="breakDuration" className="block text-sm font-medium text-gray-400 mb-1">
              休憩時間 (分)
            </label>
            <input
              id="breakDuration"
              type="number"
              min="0.1"
              max="30"
              step="0.1"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Math.max(0.1, Math.min(30, parseFloat(e.target.value) || 0.1)))}
              className="w-full py-2 px-3 bg-gray-700 rounded-md text-white border border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Picture-in-Picture設定 */}
      <div className="pt-4 border-t border-gray-700">
        <h2 className="text-lg font-medium mb-3">Picture-in-Picture</h2>
        
        {!pipSupported ? (
          <div className="text-yellow-400 p-3 bg-yellow-900 bg-opacity-25 rounded-md mb-4">
            お使いのブラウザはPicture-in-Picture機能をサポートしていません。
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  タイマーを小さなウィンドウで表示できます
                </p>
                {pipOpen && (
                  <p className="text-xs text-green-400 mt-1">
                    Picture-in-Pictureウィンドウが開いています
                  </p>
                )}
              </div>
              <button
                onClick={handleTogglePiP}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  pipOpen
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {pipOpen ? 'PinPを閉じる' : 'PinPで表示'}
              </button>
            </div>

            {pipError && (
              <div className="text-red-400 p-3 bg-red-900 bg-opacity-25 rounded-md text-sm">
                エラー: {pipError}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default SettingsForm; 