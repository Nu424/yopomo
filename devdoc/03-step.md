# Pomodoro × YouTube BGM Web アプリ 実装手順書

以下は「Pomodoro × YouTube BGM Web アプリ」をゼロから実装するための詳細ステップです。  
各ステップを完了しながら、コミット単位で進めることをおすすめします。

---

## 1. プロジェクトセットアップ

### 1.1. 環境構築

1. Node.js（>=16）をインストール  
2. プロジェクト新規作成  
   ```bash
   npx create-vite@latest pomodoro-youtube -- --template react-ts
   cd pomodoro-youtube
   ```
3. パッケージインストール  
   ```bash
   npm install
   npm install react-router-dom zustand uuid
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

### 1.2. Tailwind CSS 初期設定

- `tailwind.config.cjs` を以下のように編集  
  ```js
  module.exports = {
    darkMode: 'class',
    content: ['./index.html','./src/**/*.{ts,tsx}'],
    theme: { extend: {} },
    plugins: [],
  };
  ```
- `src/index.css` に Tailwind の base を追加  
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

---

## 2. ディレクトリ構成

```
pomodoro-youtube/
├─ public/
├─ src/
│  ├─ assets/
│  │   └─ chime.wav
│  ├─ components/
│  │   ├─ TabBar.tsx
│  │   ├─ TimerCircle.tsx
│  │   ├─ TimerControls.tsx
│  │   ├─ YouTubeBackground.tsx
│  │   ├─ RecordList.tsx
│  │   └─ SettingsForm.tsx
│  ├─ hooks/
│  │   ├─ useInterval.ts
│  │   └─ useYouTubeEmbed.ts
│  ├─ pages/
│  │   ├─ PomodoroPage.tsx
│  │   ├─ RecordPage.tsx
│  │   └─ SettingsPage.tsx
│  ├─ stores/
│  │   ├─ settingsStore.ts
│  │   ├─ timerStore.ts
│  │   └─ recordStore.ts
│  ├─ App.tsx
│  └─ index.tsx
├─ tailwind.config.cjs
└─ package.json
```

---

## 3. Zustand ストア実装

### 3.1. settingsStore.ts

```ts
import create from 'zustand';
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
```

### 3.2. timerStore.ts

```ts
import create from 'zustand';

export type TimerMode = 'work' | 'break' | 'stopped';

