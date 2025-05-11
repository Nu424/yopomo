# Pomodoro × YouTube BGM Web アプリ 設計書

## 1. 背景・目的
- **Pomodoro テクニック**（作業25分＋休憩5分）と作業用BGM（YouTube）を組み合わせ、集中とリフレッシュを一体化  
- モダンでスタイリッシュ、かつスマホファースト・ダークモード対応の UX を提供  
- 実装者が構造を俯瞰できるよう、要件・画面仕様・データ設計・技術要素を整理  

---

## 2. 使用技術スタック
- フロントエンド  
  - Vite + React (TypeScript 推奨)  
  - Tailwind CSS（スマホファースト、ダークモード）  
- 状態管理・永続化  
  - Zustand × localStorage（settings・timer・history の各ストア）  
- 音声／タイマー制御  
  - HTML5 Audio (開始チャイム `.wav`)  
  - カスタムフック `useInterval`（setInterval の古いクロージャ問題回避）  
- YouTube 埋め込み  
  - `<iframe>` + YouTube Player API optional  
  - 読み込み可否検証ボタン  

---

## 3. 機能要件

### 3.1. 設定画面
- 作業状態／休憩状態それぞれの BGM 用 YouTube URL 入力  
- 「読み込み確認」ボタンで `<iframe>` での読み込み可・不可を検証  
- 作業時間・休憩時間を任意に設定（初期値 25min／5min）  
- 入力完了時に Zustand＋localStorage へ永続化  

### 3.2. ポモドーロメイン画面
1. **円形タイマー表示**  
   - 円グラフで残り時間を可視化  
   - 円の上側にデジタルタイマー  
   - カラー：作業＝赤系／休憩＝緑系（Tailwind の `bg-red-500` / `bg-green-500` など）  
2. **YouTube 背景埋め込み**  
   - 円形タイマーの背後に半透明すりガラス風のボックス＋ `<iframe>`  
   - CSS：`backdrop-filter: blur(10px)`  
3. **操作ボタン**  
   - 開始▶ | 一時停止⏸ | 再開▶ | 終了■  
   - 「開始／再開」実行時、まずチャイム音を再生 → 終了コールバック後にタイマー＆BGM再生  
4. **YouTube 再生制御**  
   - 各モード切替時、自動で該当モードの動画に切り替え  
   - 動画終了時はループ再生  
   - タイマー一時停止／再開に合わせ、動画も pause/play  

### 3.3. 記録画面
- 過去のポモドーロセッション一覧  
- 各レコード項目  
  - id (UUID)  
  - 開始日時/終了日時  
  - 実際の作業時間合計／休憩時間合計  
  - メモ（編集可）  
- Zustand＋localStorage へ永続化  

---

## 4. 画面構成・遷移

```
+-------------------------------------------+
| タブバー（Pomodoro | Record | Settings）  |
+-------------------------------------------+
|                                           |
| [1] Pomodoro メイン                      |
|   ┌───────────────────────────────────┐  |
|   │ 背景すりガラス iframe              │  |
|   │ ┌───────────────────────────────┐ │  |
|   │ │ 円形タイマー + デジタル表示     │ │  |
|   │ └───────────────────────────────┘ │  |
|   │   [開始][一時停止][再開][終了]     │  |
|   └───────────────────────────────────┘  |
|                                           |
| [2] Record                              |
|   ┌───────────────────────────────────┐  |
|   │ セッションリスト（テーブル or カード） │  |
|   │ id | start | end | work | break | メモ │ │
|   └───────────────────────────────────┘  |
|                                           |
| [3] Settings                            |
|   ┌───────────────────────────────────┐  |
|   │ 作業BGM URL [____] [読み込み確認]    │  |
|   │ 休憩BGM URL [____] [読み込み確認]    │  |
|   │ 作業時間 [25 min] 休憩時間 [5 min]  │  |
|   └───────────────────────────────────┘  |
+-------------------------------------------+
```

