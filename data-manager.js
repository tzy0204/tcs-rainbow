// ==================== Data Manager ====================
// Handles all localStorage operations for user authentication and game data

class DataManager {
    constructor() {
        this.USERS_KEY = 'neonSnake_users';
        this.CURRENT_USER_KEY = 'neonSnake_currentUser';
        this.initializeStorage();
    }

    // Initialize localStorage if not exists
    initializeStorage() {
        if (!localStorage.getItem(this.USERS_KEY)) {
            localStorage.setItem(this.USERS_KEY, JSON.stringify({}));
        }
    }

    // Simple hash function for password (client-side only - not secure for production)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    // Login as guest
    loginAsGuest() {
        const guestId = `訪客_${Date.now()}`;
        const currentTime = new Date().toISOString();

        // Create temporary guest user (not saved to users database)
        const guestUser = {
            username: guestId,
            isGuest: true,
            createdAt: currentTime,
            scores: [],
            stats: {
                totalGames: 0,
                highScore: 0,
                totalScore: 0
            }
        };

        // Set current user session
        const session = {
            username: guestId,
            loginTime: currentTime,
            isGuest: true
        };
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(session));

        return { success: true, message: '訪客登錄成功', user: guestUser, loginTime: currentTime };
    }

    // Register a new user
    registerUser(username, password) {
        const users = this.getAllUsers();

        // Check if username already exists
        if (users[username]) {
            return { success: false, message: '用戶名已存在' };
        }

        // Validate username and password
        if (username.length < 3) {
            return { success: false, message: '用戶名至少需要3個字符' };
        }

        if (password.length < 4) {
            return { success: false, message: '密碼至少需要4個字符' };
        }

        // Create new user
        const hashedPassword = this.hashPassword(password);
        users[username] = {
            username: username,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            scores: [],
            stats: {
                totalGames: 0,
                highScore: 0,
                totalScore: 0
            }
        };

        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return { success: true, message: '註冊成功' };
    }

    // Login user
    loginUser(username, password) {
        const users = this.getAllUsers();
        const user = users[username];

        if (!user) {
            return { success: false, message: '用戶不存在' };
        }

        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            return { success: false, message: '密碼錯誤' };
        }

        // Record login time
        const currentTime = new Date().toISOString();
        user.lastLogin = currentTime;
        users[username] = user;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        // Set current user session
        const session = {
            username: username,
            loginTime: currentTime
        };
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(session));

        return { success: true, message: '登錄成功', user: user, loginTime: currentTime };
    }

    // Logout user
    logoutUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    // Get current logged-in user
    getCurrentUser() {
        const sessionData = localStorage.getItem(this.CURRENT_USER_KEY);
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        const users = this.getAllUsers();
        const user = users[session.username];

        if (!user) {
            this.logoutUser();
            return null;
        }

        return {
            ...user,
            loginTime: session.loginTime
        };
    }

    // Get all users
    getAllUsers() {
        const usersData = localStorage.getItem(this.USERS_KEY);
        return JSON.parse(usersData) || {};
    }

    // Save game score
    saveScore(username, score) {
        // Check if this is a guest user
        const sessionData = localStorage.getItem(this.CURRENT_USER_KEY);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.isGuest) {
                // For guest users, we don't save to permanent storage
                // Just return true to allow the game to continue
                return true;
            }
        }

        const users = this.getAllUsers();
        const user = users[username];

        if (!user) return false;

        // Add score to user's score history
        const scoreEntry = {
            score: score,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        user.scores.push(scoreEntry);

        // Update stats
        user.stats.totalGames++;
        user.stats.totalScore += score;
        if (score > user.stats.highScore) {
            user.stats.highScore = score;
        }

        // Save updated user data
        users[username] = user;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        return true;
    }

    // Get user statistics
    getUserStats(username) {
        // Check if this is a guest user
        const sessionData = localStorage.getItem(this.CURRENT_USER_KEY);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.isGuest) {
                // Return empty stats for guests
                return {
                    totalGames: 0,
                    highScore: 0,
                    avgScore: 0,
                    recentScores: []
                };
            }
        }

        const users = this.getAllUsers();
        const user = users[username];

        if (!user) return null;

        const avgScore = user.stats.totalGames > 0
            ? Math.round(user.stats.totalScore / user.stats.totalGames)
            : 0;

        return {
            totalGames: user.stats.totalGames,
            highScore: user.stats.highScore,
            avgScore: avgScore,
            recentScores: user.scores.slice(-10).reverse() // Last 10 scores, most recent first
        };
    }

    // Get global leaderboard
    getLeaderboard(limit = 50) {
        const users = this.getAllUsers();
        const leaderboard = [];

        // Collect all scores from all users
        Object.values(users).forEach(user => {
            user.scores.forEach(scoreEntry => {
                leaderboard.push({
                    username: user.username,
                    score: scoreEntry.score,
                    date: scoreEntry.date,
                    timestamp: scoreEntry.timestamp
                });
            });
        });

        // Sort by score (descending) and then by date (most recent first)
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.timestamp - a.timestamp;
        });

        // Return top N entries
        return leaderboard.slice(0, limit);
    }

    // Format date for display
    formatDate(isoString) {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    // Format login time for display (e.g., "登錄於 2024/01/01 12:00")
    formatLoginTime(isoString) {
        return `登錄於 ${this.formatDate(isoString)}`;
    }
}

// Create global instance
const dataManager = new DataManager();
