// ==================== Snake Game Engine ====================
// Canvas-based snake game with neon effects and particle system

class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Game settings
        this.gridSize = 20;
        this.tileCount = 25;
        this.canvasSize = this.gridSize * this.tileCount;

        // Set canvas size
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;

        // Game state
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameSpeed = 100; // milliseconds per frame
        this.lastUpdateTime = 0;

        // Particles for effects
        this.particles = [];

        // Colors (neon theme)
        this.colors = {
            snake: '#00f3ff',
            snakeGlow: 'rgba(0, 243, 255, 0.8)',
            food: '#39ff14',
            foodGlow: 'rgba(57, 255, 20, 0.8)',
            grid: 'rgba(0, 243, 255, 0.1)',
            background: '#050508'
        };

        // Event listeners
        this.setupControls();
    }

    // Setup keyboard and touch controls
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;

            // Pause/Resume
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
                return;
            }

            if (this.gamePaused) return;

            // Direction controls
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: 1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: -1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: 1, y: 0 };
                    }
                    e.preventDefault();
                    break;
            }
        });
    }

    // Initialize new game
    startNewGame() {
        // Reset snake in center, moving right
        const centerX = Math.floor(this.tileCount / 2);
        const centerY = Math.floor(this.tileCount / 2);

        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];

        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameSpeed = 100;
        this.gameRunning = true;
        this.gamePaused = false;
        this.particles = [];

        this.spawnFood();
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }

    // Toggle pause state
    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.lastUpdateTime = performance.now();
            this.gameLoop();
        }
    }

    // Main game loop
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;

        if (deltaTime >= this.gameSpeed) {
            this.update();
            this.lastUpdateTime = currentTime;
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    // Update game state
    update() {
        // Update direction
        this.direction = { ...this.nextDirection };

        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            this.createFoodParticles(head.x, head.y);

            // Play eat sound
            if (typeof audioManager !== 'undefined') {
                audioManager.playEatSound();
            }

            // Increase speed slightly
            this.gameSpeed = Math.max(50, this.gameSpeed - 1);

            // Trigger score update event
            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score);
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }

        // Update particles
        this.updateParticles();
    }

    // Render game
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        // Draw grid
        this.drawGrid();

        // Draw food with glow
        this.drawFood();

        // Draw snake with glow
        this.drawSnake();

        // Draw particles
        this.drawParticles();
    }

    // Draw grid lines
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.tileCount; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvasSize);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvasSize, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    // Draw snake with rainbow gradient effect
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize - 2;

            // Calculate hue based on position in snake (rainbow gradient)
            const hue = (index * 360 / this.snake.length + Date.now() / 50) % 360;
            const saturation = 100;
            const lightness = index === 0 ? 70 : 60; // Head brighter

            // Create gradient for each segment
            const gradient = this.ctx.createLinearGradient(
                x, y, x + size, y + size
            );

            // Rainbow gradient with animation
            const color1 = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            const color2 = `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 10}%)`;

            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            // Glow effect with animated color
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = `hsl(${hue}, ${saturation}%, 50%)`;

            this.ctx.fillStyle = gradient;

            // Draw segment with rounded corners for smooth look
            this.ctx.beginPath();
            const radius = 3;
            this.ctx.roundRect(x + 1, y + 1, size, size, radius);
            this.ctx.fill();

            // Add extra glow for head
            if (index === 0) {
                this.ctx.shadowBlur = 30;
                this.ctx.beginPath();
                this.ctx.arc(x + size / 2 + 1, y + size / 2 + 1, size / 3, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fill();
            }

            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }

    // Draw food with neon glow effect
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;

        // Pulsing effect
        const pulseSize = Math.sin(Date.now() / 200) * 2;

        // Glow effect
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = this.colors.foodGlow;

        // Gradient
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius + pulseSize
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.colors.food);
        gradient.addColorStop(1, 'rgba(57, 255, 20, 0.4)');
        this.ctx.fillStyle = gradient;

        // Draw circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    // Spawn food at random position
    spawnFood() {
        let validPosition = false;

        while (!validPosition) {
            this.food.x = Math.floor(Math.random() * this.tileCount);
            this.food.y = Math.floor(Math.random() * this.tileCount);

            // Check if position is not occupied by snake
            validPosition = !this.snake.some(
                segment => segment.x === this.food.x && segment.y === this.food.y
            );
        }
    }

    // Create particle effects when eating food
    createFoodParticles(x, y) {
        const centerX = (x + 0.5) * this.gridSize;
        const centerY = (y + 0.5) * this.gridSize;

        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 2 + Math.random() * 3;

            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: this.colors.food
            });
        }
    }

    // Update particle system
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    // Draw particles
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
    }

    // Game over
    gameOver() {
        this.gameRunning = false;

        // Stop background music
        if (typeof audioManager !== 'undefined') {
            audioManager.stopBackgroundMusic();
            audioManager.playGameOverSound();
        }

        // Trigger screen shake
        this.shakeScreen();

        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    // Screen shake effect
    shakeScreen() {
        const canvas = this.canvas;
        const duration = 500; // ms
        const intensity = 10; // pixels
        const startTime = Date.now();

        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentIntensity = intensity * (1 - progress);

                const x = (Math.random() - 0.5) * currentIntensity * 2;
                const y = (Math.random() - 0.5) * currentIntensity * 2;

                canvas.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                canvas.style.transform = '';
            }
        };

        shake();
    }

    // Get current score
    getScore() {
        return this.score;
    }

    // Check if game is running
    isRunning() {
        return this.gameRunning;
    }
}
