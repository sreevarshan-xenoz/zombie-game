# Zombie Game Development Guide

## Project Structure

```
zombie-game/
├── backend/               # NestJS backend
│   ├── src/
│   │   ├── game/          # Game-specific API endpoints
│   │   │   ├── game.controller.ts
│   │   │   ├── game.service.ts
│   │   │   └── game.module.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   └── ...
├── frontend/              # Vite TypeScript frontend
│   ├── public/
│   │   ├── assets/        # Game assets (images, audio)
│   │   │   ├── player.png
│   │   │   └── zombie.png 
│   │   └── zombie.svg     # Favicon
│   ├── src/
│   │   ├── main.ts        # Game entry point with engine
│   │   └── style.css      # Game styling
│   └── ...
├── package.json           # Root package.json with scripts
└── start-dev.bat          # Development startup script
```

## Technologies Used

- **Backend:**
  - NestJS - Modern Node.js framework
  - TypeScript - Type-safe JavaScript
  - File-based storage for scores

- **Frontend:**
  - Vite - Fast modern frontend build tool
  - TypeScript - Type-safe JavaScript
  - Anime.js - Animation library
  - Canvas API - Game rendering

## Game Features

- Player movement with WASD keys
- Shooting with mouse clicks
- Dynamic zombie spawning
- Health and ammo system
- Score tracking
- Difficulty scaling

## Running the Development Environment

### On Windows

1. Run the start script:
   ```
   start-dev.bat
   ```

### Manual Setup

1. Install dependencies:
   ```
   npm run install:all
   ```

2. Start development servers:
   ```
   npm run dev
   ```

## Building for Production

1. Build both frontend and backend:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

## Game Controls

- **W, A, S, D** - Move player
- **Mouse** - Aim
- **Left Click** - Shoot
- **R** - Reload weapon 