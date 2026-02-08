// ==================== Main Application ====================
// Handles UI state management, view switching, and integration

class App {
    constructor() {
        this.currentUser = null;
        this.game = null;

        // Screen elements
        this.screens = {
            login: document.getElementById('loginScreen'),
            game: document.getElementById('gameScreen'),
            leaderboard: document.getElementById('leaderboardScreen')
        };

        // Login form elements
        this.loginForm = {
            username: document.getElementById('loginUsername'),
            password: document.getElementById('loginPassword'),
            error: document.getElementById('loginError'),
            btn: document.getElementById('loginBtn')
        };

        // Register form elements
        this.registerForm = {
            username: document.getElementById('registerUsername'),
            password: document.getElementById('registerPassword'),
            confirmPassword: document.getElementById('registerConfirmPassword'),
            error: document.getElementById('registerError'),
            btn: document.getElementById('registerBtn')
        };

        // Game elements
        this.gameElements = {
            currentUser: document.getElementById('currentUser'),
            loginTime: document.getElementById('loginTime'),
            currentScore: document.getElementById('currentScore'),
            highScore: document.getElementById('highScore'),
            startOverlay: document.getElementById('startOverlay'),
            gameOverlay: document.getElementById('gameOverlay'),
            finalScore: document.getElementById('finalScore'),
            totalGames: document.getElementById('totalGames'),
            avgScore: document.getElementById('avgScore'),
            personalBest: document.getElementById('personalBest'),
            recentScores: document.getElementById('recentScores')
        };

        this.init();
    }

    init() {
        // Check if user is already logged in
        this.currentUser = dataManager.getCurrentUser();

        if (this.currentUser) {
            this.showGameScreen();
        } else {
            this.showLoginScreen();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auth form switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToRegister();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToLogin();
        });

