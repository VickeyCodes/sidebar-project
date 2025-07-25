/**
 * Enhanced Sidebar Component
 * Professional collapsible sidebar with modern features
 * Version: 2.0.1
 */

class SidebarManager {
    constructor() {
        this.isInitialized = false;
        this.isSidebarOpen = false;
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.resizeTimeout = null;
        this.activeSlide = 'home';
        
        // DOM Elements
        this.elements = {};
        
        // Configuration
        this.config = {
            breakpoints: {
                mobile: 768,
                tablet: 1024
            },
            swipeThreshold: 100,
            animationDuration: 300,
            debounceDelay: 250
        };
        
        this.init();
    }
    
    /**
     * Initialize the sidebar component
     */
    init() {
        if (this.isInitialized) return;
        
        this.cacheElements();
        this.bindEvents();
        this.setupAccessibility();
        this.handleInitialState();
        this.hideLoadingScreen();
        
        this.isInitialized = true;
        this.logInfo('Sidebar component initialized successfully');
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            toggle: document.getElementById('sidebarToggle'),
            sidebar: document.getElementById('sidebar'),
            overlay: document.getElementById('sidebarOverlay'),
            mainContent: document.getElementById('mainContent'),
            body: document.body,
            loadingScreen: document.getElementById('loadingScreen'),
            navLinks: document.querySelectorAll('.nav-link'),
            slides: document.querySelectorAll('.slide')
        };
        
