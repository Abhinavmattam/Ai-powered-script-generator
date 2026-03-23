/**
 * DocuScript AI - State Management
 * Manages application state with localStorage persistence
 */

const AppState = {
    // ============ State Data ============
    _state: {
        isAuthenticated: false,
        user: null,
        currentProject: null,
        scriptContent: null,
        preferences: {
            tone: 'cinematic',
            style: 'documentary'
        },
        redirectAfterLogin: null
    },

    // ============ Subscribers for reactive updates ============
    _subscribers: [],

    // ============ Initialize state from localStorage ============
    init() {
        const saved = localStorage.getItem('docuscript_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this._state = { ...this._state, ...parsed };
            } catch (e) {
                console.warn('Failed to parse saved state:', e);
            }
        }
        return this;
    },

    // ============ Get state value ============
    get(key) {
        return key ? this._state[key] : { ...this._state };
    },

    // ============ Set state value ============
    set(key, value) {
        if (typeof key === 'object') {
            // Bulk update
            this._state = { ...this._state, ...key };
        } else {
            this._state[key] = value;
        }
        this._persist();
        this._notify();
        return this;
    },

    // ============ Persist to localStorage ============
    _persist() {
        try {
            localStorage.setItem('docuscript_state', JSON.stringify(this._state));
        } catch (e) {
            console.warn('Failed to persist state:', e);
        }
    },

    // ============ Subscribe to state changes ============
    subscribe(callback) {
        this._subscribers.push(callback);
        return () => {
            this._subscribers = this._subscribers.filter(cb => cb !== callback);
        };
    },

    // ============ Notify subscribers ============
    _notify() {
        this._subscribers.forEach(cb => cb(this._state));
    },

    // ============ Auth helpers ============
    login(user) {
        this.set({
            isAuthenticated: true,
            user: user
        });
    },

    logout() {
        this.set({
            isAuthenticated: false,
            user: null,
            currentProject: null,
            scriptContent: null
        });
    },

    isLoggedIn() {
        return this._state.isAuthenticated;
    },

    // ============ Redirect helper ============
    setRedirectAfterLogin(route) {
        this.set('redirectAfterLogin', route);
    },

    getAndClearRedirect() {
        const redirect = this._state.redirectAfterLogin;
        this.set('redirectAfterLogin', null);
        return redirect;
    },

    // ============ Clear all state ============
    clear() {
        localStorage.removeItem('docuscript_state');
        this._state = {
            isAuthenticated: false,
            user: null,
            currentProject: null,
            scriptContent: null,
            preferences: {
                tone: 'cinematic',
                style: 'documentary'
            },
            redirectAfterLogin: null
        };
        this._notify();
    }
};

// Initialize on load
AppState.init();
