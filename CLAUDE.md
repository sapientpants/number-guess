# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript number guessing game built with Vite, featuring player tracking, statistics, and a leaderboard system.

## Development Commands

- Package manager: `pnpm` (version 10.12.1)
- Install dependencies: `pnpm install`
- Development server: `pnpm dev`
- Build project: `pnpm build`
- Preview build: `pnpm preview`
- Type checking: `pnpm typecheck`
- Run tests: Currently no test command configured

## Project Structure

```
src/
├── components/
│   ├── Game/         # Game-related components
│   ├── Player/       # Player management components
│   ├── Leaderboard/  # Leaderboard components
│   └── UI/           # Reusable UI components
├── hooks/            # Custom React hooks
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling with custom purple-pink gradient theme
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Hook Form** - Form handling
- **localStorage** - Data persistence

## TypeScript Configuration

- Target: ES2020
- Module: ESNext (for Vite bundler)
- Strict mode enabled with all strict checks
- JSX: react-jsx
- Isolated modules for fast refresh

## Key Features

- Number guessing game (1-100)
- Player profiles with persistent stats
- Real-time leaderboard
- Hot/cold visual feedback
- Smooth animations and responsive design

## Notes

- Uses pnpm as the package manager
- Dark theme with gradient color scheme
- TypeScript configured with strict type checking
- Component-based architecture following React best practices