interface TimerState {
  mode: TimerMode;
  remaining: number; // 秒
  isRunning: boolean;
  start: (mode: TimerMode, seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  mode: 'stopped',
  remaining: 0,
  isRunning: false,
  start: (mode, seconds) => set({ mode, remaining: seconds, isRunning: false }),
  pause: () => set({ isRunning: false }),
  resume: () => set((s) => ({ isRunning: true })),
  stop: () => set({ mode: 'stopped', remaining: 0, isRunning: false }),
  tick: () => set((s) => ({ remaining: Math.max(0, s.remaining - 1) })),
}));
```

### 3.3. recordStore.ts

```ts
import create from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

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
            { id: uuid(), ...rec },
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
```

---

## 4. カスタムフック

### 4.1. useInterval.ts

```ts
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef<() => void>();
  useEffect(() => { saved.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### 4.2. useYouTubeEmbed.ts

```ts
import { useState, useEffect } from 'react';

export const useYouTubeEmbed = (url: string) => {
  const [videoId, setVideoId] = useState<string| null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
    const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (m) setVideoId(m[1]);
    else setVideoId(null);
  }, [url]);

  const src = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&loop=1&playlist=${videoId}`
    : '';

  return { videoId, src, error };
};
```

---

## 5. コンポーネント実装

### 5.1. TabBar.tsx

- React Router の `NavLink` でタブ実装  
- mobile-first, `fixed bottom-0 w-full flex justify-around bg-gray-800 text-white`

### 5.2. TimerCircle.tsx

- SVG 円形進捗バー  
- Props: `total: number, remaining: number, colorClass: string`  
- circumference = 2πr, stroke-dashoffset を計算

### 5.3. YouTubeBackground.tsx

- `useRef<HTMLIFrameElement>` + YouTube IFrame API  
- `useEffect` で `new window.YT.Player(ref.current, {...})`  
- Props: `videoId: string, playing: boolean, onReady?`  
- メソッド: `player.playVideo() / player.pauseVideo() / player.loadVideoById()`

### 5.4. TimerControls.tsx

- ボタン4種（開始▶, ⏸, ▶, ■）  
- onClick で store.start/pause/resume/stop を呼び出し  
- Start 時はチャイム再生 → `audio.onended` で resume 処理

### 5.5. RecordList.tsx

- `useRecordStore().records` を取得  
- テーブル or カード表示（mobile: flex-col, PC: table）  
- Note 編集用に inline `<textarea>` or `<input>`

### 5.6. SettingsForm.tsx

- `useSettingsStore` から state+setters を取得  
- URL 入力 + 「読み込み確認」ボタン → `useYouTubeEmbed` の `src` を iframe でレンダリングし onError チェック  
- Duration は number input（分単位）

---

## 6. ページ実装

### 6.1. PomodoroPage.tsx

1. `settingsStore` から durations と URLs  
2. `timerStore` 利用＋`useInterval(timerStore.tick, timerStore.isRunning?1000:null)`  
3. `<YouTubeBackground>` に `mode==='work'?workVideoId:breakVideoId` + `playing=isRunning`  
4. `<TimerCircle>` に `total`=`mode==='work'?workDuration*60:breakDuration*60` と `remaining`  
5. `<TimerControls>`  
6. Timer終了時（remaining===0）に  
   - BGM 停止  
   - TimerStore.stop()  
   - RecordStore.addRecord({ startAt, endAt, totalWork, totalBreak })

### 6.2. RecordPage.tsx

- `<RecordList />`

### 6.3. SettingsPage.tsx

- `<SettingsForm />`

---

## 7. App.tsx & ルーティング

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PomodoroPage from './pages/PomodoroPage';
import RecordPage from './pages/RecordPage';
import SettingsPage from './pages/SettingsPage';
import TabBar from './components/TabBar';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white dark:bg-black">
        <Routes>
          <Route path="/" element={<PomodoroPage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
```

---

## 8. スタイリング & UX

- スマホファースト: Tailwind の `sm:`, `md:` などで調整  
- ダークモード: `dark:` プレフィックス  
- すりガラス:  
  ```css
  .glass {
    @apply bg-white bg-opacity-10;
    backdrop-filter: blur(10px);
  }
  ```
- ボタン: `rounded-lg p-4 mx-2 bg-red-500 dark:bg-red-600`

---

## 9. 音声／タイマー同期

1. 開始▶クリック  
2. `new Audio('/chime.wav').play()`  
3. `audio.onended = () => { timerStore.resume(); youTubePlayer.playVideo(); }`  
4. `useInterval` が tick を走らせ、remaining 0 で終了処理

---

## 10. 永続化＆Hydration

- `zustand/middleware` の `persist` で自動的に localStorage へ保存＆読み込み  
- TimerStore は非永続化のまま

---

## 11. テスト・デバッグ

- 各 store の初期値ロード確認  
- YouTube「読み込み確認」ボタンで onLoad/onError 確認  
- タイマー一時停止／再開と BGM 再生連動  
- `useInterval` のクリア漏れなし  
- `backdrop-filter` 未対応ブラウザのフォールバック CSS

---

## 12. ビルド＆デプロイ

```bash
npm run build
# 静的ホスティングサービスに配置 (Vercel, Netlify, GitHub Pages など)
```

以上で各機能をモジュール単位に確実に実装できます。  
各ステップごとに動作確認を行い、コミットしていくことで、品質の高いアプリが完成します。