---

## 5. データモデル

### 5.1. SettingsStore

```ts
interface SettingsState {
  workUrl: string;
  breakUrl: string;
  workDuration: number;    // 秒 or 分
  breakDuration: number;   // 秒 or 分
  setWorkUrl(url: string): void;
  setBreakUrl(url: string): void;
  setWorkDuration(min: number): void;
  setBreakDuration(min: number): void;
}
```

### 5.2. TimerStore

```ts
type TimerMode = 'work' | 'break' | 'stopped';

interface TimerState {
  mode: TimerMode;
  remaining: number;      // 秒
  isRunning: boolean;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  tick(): void;           // 内部用：秒ごとに remaining-- 
}
```

### 5.3. RecordStore

```ts
interface PomodoroRecord {
  id: string;             // UUID
  startAt: string;        // ISO Date
  endAt: string;          // ISO Date
  totalWork: number;      // 秒
  totalBreak: number;     // 秒
  note?: string;
}

interface RecordState {
  records: PomodoroRecord[];
  addRecord(rec: PomodoroRecord): void;
  updateNote(id: string, note: string): void;
  clearAll(): void;
}
```

---

## 6. カスタムフック

### 6.1. useInterval

```ts
/**
 * useInterval
 * - コールバックを常に最新のクロージャで呼び出し
 * - delay(ms) = null で停止
 */
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### 6.2. useYouTubeEmbed (任意)

- URL から `videoId` を抽出し `<iframe>` 用 `src="https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}"` を生成  
- onLoad／onError コールバックで読み込み検証  

---

## 7. コンポーネント構成例

```
src/
├─ components/
│  ├─ TimerCircle.tsx
│  ├─ YouTubeBackground.tsx
│  ├─ TimerControls.tsx
│  ├─ RecordList.tsx
│  ├─ SettingsForm.tsx
│  └─ TabBar.tsx
├─ hooks/
│  ├─ useInterval.ts
│  └─ useYouTubeEmbed.ts
├─ stores/
│  ├─ settingsStore.ts
│  ├─ timerStore.ts
│  └─ recordStore.ts
├─ pages/
│  ├─ PomodoroPage.tsx
│  ├─ RecordPage.tsx
│  └─ SettingsPage.tsx
├─ assets/
│  └─ chime.wav
└─ App.tsx
```

---

## 8. 画面／UX ポイント
- **スマホファースト**：タイマーは縦画面中心、ボタンは大きめ  
- **PC 対応**：`max-w-screen-md mx-auto` などで横幅制限  
- **ダークモード**：Tailwind の `dark:` プレフィックス  
- **すりガラス風**  
  ```css
  .glass {
    background-color: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
  }
  ```
- **音声同期**：チャイム再生完了（`audio.onended`）後にタイマー・BGMを同時スタート  

---

## 9. フロー例：タイマー開始

1. ユーザーが「開始」クリック  
2. TimerStore.start() 呼び出し  
3. Audio(チャイム).play()  
4. audio.onended →  
   - TimerStore.isRunning = true  
   - TimerStore.mode = 'work'  
   - useInterval により毎秒 TimerStore.tick()  
   - YouTubeBackground コンポーネントに `playVideo()` を指示  

---

## 10. 永続化戦略
- 各 store（settings/record）は初期化時に `localStorage.getItem` で hydrate  
- 更新時に `subscribe` または setter 内で `localStorage.setItem`  
- TimerStore はクリア時のみ persist しない  

---

## 11. テスト・注意点
- **setInterval のクリア漏れ** → `useInterval` で自動管理  
- **YouTube 埋め込み制限** → 読み込み確認ボタンで早期検出  
- **オートプレイポリシー** → ユーザー操作後にチャイム → BGM の順で再生  
- **ブラウザ互換性** → `backdrop-filter` は非対応時に代替 BG CSS  
