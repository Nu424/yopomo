import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import { useRecordStore } from '../stores/recordStore';
import { useInterval } from '../hooks/useInterval';
import { useYouTubeEmbed } from '../utils/youtube';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import TimerCircle from '../components/TimerCircle';
import TimerControls from '../components/TimerControls';
import YouTubeBackground, { type YouTubePlayerRef } from '../components/YouTubeBackground';
import RecordList from '../components/RecordList';
import SettingsForm from '../components/SettingsForm';
import YouTubeEmbed from '../components/YouTubeEmbed';
import TabBar from '../components/TabBar';

type TabType = 'timer' | 'record' | 'settings';

const PomodoroPage: React.FC = () => {
  const {
    workUrl,
    breakUrl,
    workDuration,
    breakDuration,
    workVideoProgress,
    breakVideoProgress,
    setWorkVideoProgress,
    setBreakVideoProgress
  } = useSettingsStore();

  const {
    mode,
    remaining,
    isRunning,
    start,
    tick,
    stop,
    setChimePlaying
  } = useTimerStore();

  const { addRecord } = useRecordStore();

  // タブ状態
  const [activeTab, setActiveTab] = useState<TabType>('timer');

  // Picture-in-Picture
  const { isSupported: pipSupported, isOpen: pipOpen, error: pipError, pipWindow, openPiP, closePiP } = usePictureInPicture();

  // タイマーセッション追跡
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [totalWork, setTotalWork] = useState(0);
  const [totalBreak, setTotalBreak] = useState(0);
  const [lastTick, setLastTick] = useState<number | null>(null);

  // チャイム管理
  const [hasPlayedWarningChime, setHasPlayedWarningChime] = useState(false);

  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState('');

  // タイマー開始/終了用の音声
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 警告チャイム用の音声（終了3秒前）
  const warningAudioRef = useRef<HTMLAudioElement | null>(null);

  // 動画制御用のYouTubeプレイヤー参照
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null);

  // PiPユーザーインタラクション追跡
  const [pipHasInteracted, setPipHasInteracted] = useState(false);

  // 広告バイパス状態（一時的にポインターイベントを無効化）
  const [adBypassActive, setAdBypassActive] = useState(false);
  const adBypassTimerRef = useRef<number | null>(null);

  // チャイム音声を完全に停止するヘルパー関数
  const stopChimeAudio = useCallback(() => {
    // 開始チャイムを停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
    }

    // 警告チャイムを停止
    if (warningAudioRef.current) {
      warningAudioRef.current.pause();
      warningAudioRef.current.currentTime = 0;
    }

    setChimePlaying(false);
  }, [setChimePlaying]);

  // 現在のモードに基づいて動画IDを取得
  const currentUrl = mode === 'work' ? workUrl : breakUrl;
  const { videoId } = useYouTubeEmbed(currentUrl);

  // chime.wavのURLを、場合に応じて変更する
  const isGitHubPages = window.location.hostname.includes('github.io');
  const chimeUrl = isGitHubPages ? '/yopomo/assets/chime.wav' : '/src/assets/chime.wav';

  // 現在の動画の進捗を保存する関数
  const saveVideoProgress = useCallback(() => {
    if (youtubePlayerRef.current && mode !== 'stopped') {
      const currentTime = youtubePlayerRef.current.getCurrentTime();
      if (mode === 'work') {
        setWorkVideoProgress(currentTime);
      } else if (mode === 'break') {
        setBreakVideoProgress(currentTime);
      }
    }
  }, [mode, setWorkVideoProgress, setBreakVideoProgress]);

  // 現在のモードの開始時間を取得
  const getStartTime = () => {
    if (mode === 'work') {
      return workVideoProgress;
    } else if (mode === 'break') {
      return breakVideoProgress;
    }
    return 0;
  };

  // タイマーのティック用のインターバルを設定
  useInterval(
    () => {
      tick();
      // 各モードで費やした時間を追跡
      const now = Date.now();
      if (lastTick && isRunning) {
        const diff = (now - lastTick) / 1000;
        if (mode === 'work') {
          setTotalWork(prev => prev + diff);
        } else if (mode === 'break') {
          setTotalBreak(prev => prev + diff);
        }
      }
      setLastTick(now);
    },
    isRunning ? 1000 : null
  );

  // 3秒前の警告チャイムを処理
  useEffect(() => {
    if (remaining === 3 && isRunning && !hasPlayedWarningChime) {
      const { isChimePlaying } = useTimerStore.getState();
      if (!isChimePlaying) {
        if (!warningAudioRef.current) {
          warningAudioRef.current = new Audio(chimeUrl);
        } else {
          warningAudioRef.current.currentTime = 0;
        }
        warningAudioRef.current.play();
        setHasPlayedWarningChime(true);
      }
    }
  }, [remaining, isRunning, hasPlayedWarningChime, chimeUrl]);

  // タイマー完了と作業/休憩の自動切り替えを処理
  useEffect(() => {
    if (remaining === 0 && isRunning) {
      // モード切り替え前に現在の動画の進捗を保存
      saveVideoProgress();

      // 次のフェーズに自動切り替え（チャイムなし）
      if (mode === 'work') {
        // 作業終了 -> 休憩開始
        start('break', breakDuration * 60, true);
      } else if (mode === 'break') {
        // 休憩終了 -> 作業開始
        start('work', workDuration * 60, true);
      }

      // 次のサイクル用に警告チャイムフラグをリセット
      setHasPlayedWarningChime(false);
      setLastTick(Date.now());
    }
  }, [remaining, isRunning, mode, workDuration, breakDuration, saveVideoProgress, start]);

  // URL変更時に動画の進捗をリセット
  useEffect(() => {
    setWorkVideoProgress(0);
  }, [workUrl, setWorkVideoProgress]);

  useEffect(() => {
    setBreakVideoProgress(0);
  }, [breakUrl, setBreakVideoProgress]);

  // アンマウント時にチャイム音声をクリーンアップ
  useEffect(() => {
    return () => {
      stopChimeAudio();
    };
  }, [stopChimeAudio]);

  // タイマー開始を処理
  const handleStart = () => {
    // YouTube URLが設定されているか確認
    if (!workUrl.trim()) {
      setErrorMessage('作業用のYouTube動画URLを設定してください');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // 作業モードで開始
    start('work', workDuration * 60);

    // チャイム再生状態を設定
    setChimePlaying(true);

    // 開始音を再生
    if (!audioRef.current) {
      audioRef.current = new Audio(chimeUrl);
    } else {
      audioRef.current.currentTime = 0;
    }

    audioRef.current.play();
    // 音が終了したら、実際のタイマーを開始
    audioRef.current.onended = () => {
      setChimePlaying(false);
      useTimerStore.getState().resume();
      setSessionStart(new Date());
      setLastTick(Date.now());
    };
  };

  // タイマー一時停止を処理
  const handlePause = () => {
    // チャイム音声が再生中の場合は停止
    stopChimeAudio();

    // 一時停止前に現在の動画の進捗を保存
    saveVideoProgress();
    useTimerStore.getState().pause();
  };

  // 一時停止からの再開を処理（チャイムなし）
  const handleResume = () => {
    useTimerStore.getState().resume();
    setLastTick(Date.now());

    // 再開時に保存された位置にシーク
    if (youtubePlayerRef.current) {
      const startTime = getStartTime();
      youtubePlayerRef.current.seekTo(startTime);
    }
  };

  // セッション記録付きの手動停止を処理
  const handleStop = () => {
    // チャイム音声を即座に停止
    stopChimeAudio();

    // アクティブなセッションがあれば記録
    if (sessionStart) {
      const now = new Date();
      addRecord({
        startAt: sessionStart.toISOString(),
        endAt: now.toISOString(),
        totalWork: Math.round(totalWork),
        totalBreak: Math.round(totalBreak),
      });

      // セッション追跡をリセット
      setSessionStart(null);
      setTotalWork(0);
      setTotalBreak(0);
    }

    // 両モードの動画の進捗をリセット
    setWorkVideoProgress(0);
    setBreakVideoProgress(0);

    // タイマーを停止
    stop();
  };

  // 作業/休憩モードの切り替え
  const handleSwitchMode = () => {
    // モード切り替え前に現在の動画の進捗を保存
    saveVideoProgress();

    if (mode === 'work') {
      start('break', breakDuration * 60, true);
    } else {
      start('work', workDuration * 60, true);
    }
    // 新しいモード用に警告チャイムフラグをリセット
    setHasPlayedWarningChime(false);
    setLastTick(Date.now());
  };

  // モードに基づいてカラークラスを決定
  const colorClass = mode === 'work' ? 'text-red-500' : 'text-green-500';

  // PiPインタラクションを処理
  const handlePipInteraction = () => {
    setPipHasInteracted(true);
  };

  // PiPが開いたときにPiPインタラクションをリセット
  useEffect(() => {
    if (pipOpen) {
      setPipHasInteracted(false);
    }
  }, [pipOpen]);

  // 広告バイパスハンドラ - 3秒間ポインターイベントを一時的に無効化
  const triggerAdBypass = useCallback(() => {
    if (adBypassTimerRef.current) {
      window.clearTimeout(adBypassTimerRef.current);
    }
    setAdBypassActive(true);
    adBypassTimerRef.current = window.setTimeout(() => {
      setAdBypassActive(false);
      adBypassTimerRef.current = null;
    }, 3000);
  }, []);

  // アンマウント時に広告バイパスタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (adBypassTimerRef.current) {
        window.clearTimeout(adBypassTimerRef.current);
      }
    };
  }, []);

  // 共通のPiPボタンコンポーネント
  const pipButton = pipSupported && (
    <button
      onClick={pipOpen ? closePiP : () => openPiP()}
      className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-gray-700/80 transition-all border border-white/10"
      title={pipOpen ? "PiPを終了" : "PiPモード"}
    >
      {pipOpen ? '🔗' : '📱'}
    </button>
  );

  // Ad Skipボタンコンポーネント
  const adSkipButton = (!pipOpen && videoId) && (
    <button
      onClick={triggerAdBypass}
      className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-gray-700/80 transition-all border border-white/10"
      title="広告スキップ補助（3秒間クリック可）"
    >
      ⏭️
    </button>
  );

  // デスクトップTabBar用のアクションボタン
  const actionButtons = (
    <div className="flex gap-2">
      {pipButton}
      {adSkipButton}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* 背景動画レイヤー */}
      <div className="fixed inset-0 z-0">
        {!pipOpen && videoId && (
          <YouTubeBackground
            ref={youtubePlayerRef}
            videoId={videoId}
            playing={isRunning}
            startTime={getStartTime()}
          />
        )}
        {/* オーバーレイ - タイマー以外のタブではより暗く */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${activeTab === 'timer' ? 'bg-black/30' : 'bg-black/80'
            } ${adBypassActive ? 'pointer-events-none opacity-50' : ''}`}
        />
      </div>

      {/* メインコンテンツエリア */}
      <div className={`relative z-10 h-screen flex flex-col ${adBypassActive ? 'pointer-events-none opacity-60' : ''
        }`}>
        {/* PiPボタン用のヘッダーエリア - モバイルのみ */}
        <div className="absolute top-4 right-4 z-50 flex gap-2 md:hidden">
          {pipButton}
          {adSkipButton}
        </div>

        {/* PiPエラーメッセージ */}
        {pipError && (
          <div className="fixed top-20 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm backdrop-blur-sm">
            {pipError}
          </div>
        )}

        {/* コンテンツコンテナ - TabBar用にパディング */}
        <div className="flex-1 overflow-auto pb-20 md:pt-20 md:pb-0">
          <div className="max-w-screen-md mx-auto h-full px-4">

            {/* タイマービュー */}
            {activeTab === 'timer' && (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-full max-w-md flex flex-col items-center justify-center glass rounded-3xl shadow-2xl py-12 px-8 border border-white/10">
                  <h1 className="text-2xl font-bold mb-8 tracking-wide drop-shadow-lg">
                    {mode === 'work' ? '作業中' : mode === 'break' ? '休憩中' : 'Pomodoro Timer'}
                  </h1>

                  <div className="mb-8">
                    <TimerCircle
                      total={mode === 'work' ? workDuration * 60 : breakDuration * 60}
                      remaining={remaining}
                      colorClass={colorClass}
                    />
                  </div>

                  <TimerControls
                    onStart={handleStart}
                    onPause={handlePause}
                    onResume={handleResume}
                    onStop={handleStop}
                  />

                  {errorMessage && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center backdrop-blur-sm animate-pulse">
                      {errorMessage}
                    </div>
                  )}

                  {mode !== 'stopped' && (
                    <button
                      onClick={handleSwitchMode}
                      className="mt-6 text-sm text-gray-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
                    >
                      {mode === 'work' ? '休憩モードに切替' : '作業モードに切替'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 記録ビュー */}
            {activeTab === 'record' && (
              <div className="py-8 min-h-full">
                <h2 className="text-2xl font-bold mb-8 text-center sticky top-0 z-20 py-4 bg-transparent backdrop-blur-md rounded-xl">ポモドーロ記録</h2>
                <div className="glass rounded-xl p-4 md:p-6 shadow-xl">
                  <RecordList />
                </div>
              </div>
            )}

            {/* 設定ビュー */}
            {activeTab === 'settings' && (
              <div className="py-8 min-h-full">
                <h2 className="text-2xl font-bold mb-8 text-center sticky top-0 z-20 py-4 bg-transparent backdrop-blur-md rounded-xl">設定</h2>
                <div className="glass rounded-xl p-6 shadow-xl max-w-2xl mx-auto">
                  <SettingsForm />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* タブナビゲーション - PC用にPiPボタンをアクションとして渡す */}
        <TabBar
          currentTab={activeTab}
          onTabChange={setActiveTab}
          action={actionButtons}
        />
      </div>

      {/* PiPポータル */}
      {pipWindow && createPortal(
        (() => {
          const { isChimePlaying } = useTimerStore.getState();
          const pipCurrentUrl = mode === 'work' ? workUrl : breakUrl;
          const pipColorClass = mode === 'work' ? 'text-red-500' : 'text-green-500';
          const pipModeText = mode === 'work' ? '作業中' : mode === 'break' ? '休憩中' : 'ポモドーロ';

          // チャイム再生中の特別表示
          if (isChimePlaying) {
            return (
              <div className="pip-container">
                <div className="pip-mode-text">{pipModeText}</div>
                <div className="pip-timer-text">準備中... ♪</div>
              </div>
            );
          }

          // 停止状態を表示
          if (mode === 'stopped') {
            return (
              <div className="pip-container">
                <div className="pip-mode-text">ポモドーロタイマー</div>
                <div className="pip-timer-text text-gray-400">停止中</div>
              </div>
            );
          }

          return (
            <div className="pip-container" onClick={handlePipInteraction}>
              {/* YouTube背景 */}
              {pipCurrentUrl && (
                <div className="pip-youtube-background">
                  <YouTubeEmbed
                    ref={youtubePlayerRef}
                    url={pipCurrentUrl}
                    playing={isRunning && pipHasInteracted}
                    className="pip-youtube-iframe"
                    startTime={getStartTime()}
                  />
                  <div className="pip-youtube-overlay"></div>
                </div>
              )}

              {/* インタラクション促進メッセージ */}
              {!pipHasInteracted && (
                <div className="pip-interaction-message">
                  <div className="pip-interaction-text">
                    🎵 クリックして動画を再生
                  </div>
                  <div className="pip-interaction-subtext">
                    ブラウザの制限により、一度クリックが必要です
                  </div>
                </div>
              )}

              {/* タイマー表示 */}
              <div className="pip-timer-content">
                <div className="pip-mode-text">{pipModeText}</div>
                <div className="relative inline-flex items-center justify-center mb-2">
                  <TimerCircle
                    total={mode === 'work' ? workDuration * 60 : breakDuration * 60}
                    remaining={remaining}
                    colorClass={pipColorClass}
                  />
                </div>
              </div>
            </div>
          );
        })(),
        pipWindow.document.body
      )}
    </div>
  );
};

export default PomodoroPage;
