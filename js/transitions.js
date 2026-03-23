/**
 * DocuScript AI - Page Transitions
 * Handles smooth, cinematic transitions between pages
 */

const Transitions = {
    // ============ Configuration ============
    defaultType: 'slide',
    duration: 400, // ms - matches CSS variable

    // ============ Transition Types ============
    types: {
        fade: {
            enter: ['page-fade-enter', 'page-fade-enter-active'],
            exit: ['page-fade-exit', 'page-fade-exit-active']
        },
        slide: {
            enter: ['page-slide-enter', 'page-slide-enter-active'],
            exit: ['page-slide-exit', 'page-slide-exit-active']
        },
        slideBack: {
            enter: ['page-slide-back-enter', 'page-slide-back-enter-active'],
            exit: ['page-slide-exit', 'page-slide-back-exit-active']
        },
        scale: {
            enter: ['page-scale-enter', 'page-scale-enter-active'],
            exit: ['page-scale-exit', 'page-scale-exit-active']
        }
    },

    // ============ Execute Transition ============
    async transition(container, newContent, type = this.defaultType, isBack = false) {
        const transitionType = isBack ? 'slideBack' : type;
        const classes = this.types[transitionType] || this.types.slide;

        // Get current content
        const currentContent = container.firstElementChild;

        // Create wrapper for new content
        const newWrapper = document.createElement('div');
        newWrapper.className = 'view-container';
        newWrapper.innerHTML = newContent;

        // Add body class to prevent scroll during transition
        document.body.classList.add('transitioning');

        // Exit animation for current content
        if (currentContent) {
            // Immediate scroll to top at the start of transition
            window.scrollTo({ top: 0, behavior: 'auto' });

            // Mark as exiting to hide fixed elements immediately
            currentContent.classList.add('exiting');
            currentContent.classList.add(classes.exit[0]);

            // Force reflow
            void currentContent.offsetWidth;

            currentContent.classList.add(classes.exit[1]);

            // Wait for exit animation
            await this.wait(this.duration);

            // Remove old content BEFORE adding new
            currentContent.remove();

            // Safety: Clear ALL remaining children to prevent stacking
            container.innerHTML = '';

            // Immediate scroll to top after content removal
            window.scrollTo(0, 0);
        }

        // Safety: Ensure container is absolutely empty before appending
        container.innerHTML = '';
        newWrapper.classList.add(classes.enter[0]);
        container.appendChild(newWrapper);

        // Force reflow
        void newWrapper.offsetWidth;

        // Trigger enter animation
        newWrapper.classList.remove(classes.enter[0]);
        newWrapper.classList.add(classes.enter[1]);

        // Wait for enter animation
        await this.wait(this.duration);

        // Clean up classes
        newWrapper.classList.remove(classes.enter[1]);
        document.body.classList.remove('transitioning');

        return newWrapper;
    },

    // ============ Helper: Wait ============
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ============ Show Loading State ============
    showLoading(container) {
        container.innerHTML = '<div class="view-container page-loading"></div>';
    }
};