        // Validate required elements
        const requiredElements = ['toggle', 'sidebar', 'overlay', 'mainContent', 'body'];
        for (const element of requiredElements) {
            if (!this.elements[element]) {
                throw new Error(`Required element '${element}' not found`);
            }
        }
    }
    
    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Toggle button
        this.elements.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSidebar();
        });
        
        // Overlay click
        this.elements.overlay.addEventListener('click', () => {
            if (this.isSidebarOpen) {
                this.closeSidebar();
            }
        });
        
        // Navigation links
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e, link));
            link.addEventListener('keydown', (e) => this.handleNavKeyDown(e, link));
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Touch events for swipe gestures
        this.bindTouchEvents();
        
        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, this.config.debounceDelay));
        
        // Focus management
        this.elements.sidebar.addEventListener('focusin', () => {
            if (!this.isSidebarOpen) this.openSidebar();
        });
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // ARIA attributes
        this.elements.toggle.setAttribute('aria-expanded', 'false');
        this.elements.sidebar.setAttribute('aria-hidden', 'true');
        this.elements.overlay.setAttribute('aria-hidden', 'true');
        
        // Tab index management
        this.updateTabIndices();
    }
    
    /**
     * Handle initial state based on screen size
     */
    handleInitialState() {
        if (this.isMobile()) {
            this.closeSidebar(false);
        }
        this.updateActiveNavLink();
    }
    
    /**
     * Hide loading screen with animation
     */
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            setTimeout(() => {
                this.elements.loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    this.elements.loadingScreen.remove();
                }, 500);
            }, 1000);
        }
    }
    
    /**
     * Toggle sidebar open/closed
     */
    toggleSidebar() {
        if (this.isAnimating) return;
        
        if (this.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    /**
     * Open sidebar with animations and accessibility
     */
    openSidebar() {
        if (this.isSidebarOpen || this.isAnimating) return;
        
        this.isAnimating = true;
        this.isSidebarOpen = true;
        
        // Update classes and attributes
        this.elements.sidebar.classList.add('active');
        this.elements.body.classList.add('sidebar-active');
        this.elements.toggle.setAttribute('aria-expanded', 'true');
        this.elements.sidebar.setAttribute('aria-hidden', 'false');
        
        // Handle overlay and content shift based on screen size
        if (this.isMobile()) {
            this.elements.overlay.classList.add('active');
            this.elements.overlay.setAttribute('aria-hidden', 'false');
            this.elements.body.classList.add('no-scroll');
        } else {
            this.elements.mainContent.classList.add('sidebar-open');
        }
        
        // Focus management
        this.trapFocus();
        
        // Animation complete
        setTimeout(() => {
            this.isAnimating = false;
        }, this.config.animationDuration);
        
        this.logInfo('Sidebar opened');
    }
    
    /**
     * Close sidebar with animations and accessibility
     */
    closeSidebar(animate = true) {
        if (!this.isSidebarOpen && animate) return;
        
        if (animate) this.isAnimating = true;
        this.isSidebarOpen = false;
        
        // Update classes and attributes
        this.elements.sidebar.classList.remove('active');
        this.elements.overlay.classList.remove('active');
        this.elements.body.classList.remove('sidebar-active', 'no-scroll');
        this.elements.mainContent.classList.remove('sidebar-open');
        
        this.elements.toggle.setAttribute('aria-expanded', 'false');
        this.elements.sidebar.setAttribute('aria-hidden', 'true');
        this.elements.overlay.setAttribute('aria-hidden', 'true');
        
        // Update tab indices
        this.updateTabIndices();
        
        // Return focus to toggle button
        if (animate) {
            setTimeout(() => {
                this.elements.toggle.focus();
                this.isAnimating = false;
            }, this.config.animationDuration);
        }
        
        this.logInfo('Sidebar closed');
    }
    
    /**
     * Handle navigation link clicks
     */
    handleNavClick(event, link) {
        const href = link.getAttribute('href');
        const page = link.getAttribute('data-page');
        
        // Update active state
        this.setActiveNavLink(link);
        
        // Handle internal navigation
        if (page) {
            event.preventDefault();
            this.navigateToSlide(page);
        }
        
        // Close sidebar on mobile after navigation
        if (this.isMobile() && this.isSidebarOpen) {
            setTimeout(() => this.closeSidebar(), 150);
        }
    }
    
    /**
     * Handle keyboard navigation
     */
    handleNavKeyDown(event, link) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            link.click();
        }
    }
    
    /**
     * Handle global keyboard events
     */
    handleKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                if (this.isSidebarOpen) {
                    event.preventDefault();
                    this.closeSidebar();
                }
                break;
            case 'Tab':
                if (this.isSidebarOpen && this.isMobile()) {
                    this.handleTabTrap(event);
                }
                break;
        }
    }
    
    /**
     * Bind touch events for swipe gestures
     */
    bindTouchEvents() {
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            touchStartTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            const touchDuration = Date.now() - touchStartTime;
            
            // Only handle quick swipes
            if (touchDuration < 300) {
                this.handleSwipe();
            }
        }, { passive: true });
    }
    
    /**
     * Handle swipe gestures
     */
    handleSwipe() {
        const swipeDistance = this.touchEndX - this.touchStartX;
        const absDistance = Math.abs(swipeDistance);
        
        if (absDistance < this.config.swipeThreshold) return;
        
        // Swipe right to open (from left edge)
        if (swipeDistance > 0 && !this.isSidebarOpen && this.touchStartX < 50) {
            this.openSidebar();
        }
        
        // Swipe left to close
        if (swipeDistance < 0 && this.isSidebarOpen) {
            this.closeSidebar();
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        const wasMobile = this.elements.body.classList.contains('was-mobile');
        const isMobile = this.isMobile();
        
        if (isMobile !== wasMobile) {
            this.elements.body.classList.toggle('was-mobile', isMobile);
            
            if (isMobile && this.isSidebarOpen) {
                // Switch to mobile overlay mode
                this.elements.mainContent.classList.remove('sidebar-open');
                this.elements.overlay.classList.add('active');
                this.elements.body.classList.add('no-scroll');
            } else if (!isMobile && this.isSidebarOpen) {
                // Switch to desktop mode
                this.elements.overlay.classList.remove('active');
                this.elements.body.classList.remove('no-scroll');
                this.elements.mainContent.classList.add('sidebar-open');
            }
        }
        
        this.logInfo(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
    }
    
    /**
     * Navigate to specific slide
     */
    navigateToSlide(slideId) {
        // Hide all slides
        this.elements.slides.forEach(slide => {
            slide.classList.remove('active-slide');
        });
        
        // Show target slide
        const targetSlide = document.querySelector(`[data-slide="${slideId}"]`);
        if (targetSlide) {
            targetSlide.classList.add('active-slide');
            this.activeSlide = slideId;
            
            // Smooth scroll to top
            targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    /**
     * Set active navigation link
     */
    setActiveNavLink(activeLink) {
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
            link.setAttribute('aria-current', 'false');
            link.setAttribute('tabindex', '-1');
        });
        
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
        activeLink.setAttribute('tabindex', '0');
    }
    
    /**
     * Update active nav link based on current page
     */
    updateActiveNavLink() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        
        this.elements.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || href === currentHash) {
                this.setActiveNavLink(link);
            }
        });
    }
    
    /**
     * Trap focus within sidebar for accessibility
     */
    trapFocus() {
        const focusableElements = this.elements.sidebar.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus first element
        setTimeout(() => firstElement.focus(), 100);
        
        this.firstFocusableElement = firstElement;
        this.lastFocusableElement = lastElement;
    }
    
    /**
     * Handle tab trapping within sidebar
     */
    handleTabTrap(event) {
        if (!this.firstFocusableElement || !this.lastFocusableElement) return;
        
        if (event.shiftKey) {
            if (document.activeElement === this.firstFocusableElement) {
                event.preventDefault();
                this.lastFocusableElement.focus();
            }
        } else {
            if (document.activeElement === this.lastFocusableElement) {
                event.preventDefault();
                this.firstFocusableElement.focus();
            }
        }
    }
    
    /**
     * Update tab indices for accessibility
     */
    updateTabIndices() {
        const isOpen = this.isSidebarOpen;
        
        this.elements.navLinks.forEach((link, index) => {
            if (isOpen) {
                link.setAttribute('tabindex', index === 0 ? '0' : '-1');
            } else {
                link.setAttribute('tabindex', '-1');
            }
        });
    }
    
    /**
     * Utility: Check if current viewport is mobile
     */
    isMobile() {
        return window.innerWidth <= this.config.breakpoints.mobile;
    }
    
    /**
     * Utility: Check if current viewport is tablet
     */
    isTablet() {
        return window.innerWidth > this.config.breakpoints.mobile && 
               window.innerWidth <= this.config.breakpoints.tablet;
    }
    
    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        return (...args) => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    /**
     * Utility: Logging
     */
    logInfo(message) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`🔧 Sidebar: ${message}`);
        }
    }
    
    /**
     * Public API: Get current state
     */
    getState() {
        return {
            isOpen: this.isSidebarOpen,
            isAnimating: this.isAnimating,
            activeSlide: this.activeSlide,
            viewport: {
                isMobile: this.isMobile(),
                isTablet: this.isTablet(),
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    /**
     * Public API: Programmatically open sidebar
     */
    open() {
        this.openSidebar();
    }
    
    /**
     * Public API: Programmatically close sidebar
     */
    close() {
        this.closeSidebar();
    }
    
    /**
     * Public API: Destroy the component
     */
    destroy() {
        // Remove event listeners
        // Reset DOM state
        // Clean up
        this.isInitialized = false;
        this.logInfo('Sidebar component destroyed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.sidebarManager = new SidebarManager();
    } catch (error) {
        console.error('Failed to initialize sidebar:', error);
    }
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`⚡ Page loaded in ${Math.round(loadTime)}ms`);
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarManager;
}