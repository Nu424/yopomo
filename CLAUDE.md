# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
- 日本語で回答してください。思考は英語で構いません。
- 実装に関わるドキュメントは`devdoc`内に含まれています。適宜これを参照してください。

## Project Overview

よぽも (Yopomo) is a Pomodoro timer application built with React + TypeScript + Vite. It features YouTube background music integration, session tracking, and persistent settings/history storage.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript compilation first)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Development Notes
- npm run devによる開発サーバーは別Shellですでに起動していますので、特段起動しなくてOKです。

## Architecture

### State Management
The app uses Zustand for state management with three main stores:

- `timerStore.ts` - Timer state (mode, remaining time, isRunning, isChimePlaying)
- `settingsStore.ts` - User preferences (YouTube URLs, durations) - persisted to localStorage
- `recordStore.ts` - Session history tracking - persisted to localStorage

### Core Components
- `PomodoroPage.tsx` - Single-page application with snap-scroll sections (timer + history)
- Timer display uses `TimerCircle.tsx` and `TimerControls.tsx`
- YouTube background managed by `YouTubeBackground.tsx` component
- Settings accessed via slide-out sidebar with `SettingsForm.tsx`

### Key Features
- Timer modes: work/break/stopped with audio chimes (`/src/assets/chime.wav`)
- YouTube integration via iframe embed (uses `useYouTubeEmbed` hook)
- Session tracking with work/break time totals
- CSV export functionality for session records
- Persistent settings and history via Zustand persist middleware
- Single-page design with snap-scroll between timer and history sections

### Tech Stack
- React 19 + TypeScript
- Tailwind CSS (v4) for styling
- Zustand for state management
- Vite for build tooling
- ESLint for code quality

### File Structure
- `/src/stores/` - Zustand state management
- `/src/components/` - Reusable UI components  
- `/src/pages/` - Main page component
- `/src/hooks/` - Custom React hooks for YouTube and intervals
- `/src/utils/` - Utility functions (CSV export, etc.)
- `/src/assets/` - Static assets (audio files)

### Implementation Details
- No routing system - single page application using only `PomodoroPage.tsx`
- Audio file path is `/src/assets/chime.wav` (referenced from public directory)
- Glass effect styling achieved with `backdrop-filter: blur(10px)` and semi-transparent backgrounds
- Snap scroll implemented with CSS: `snap-y snap-mandatory` on container, `snap-start` on sections
- Settings sidebar slides in from right side as overlay with z-index management
- Timer auto-switches between work/break modes with audio notifications
- Session tracking accumulates time spent in each mode for final recording
- CSV export uses browser download API with UTF-8 BOM for Excel compatibility

### Audio Management
- Two separate audio elements: `audioRef` for start chime, `warningAudioRef` for 3-second warning
- `isChimePlaying` state prevents button interactions during chime playback
- Chime playback during timer start shows "準備中... ♪" instead of resume button
- `stopChimeAudio()` helper function ensures complete audio cleanup on stop/pause
- Warning chime (3 seconds before end) can be interrupted by stop button