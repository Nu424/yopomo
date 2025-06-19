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

## Architecture

### State Management
The app uses Zustand for state management with three main stores:

- `timerStore.ts` - Timer state (mode, remaining time, isRunning)
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
- `/src/assets/` - Static assets (audio files)
