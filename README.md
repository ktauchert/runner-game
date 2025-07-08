# Crowd Runner Game

A 3D "Crowd Runner" game built with React Three Fiber and Zustand, featuring crowd mechanics, gates, and exciting battles.

## 🎮 Game Overview

In Crowd Runner, you control a runner with a crowd of followers. Navigate through gates that can increase or decrease your crowd size, and prepare for battle against enemy crowds at the end of each level.

### Game Features

- **Dynamic Crowd Management**: Your crowd size changes based on the gates you pass through
- **Multiple Gate Types**: 
  - ➕ **ADD** gates increase your crowd size
  - ➖ **SUBTRACT** gates decrease your crowd size
  - ✖️ **MULTIPLY** gates multiply your crowd size
  - ➗ **DIVIDE** gates divide your crowd size
- **Real-time Battles**: Engage in battles against enemy crowds with animated combat
- **Visual Feedback**: Particle effects, animations, and UI elements provide clear feedback
- **Sound Effects**: Audio cues for important game events (optional)
- **Multiple Levels**: Increasing difficulty as you progress
- **Score System**: Track your performance across levels

## 🕹️ How to Play

1. **Movement**: Use the arrow keys or A/D keys to move left and right
2. **Gates**: Pass through gates to modify your crowd size
3. **Battle**: When you reach the enemy crowd, a battle automatically begins
   - The side with the larger crowd wins
   - Watch as both crowds reduce in real-time
4. **Strategy**: Choose gates wisely to maximize your crowd size before battle

## 🔧 Technical Details

## 🛠️ Tech Stack

This game is built with modern web technologies:

- **React**: UI components and state management
- **TypeScript**: Type-safe code
- **Vite**: Fast development server and bundling
- **Three.js**: 3D rendering engine
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for React Three Fiber
- **Zustand**: State management
- **Howler.js**: Sound management

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🎛️ Controls

- **Move Left**: Left Arrow or A key
- **Move Right**: Right Arrow or D key
- **Toggle Sound**: Click the sound button on the start screen
- **Debug Mode**: Enable via the Leva panel (set debug to true)

## 👨‍💻 Development

The game is structured with reusable components:

- **App.tsx**: Main game container and orchestrator
- **components/**: React components for game elements
  - **Runner.tsx**: Player character
  - **CrowdManager.tsx**: Manages player's crowd
  - **EnemyGroup.tsx**: Enemy crowd and battle mechanics
  - **Gate.tsx**: Gates that modify crowd size
  - **Arena.tsx**: Game environment
  - **ParticleSystem.tsx**: Visual effects
- **store/**: State management with Zustand
- **utils/**: Helper functions and sound management

## 🔊 Sound Effects

The game includes sound effects for a more immersive experience. Install the Howler.js library to enable sounds:

```bash
npm install howler @types/howler
```
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
