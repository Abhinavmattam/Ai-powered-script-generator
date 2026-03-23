/**
 * DocuScript AI - Client-Side Router
 * Hash-based SPA routing with history support
 */

const Router = {
    // ============ Route Definitions ============
    routes: {
        '/': {
            view: 'landing',
            title: 'DocuScript AI - Cinematic Documentary Generator',
            requiresAuth: false
        },
        '/login': {
            view: 'login',
            title: 'DocuScript AI | Sign In',
            requiresAuth: false
        },
        '/dashboard': {
            view: 'dashboard',
            title: 'Dashboard | DocuScript AI',
            requiresAuth: true
        },
        '/getstart': {
            view: 'getstart',
            title: 'Create Script | DocuScript AI',
            requiresAuth: true
        },
        '/scriptgenerator': {
            view: 'scriptgenerator',
            title: 'Script | DocuScript AI',
            requiresAuth: true
        }
    },

    // ============ State ============
    currentRoute: null,
    container: null,
    isNavigatingBack: false,
    isNavigating: false,

    // ============ Initialize Router ============
    init(containerId = 'app-content') {
        this.container = document.getElementById(containerId);

        if (!this.container) {
            console.error('Router: Container not found:', containerId);
            return;
        }

        // Listen for hash changes (back/forward buttons)
        window.addEventListener('hashchange', (e) => {
            this.handleRouteChange();
        });

        // Listen for popstate (more reliable for back/forward)
        window.addEventListener('popstate', (e) => {
            this.isNavigatingBack = true;
            this.handleRouteChange();
        });

        // Handle initial route
        this.handleRouteChange();

        // Intercept link clicks for SPA navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                // DON'T prevent default for submit buttons INSIDE forms - let the form handle it
                const isFormSubmit = link.closest('form') && (link.type === 'submit' || (link.tagName === 'BUTTON' && !link.hasAttribute('type')));
                if (isFormSubmit) {
                    return;
                }

                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigate(route);
            }
        });

        // Initialize Firebase
        if (window.FirebaseService) {
            FirebaseService.init();
        }

        console.log('Router initialized');
    },

    // ============ Get Current Path ============
    getPath() {
        const hash = window.location.hash.slice(1); // Remove #
        return hash || '/';
    },

    // ============ Navigate to Route ============
    navigate(path, options = {}) {
        const { replace = false, transition = 'slide' } = options;

        // Check auth requirements
        const route = this.routes[path];
        if (route) {
            // Protected route check
            if (route.requiresAuth && !AppState.isLoggedIn()) {
                AppState.setRedirectAfterLogin(path);
                path = '/login';
            }
            // Already logged in, redirect away from login
            else if (route.redirectIfAuth && AppState.isLoggedIn()) {
                path = route.redirectIfAuth;
            }
        }

        this.isNavigatingBack = false;

        if (replace) {
            window.location.replace('#' + path);
        } else {
            window.location.hash = path;
        }
    },

    // ============ Handle Route Change ============
    async handleRouteChange() {
        if (this.isNavigating) return;
        this.isNavigating = true;

        const path = this.getPath();
        const route = this.routes[path];

        if (!route) {
            this.isNavigating = false;
            this.navigate('/', { replace: true });
            return;
        }

        // Check auth status
        const isLoggedIn = AppState.isLoggedIn();

        // Protected route check
        if (route.requiresAuth && !isLoggedIn) {
            this.isNavigating = false;
            AppState.setRedirectAfterLogin(path);
            this.navigate('/login', { replace: true });
            return;
        }

        // Already logged in, redirect away from login
        if (route.redirectIfAuth && isLoggedIn) {
            this.isNavigating = false;
            this.navigate(route.redirectIfAuth, { replace: true });
            return;
        }

        // Avoid re-loading the same view
        if (this.currentRoute === path && this.container.firstElementChild) {
            this.isNavigating = false;
            return;
        }

        try {
            // Update document title
            document.title = route.title;

            // Load and render view
            await this.loadView(route.view);

            this.currentRoute = path;
        } finally {
            this.isNavigating = false;
            this.isNavigatingBack = false;
        }
    },

    // ============ Load View ============
    async loadView(viewName) {
        try {
            // Show loading
            if (!this.container.firstElementChild) {
                Transitions.showLoading(this.container);
            }

            // Fetch view HTML
            const response = await fetch(`views/${viewName}.html`);
            if (!response.ok) {
                throw new Error(`View not found: ${viewName}`);
            }

            const html = await response.text();

            // Transition to new view
            await Transitions.transition(
                this.container,
                html,
                'slide',
                this.isNavigatingBack
            );

            // Initialize view-specific scripts
            this.initViewScripts(viewName);

        } catch (error) {
            console.error('Failed to load view:', error);
            this.container.innerHTML = `
                <div class="view-container flex items-center justify-center min-h-screen">
                    <div class="text-center">
                        <h2 class="text-2xl text-white mb-4">Page Not Found</h2>
                        <button data-route="/" class="px-6 py-3 bg-primary text-black font-bold rounded">
                            Go Home
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // ============ Initialize View Scripts ============
    initViewScripts(viewName) {
        switch (viewName) {
            case 'getstart':
                this.initGetStartedPage();
                break;
            case 'scriptgenerator':
                this.initScriptGeneratorPage();
                break;
            case 'login':
                this.initLoginPage();
                break;
            case 'dashboard':
                this.initDashboardPage();
                break;
            case 'landing':
                this.initLandingPage();
                break;
            default:
                break;
        }
    },

    // ============ Landing Page Init ============
    initLandingPage() {
        // Intercept all landing page specific actions
        document.querySelectorAll('[data-route]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const route = el.getAttribute('data-route');
                this.navigate(route);
            });
        });
    },

    // ============ Login Page Init ============
    initLoginPage() {
        const form = document.querySelector('#auth-form');
        const toggleInputs = document.querySelectorAll('input[name="auth-toggle"]');

        const updateUI = (isLogin) => {
            const heading = document.querySelector('#auth-heading');
            const subheading = document.querySelector('#auth-subheading');
            const submitBtn = document.querySelector('#auth-submit-text');
            const toggleText = document.querySelector('#auth-toggle-text');
            const toggleAction = document.querySelector('#auth-toggle-action');

            if (heading) heading.textContent = isLogin ? 'Welcome Back' : 'Create Account';
            if (subheading) {
                subheading.textContent = isLogin
                    ? 'Enter your credentials to access the studio.'
                    : 'Start creating cinematic documentaries today.';
            }
            if (submitBtn) submitBtn.textContent = isLogin ? 'Sign In to Dashboard' : 'Create Account';
            if (toggleText) toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
            if (toggleAction) toggleAction.textContent = isLogin ? 'Create one now' : 'Sign in';

            // Toggle Groups
            ['#signup-name-group', '#signup-username-group', '#signup-confirm-group'].forEach(id => {
                const group = document.querySelector(id);
                if (group) {
                    group.classList.toggle('hidden', isLogin);
                    const input = group.querySelector('input');
                    if (input) input.required = !isLogin;
                }
            });

            const forgotLink = document.querySelector('#forgot-password-link');
            if (forgotLink) forgotLink.classList.toggle('hidden', !isLogin);
        };

        // Handle form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const toggle = document.querySelector('input[name="auth-toggle"]:checked');
                const isLogin = toggle ? toggle.value === 'login' : true;

                const email = form.querySelector('input[type="email"]').value;
                const password = form.querySelector('input[type="password"]').value;

                try {
                    if (!isLogin) {
                        const name = document.querySelector('#signup-name-group input').value;
                        const username = document.querySelector('#signup-username-group input').value;
                        const confirmPassword = document.querySelector('#signup-confirm-group input').value;

                        if (password !== confirmPassword) {
                            alert("Passwords do not match!");
                            return;
                        }

                        // Firebase Sign Up
                        const result = await FirebaseService.signUp(email, password, { fullName: name, username });
                        if (result.success) {
                            AppState.login({
                                email: email,
                                name: name || username || email.split('@')[0]
                            });
                        }
                    } else {
                        // Firebase Sign In
                        const result = await FirebaseService.signIn(email, password);
                        if (result.success) {
                            AppState.login({
                                email: email,
                                name: result.userData.fullName || result.userData.username || email.split('@')[0]
                            });
                        }
                    }

                    // Redirect on success
                    const redirect = AppState.getAndClearRedirect() || '/dashboard';
                    window.location.hash = redirect;

                } catch (error) {
                    alert("Authentication Failed: " + error.message);
                }
            });
        }

        // Handle toggle between login/signup
        toggleInputs.forEach(input => {
            input.addEventListener('change', () => updateUI(input.value === 'login'));
        });

        // "Create one now" / "Sign in" toggle button
        const toggleActionBtn = document.querySelector('#auth-toggle-action');
        if (toggleActionBtn) {
            toggleActionBtn.addEventListener('click', () => {
                const signupRadio = document.querySelector('input[name="auth-toggle"][value="signup"]');
                const loginRadio = document.querySelector('input[name="auth-toggle"][value="login"]');
                if (signupRadio && loginRadio) {
                    const target = loginRadio.checked ? signupRadio : loginRadio;
                    target.checked = true;
                    updateUI(target.value === 'login');
                }
            });
        }

        // Sync initial state
        const currentToggle = document.querySelector('input[name="auth-toggle"]:checked');
        if (currentToggle) updateUI(currentToggle.value === 'login');
    },

    // ============ Get Started Wizard Init ============
    initGetStartedPage() {
        const titleInput = document.getElementById('script-title');
        const categorySelect = document.getElementById('script-category');
        const durationInput = document.getElementById('script-duration');
        const durationValue = document.getElementById('duration-value');
        const audienceFocus = document.getElementById('audience-focus');
        const notesTextarea = document.getElementById('script-notes');
        const toneCards = document.querySelectorAll('.tone-card');
        const generateBtn = document.getElementById('btn-generate');

        let selectedTone = 'Dramatic';

        // Duration slider logic
        if (durationInput) {
            durationInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (durationValue) durationValue.textContent = val;

                // Dynamic audience focus example
                if (audienceFocus) {
                    if (val < 20) audienceFocus.textContent = 'Social Media / Viral';
                    else if (val < 60) audienceFocus.textContent = 'Academic & Enthusiasts';
                    else audienceFocus.textContent = 'Theatrical / Cinema';
                }
            });
        }

        // Tone selection logic
        toneCards.forEach(card => {
            card.addEventListener('click', () => {
                toneCards.forEach(c => {
                    c.classList.add('opacity-60');
                    c.classList.remove('active', 'border-[#f4af25]/40', 'bg-white/5', 'shadow-[0_0_20px_rgba(244,175,37,0.1)]');
                });
                card.classList.remove('opacity-60');
                card.classList.add('active', 'border-[#f4af25]/40', 'bg-white/5', 'shadow-[0_0_20px_rgba(244,175,37,0.1)]');
                selectedTone = card.getAttribute('data-tone');
            });
        });

        // Generate button logic
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const scriptParams = {
                    title: titleInput.value,
                    category: document.getElementById('script-category').value,
                    visualStyle: document.getElementById('script-visual-style').value,
                    keyFigures: document.getElementById('script-figures').value,
                    targetPlatform: document.getElementById('script-platform').value,
                    tone: selectedTone,
                    duration: durationInput.value,
                    notes: notesTextarea.value
                };

                // Store params in AppState
                AppState.set('currentProject', scriptParams);

                // Navigate to generator
                this.navigate('/scriptgenerator');
            });
        }
    },

    // ============ Script Generator Page Init ============
    async initScriptGeneratorPage() {
        const project = AppState.get('currentProject');
        const headerTitle = document.getElementById('script-header-title');

        if (project && headerTitle) {
            headerTitle.textContent = project.title;
        }

        if (typeof GeminiService !== 'undefined') {
            await GeminiService.initGeneration();
        }

        // Handle Regenerate
        const regenerateBtn = document.getElementById('btn-regenerate');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', async () => {
                const statusText = document.getElementById('ai-status-text');
                if (statusText) statusText.textContent = "Regenerating full screenplay...";
                await GeminiService.initGeneration();
            });
        }

        // Handle Change Tone
        const changeToneBtn = document.getElementById('btn-change-tone');
        if (changeToneBtn) {
            changeToneBtn.addEventListener('click', async () => {
                const newTone = prompt("Enter new narrative tone (e.g., Poetic, Thriller, Noir, Educational):", project?.tone || 'Cinematic');
                if (newTone && project) {
                    const statusText = document.getElementById('ai-status-text');
                    if (statusText) statusText.textContent = `Adjusting tone to ${newTone}...`;

                    project.tone = newTone;
                    AppState.set('currentProject', project);
                    await GeminiService.initGeneration();
                }
            });
        }
    },

    // ============ Dashboard Page Init ============
    initDashboardPage() {
        const logoutBtn = document.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AppState.logout();
                this.navigate('/login', { replace: true });
            });
        }
    }
};

// Global App handle
window.App = {
    Router,
    AppState
};

// ============ Start Router on DOM Ready ============
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});