        // Login
        this.loginForm.btn.addEventListener('click', () => this.handleLogin());
        this.loginForm.password.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Register
        this.registerForm.btn.addEventListener('click', () => this.handleRegister());
        this.registerForm.confirmPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });

        // Guest login
        document.getElementById('guestLoginBtn').addEventListener('click', () => this.handleGuestLogin());

        // Game controls
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Leaderboard
        document.getElementById('viewLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('showLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('backToGameBtn').addEventListener('click', () => this.showGameScreen());
    }

    // Switch to register form
    switchToRegister() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerForm').classList.add('active');
        this.registerForm.error.textContent = '';
    }

    // Switch to login form
    switchToLogin() {
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
        this.loginForm.error.textContent = '';
    }

    // Handle login
    handleLogin() {
        const username = this.loginForm.username.value.trim();
        const password = this.loginForm.password.value;

        this.loginForm.error.textContent = '';

        if (!username || !password) {
            this.loginForm.error.textContent = '請輸入用戶名和密碼';
            return;
        }

        const result = dataManager.loginUser(username, password);

        if (result.success) {
            this.currentUser = result.user;
            this.currentUser.loginTime = result.loginTime;
            this.showGameScreen();
        } else {
            this.loginForm.error.textContent = result.message;
        }
    }

    // Handle registration
    handleRegister() {
        const username = this.registerForm.username.value.trim();
        const password = this.registerForm.password.value;
        const confirmPassword = this.registerForm.confirmPassword.value;

        this.registerForm.error.textContent = '';

        if (!username || !password || !confirmPassword) {
            this.registerForm.error.textContent = '請填寫所有欄位';
            return;
        }

        if (password !== confirmPassword) {
            this.registerForm.error.textContent = '密碼不一致';
            return;
        }

        const result = dataManager.registerUser(username, password);

        if (result.success) {
            // Auto login after registration
            const loginResult = dataManager.loginUser(username, password);
            if (loginResult.success) {
                this.currentUser = loginResult.user;
                this.currentUser.loginTime = loginResult.loginTime;
                this.showGameScreen();
            }
        } else {
            this.registerForm.error.textContent = result.message;
        }
    }

    // Handle guest login
    handleGuestLogin() {
        const result = dataManager.loginAsGuest();

        if (result.success) {
            this.currentUser = result.user;
            this.currentUser.loginTime = result.loginTime;
            this.showGameScreen();
        }
    }

    // Handle logout
    handleLogout() {
        // Stop background music
        if (typeof audioManager !== 'undefined') {
            audioManager.stopBackgroundMusic();
        }

        dataManager.logoutUser();
        this.currentUser = null;

        // Reset login form
        this.loginForm.username.value = '';
        this.loginForm.password.value = '';
        this.loginForm.error.textContent = '';

        this.showLoginScreen();
    }

    // Show login screen
    showLoginScreen() {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens.login.classList.add('active');
    }

    // Show game screen
    showGameScreen() {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens.game.classList.add('active');

        // Update user info
        this.gameElements.currentUser.textContent = this.currentUser.username;
        this.gameElements.loginTime.textContent = dataManager.formatLoginTime(this.currentUser.loginTime);

        // Load user stats
        this.updateStats();

        // Initialize game
        if (!this.game) {
            this.game = new SnakeGame('gameCanvas');
            this.game.onScoreUpdate = (score) => this.updateScore(score);
            this.game.onGameOver = (score) => this.handleGameOver(score);
        }

        // Show start overlay
        this.gameElements.startOverlay.classList.remove('hidden');
        this.gameElements.gameOverlay.classList.add('hidden');
    }

    // Show leaderboard
    showLeaderboard() {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens.leaderboard.classList.add('active');

        this.renderLeaderboard();
    }

    // Start game
    startGame() {
        // Initialize audio context on first user interaction
        if (typeof audioManager !== 'undefined') {
            audioManager.init();
            audioManager.startBackgroundMusic();
        }

        this.gameElements.startOverlay.classList.add('hidden');
        this.gameElements.gameOverlay.classList.add('hidden');
        this.gameElements.currentScore.textContent = '0';

        this.game.startNewGame();
    }

    // Update score display
    updateScore(score) {
        this.gameElements.currentScore.textContent = score;
    }

    // Handle game over
    handleGameOver(score) {
        // Save score
        dataManager.saveScore(this.currentUser.username, score);

        // Update UI
        this.gameElements.finalScore.textContent = score;
        this.gameElements.gameOverlay.classList.remove('hidden');

        // Refresh stats
        this.updateStats();
    }

    // Update user statistics
    updateStats() {
        const stats = dataManager.getUserStats(this.currentUser.username);

        if (stats) {
            this.gameElements.totalGames.textContent = stats.totalGames;
            this.gameElements.avgScore.textContent = stats.avgScore;
            this.gameElements.personalBest.textContent = stats.highScore;
            this.gameElements.highScore.textContent = stats.highScore;

            // Render recent scores
            this.renderRecentScores(stats.recentScores);
        }
    }

    // Render recent scores list
    renderRecentScores(scores) {
        if (!scores || scores.length === 0) {
            this.gameElements.recentScores.innerHTML = '<div class="no-data">暫無記錄</div>';
            return;
        }

        const html = scores.map(scoreEntry => `
            <div class="recent-score-item">
                <span class="score">${scoreEntry.score}</span>
                <span class="date">${dataManager.formatDate(scoreEntry.date)}</span>
            </div>
        `).join('');

        this.gameElements.recentScores.innerHTML = html;
    }

    // Render leaderboard
    renderLeaderboard() {
        const leaderboard = dataManager.getLeaderboard(50);
        const tbody = document.getElementById('leaderboardBody');

        if (leaderboard.length === 0) {
            tbody.innerHTML = '<div class="no-data" style="padding: 3rem; grid-column: 1 / -1;">暫無排行榜數據</div>';
            return;
        }

        const html = leaderboard.map((entry, index) => {
            const isCurrentUser = this.currentUser && entry.username === this.currentUser.username;
            const rowClass = isCurrentUser ? 'table-row current-user' : 'table-row';

            return `
                <div class="${rowClass}">
                    <div class="rank-col">${index + 1}</div>
                    <div class="player-col">${entry.username}${isCurrentUser ? ' (你)' : ''}</div>
                    <div class="score-col">${entry.score}</div>
                    <div class="date-col">${dataManager.formatDate(entry.date)}</div>
                </div>
            `;
        }).join('');

        tbody.innerHTML = html;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
