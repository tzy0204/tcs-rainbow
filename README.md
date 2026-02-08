# 霓虹蛇 | Neon Snake Game

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

A futuristic, neon-themed implementation of the classic Snake game, built with vanilla JavaScript and HTML5 Canvas. Features dynamic visual effects, a particle system, and a retro synthesis audio engine.

## 🌟 Features

- **Neon Aesthetics**: Glowing visuals, scanlines, and a cyberpunk-inspired color palette.
- **Dynamic Visuals**: 
  - Rainbow-gradient snake that shifts colors over time.
  - Particle explosions when collecting food.
  - Screen shake effects on game over.
  - Smooth animations and transitions.
- **Retro Audio Engine**: 
  - Custom Web Audio API implementation (no external assets).
  - Procedurally generated chiptune background music.
  - Synthesized sound effects for gameplay actions.
- **Game Features**:
  - Classic Snake gameplay mechanics.
  - Local leaderboard system to track high scores.
  - Login/Guest mode (simulated auth).
  - Responsive design that works on desktop and mobile.

## 🎮 Controls

The game supports both keyboard and touch/click controls.

| Action | Keyboard Key |
|--------|--------------|
| **Move Up** | `Arrow Up` / `W` |
| **Move Down** | `Arrow Down` / `S` |
| **Move Left** | `Arrow Left` / `A` |
| **Move Right** | `Arrow Right` / `D` |
| **Pause/Resume** | `Space` |

## 🚀 How to Run

Since this is a static web application, you can run it directly in your browser.

### Option 1: Direct Open
Simply double-click the `index.html` file to open it in your default web browser.

### Option 2: Local Server (Recommended)
For the best experience (especially for audio auto-play policies), it is recommended to serve the files using a local development server.

If you have Python installed:
```bash
# Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

Or if you use VS Code, you can use the "Live Server" extension.

## 🛠️ Technologies Used

- **HTML5 Canvas**: For high-performance 2D rendering.
- **CSS3**: For UI styling, animations, and neon glow effects.
- **Vanilla JavaScript (ES6+)**: Core game logic and state management.
- **Web Audio API**: Real-time audio synthesis for music and SFX.

## 📂 Project Structure

- `index.html`: Main entry point and UI structure.
- `style.css`: All visual styles, including animations and responsive layout.
- `snake-game.js`: Core game engine, rendering loop, and collision detection.
- `audio-manager.js`: Audio synthesizer for generating sounds and music.
- `data-manager.js`: Handles data persistence (scores, user profiles).
- `app.js`: Connects the UI to the game logic and handles event listeners.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
