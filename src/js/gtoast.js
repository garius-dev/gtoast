class Gtoast {
    constructor(options = {}) {
        // Default configuration options for the toast notifications
        this.defaultOptions = {
            closeButton: true,          // Show a close button by default
            newestOnTop: true,          // New toasts appear on top
            progressBar: true,          // Show a progress bar for auto-close
            positionClass: 'top-right', // Default position of the toast
            autoClose: 5000,            // Auto-close duration in milliseconds
            theme: 'light',             // Default theme (light or dark)
            transition: 'slide',        // Default transition animation
            closeOnClick: false,        // Close toast when clicked
            resetOnHover: false,        // Reset auto-close timer on hover
            size: 'sm',                 // Default size (small)
            mobileView: false,          // Enable mobile-specific adjustments
            // SVG icons for different toast types
            successIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            errorIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            infoIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
            warningIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 19h20L12 2zm0 4v8m0 4h.01"/></svg>',
            closeButtonIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            backdrop: true,              // Show backdrop for modals
            backdropClose: true,        // Close modal when backdrop is clicked
            // Default modal dialog button configurations
            dialogButtons: {
                ok: { show: true, text: 'OK', class: 'gtoast-modal-btn-ok' },
                yes: { show: true, text: 'Yes', class: 'gtoast-modal-btn-yes' },
                no: { show: true, text: 'No', class: 'gtoast-modal-btn-no' },
                cancel: { show: true, text: 'Cancel', class: 'gtoast-modal-btn-cancel' }
            }
        };
        // Merge user-provided options with defaults
        this.options = { ...this.defaultOptions, ...options };
        // Store toast containers by position
        this.containers = new Map();
        // Animation durations for different transitions
        this.animationDurations = {
            bounce: 400,
            zoom: 300,
            flip: 700,
            slide: 300
        };
    }

    // Retrieve or create a container for toasts at a specific position
    getOrCreateContainer(position) {
        if (!this.containers.has(position)) {
            const container = document.createElement('div');
            container.id = `gtoast-container-${position}`;
            container.className = `gtoast-container gtoast-${position}`;
            // Special styling for center-center position (modals)
            if (position === 'center-center') {
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.height = '100vh';
                container.style.width = '100vw';
                container.style.top = '0';
                container.style.left = '0';
                container.style.position = 'fixed';
                container.style.zIndex = '1000000';
            }
            document.body.appendChild(container);
            this.containers.set(position, container);
        }
        return this.containers.get(position);
    }

    // Display a standard toast notification
    show(message, title = null, options = {}) {
        const toastOptions = { ...this.options, ...options };

        // Adjust position for mobile view if enabled
        if (toastOptions.mobileView && window.innerWidth < 768) {
            toastOptions.positionClass = toastOptions.positionClass.includes('bottom') ? 'bottom-center' : 'top-center';
        }

        const container = this.getOrCreateContainer(toastOptions.positionClass);

        const toast = document.createElement('div');
        toast.className = `gtoast gtoast-${toastOptions.transition}-enter--${toastOptions.positionClass}`;
        toast.setAttribute('data-theme', toastOptions.theme);

        // Apply type-specific styling (success, error, etc.)
        if (options.type) {
            toast.classList.add(`gtoast-${options.type}`);
        }

        toast.classList.add(`gtoast-size-${toastOptions.size}`);

        // Adjust width for mobile view
        if (toastOptions.mobileView && window.innerWidth < 768) {
            toast.style.setProperty('--gtoast-width', `${window.innerWidth - 24}px`);
        }

        const titleHtml = title ? `<div class="gtoast-title">${title}</div>` : '';

        // Construct the toast HTML structure
        toast.innerHTML = `
            ${toastOptions.progressBar ? '<div class="gtoast-progress-container"><div class="gtoast-progress-bg"></div><div class="gtoast-progress"></div></div>' : ''}
            <div class="gtoast-icon">
                ${this.getIcon(options.type, toastOptions)}
            </div>
            <div class="gtoast-content">
                ${titleHtml}
                <div class="gtoast-message">${message}</div>
            </div>
            ${toastOptions.closeButton ?
                `<button class="gtoast-close-button" role="button">${toastOptions.closeButtonIcon}</button>` :
                ''}
        `;

        // Add toast to container (newest on top or bottom)
        toastOptions.newestOnTop ?
            container.prepend(toast) :
            container.appendChild(toast);

        toast.offsetHeight; // Trigger reflow for animation

        // Setup auto-close if applicable
        if (toastOptions.autoClose && !toast.classList.contains('gtoast-promise-pending') && toastOptions.autoClose >= 0) {
            this.setupAutoClose(toast, toastOptions);
        }

        this.setupEventListeners(toast, toastOptions);
        this.setupTouchEvents(toast, toastOptions);

        return toast;
    }

    // Display a modal-style toast
    modal(message, title = null, options = {}) {
        const modalOptions = { ...this.options, ...options, positionClass: 'center-center', closeButton: false, closeOnClick: false };
        modalOptions.size = modalOptions.size === 'sm' ? 'md' : modalOptions.size; // Default to medium size for modals

        // Set default transition to 'zoom' if not specified, restrict to 'zoom' or 'flip'
        const transition = ['zoom', 'flip'].includes(modalOptions.transition) ? modalOptions.transition : 'zoom';

        // Merge default and custom dialog buttons
        const defaultButtons = this.defaultOptions.dialogButtons;
        const customButtons = modalOptions.dialogButtons || {};
        const mergedButtons = {};

        for (const key in defaultButtons) {
            if (customButtons[key]) {
                mergedButtons[key] = {
                    ...defaultButtons[key], // Keep default properties
                    ...customButtons[key]   // Override with provided properties
                };
            } else {
                mergedButtons[key] = { ...defaultButtons[key] }; // Use default
            }
        }

        // Ensure at least one button is visible
        const hasVisibleButton = Object.values(mergedButtons).some(btn => btn.show);
        if (!hasVisibleButton) {
            mergedButtons.ok = {
                show: true,
                text: 'OK',
                class: 'gtoast-modal-btn-ok'
            };
        }

        const container = this.getOrCreateContainer(modalOptions.positionClass);

        // Prevent body scrolling when modal is open
        document.body.classList.add('gtoast-modal-open');

        // Create backdrop if enabled
        let backdrop = null;
        if (modalOptions.backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = `gtoast-backdrop gtoast-backdrop-enter--${modalOptions.positionClass}`;
            container.appendChild(backdrop);
        }

        // Create the modal element
        const toast = document.createElement('div');
        toast.className = `gtoast gtoast-modal gtoast-${transition}-enter--${modalOptions.positionClass}`;
        toast.setAttribute('data-theme', modalOptions.theme);
        toast.classList.add(`gtoast-size-${modalOptions.size}`);
        toast.setAttribute('role', 'dialog');
        toast.setAttribute('aria-modal', 'true');

        // Apply type-specific styling
        if (options.type) {
            toast.classList.add(`gtoast-${options.type}`);
        }

        const titleHtml = title ? `<div class="gtoast-title">${title}</div>` : '';
        const buttonsHtml = this.createModalButtons({ ...modalOptions, dialogButtons: mergedButtons }, toast, backdrop, transition);

        // Construct modal HTML
        toast.innerHTML = `
            <div class="gtoast-modal-inner">
                ${modalOptions.progressBar ? '<div class="gtoast-progress-container"><div class="gtoast-progress-bg"></div><div class="gtoast-progress"></div></div>' : ''}
                <div class="gtoast-icon">
                    ${this.getIcon(options.type || 'info', modalOptions)}
                </div>
                <div class="gtoast-modal-content">
                    ${titleHtml}
                    <div class="gtoast-message">${message}</div>
                    <div class="gtoast-modal-buttons">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(toast);
        toast.offsetHeight; // Trigger reflow

        // Setup ESC key to close modal
        const closeModal = () => {
            this.close(toast, modalOptions, { backdrop, transition });
        };


        // Setup backdrop close if enabled
        if (modalOptions.backdrop && modalOptions.backdropClose) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeModal();
                }
            });
        }

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };

        if (modalOptions.autoClose && modalOptions.autoClose >= 0) {
            this.setupAutoClose(toast, modalOptions, { backdrop, transition });
        }

        document.addEventListener('keydown', handleEsc);

        // Create a chainable Promise-like object
        let hasThen = false;
        const modalPromise = {
            then: function (onFulfilled) {
                hasThen = true;
                if (!toast.__listeners) toast.__listeners = [];
                toast.__listeners.push(onFulfilled);
                return this; // Permite encadeamento
            }
        };

        toast.__hasThen = () => hasThen;
        return modalPromise;
    }

    // Generate HTML for modal buttons and attach click events
    createModalButtons(options, toast, backdrop, transition) {
        const { dialogButtons } = options;
        let buttonsHtml = '';

        const closeModal = () => {
            this.close(toast, options, { backdrop, transition });
        };

        for (const [type, btnConfig] of Object.entries(dialogButtons)) {
            if (btnConfig.show) {
                buttonsHtml += `
                    <button class="gtoast-modal-button ${btnConfig.class}" data-type="${type}">
                        ${btnConfig.text}
                    </button>
                `;
            }
        }

        // Attach click events to buttons after rendering
        setTimeout(() => {
            const buttons = toast.querySelectorAll('.gtoast-modal-button');
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const buttonType = button.getAttribute('data-type');
                    const resultObject = {
                        result: buttonType,
                        closeModal,
                        buttons,
                        eventButton: button
                    };

                    const hasThen = toast.__hasThen();
                    if (hasThen && toast.__listeners) {
                        // Dispara todos os listeners registrados no .then()
                        toast.__listeners.forEach(listener => listener(resultObject));
                    }

                    // Fecha automaticamente se não houver .then() ou se for 'cancel'
                    if (!hasThen || buttonType === 'cancel') {
                        closeModal();
                    }
                });
            });
        }, 0);

        return buttonsHtml;
    }

    // Return the appropriate icon based on toast type
    getIcon(type, options) {
        switch (type) {
            case 'success': return options.successIcon;
            case 'error': return options.errorIcon;
            case 'info': return options.infoIcon;
            case 'warning': return options.warningIcon;
            default: return options.successIcon; // Fallback to success icon
        }
    }

    // Setup auto-close functionality with progress bar
    setupAutoClose(toast, options, closeOptions = {}) {
        const isModal = toast.classList.contains('gtoast-modal');
        const progress = toast.querySelector('.gtoast-progress');
        let timeLeft = options.autoClose;
        let startTime = Date.now();
        let animationFrame;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, timeLeft - elapsed);

            if (progress) {
                progress.style.width = `${(remaining / options.autoClose) * 100}%`;
            }

            if (remaining <= 0) {
                if (isModal) {
                    const { backdrop, transition } = closeOptions;
                    this.close(toast, options, { backdrop, transition });
                } else {
                    this.close(toast, options);
                }
            } else {
                animationFrame = requestAnimationFrame(updateProgress);
            }
        };

        animationFrame = requestAnimationFrame(updateProgress);

        if (isModal) return;

        // Pause auto-close on hover
        toast.addEventListener('mouseenter', () => {
            cancelAnimationFrame(animationFrame);
            const elapsed = Date.now() - startTime;
            timeLeft = Math.max(0, timeLeft - elapsed);

            if (options.resetOnHover && progress) {
                progress.style.transition = 'width 0.1s linear';
                progress.offsetHeight;
                progress.style.width = '100%';
            } else if (progress) {
                progress.style.transition = 'none';
            }
        });

        // Resume auto-close when hover ends
        toast.addEventListener('mouseleave', () => {
            if (options.resetOnHover) {
                timeLeft = options.autoClose;
                startTime = Date.now();
            } else {
                startTime = Date.now();
            }

            animationFrame = requestAnimationFrame(updateProgress);
        });
    }

    // Setup click event listeners for close button and toast
    setupEventListeners(toast, options) {
        const closeButton = toast.querySelector('.gtoast-close-button');

        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close(toast, options);
            });
        }

        if (options.closeOnClick && !toast.classList.contains('gtoast-promise-pending')) {
            toast.addEventListener('click', () => this.close(toast, options));
        }
    }

    // Setup touch events for swipe-to-dismiss on mobile
    setupTouchEvents(toast, options) {
        if (!options.mobileView || window.innerWidth >= 768) return;

        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        const threshold = toast.offsetWidth * 0.5;
        const animationDuration = this.animationDurations[options.transition] || 300;

        const handleTouchStart = (e) => {
            if (e.target.closest('.gtoast-close-button') || toast.classList.contains('gtoast-promise-pending')) return;

            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            toast.classList.add('swiping');
            toast.style.transition = 'none';
            toast.style.opacity = '';
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;

            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;

            toast.style.transform = `translateX(${diffX}px)`;
            const opacity = Math.max(0, 1 - Math.abs(diffX) / toast.offsetWidth);
            toast.style.opacity = opacity;

            e.preventDefault();
        };

        const handleTouchEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;

            const diffX = currentX - startX;
            const absDiffX = Math.abs(diffX);
            const direction = diffX > 0 ? 'right' : 'left';
            const shouldDismiss = absDiffX > threshold;

            if (absDiffX < 10) return;

            if (shouldDismiss) {
                this.close(toast, options, { type: 'swipe', direction });
            } else {
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
                toast.style.transition = `transform ${animationDuration}ms ease-out, opacity ${animationDuration}ms ease-out`;

                toast.addEventListener('transitionend', () => {
                    toast.classList.remove('swiping', 'gtoast-returning');
                    toast.style.transition = '';
                    toast.style.transform = '';
                    toast.style.opacity = '';
                }, { once: true });
            }
        };

        toast.addEventListener('touchstart', handleTouchStart, { passive: true });
        toast.addEventListener('touchmove', handleTouchMove, { passive: false });
        toast.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Close a toast with animation
    close(toast, options, closeOptions = {}) {
        const toastOptions = { ...this.options, ...options };
        const effectivePositionClass = toastOptions.mobileView && window.innerWidth < 768
            ? (toastOptions.positionClass.includes('bottom') ? 'bottom-center' : 'top-center')
            : toastOptions.positionClass;

        const { type = toastOptions.transition, direction, backdrop, transition } = closeOptions;
        const animationDuration = this.animationDurations[transition || toastOptions.transition] || 300;

        // Restore body scrolling and interactions
        document.body.classList.remove('gtoast-modal-open');

        if (toast.classList.contains('gtoast-modal')) {
            toast.classList.remove(`gtoast-${transition || toastOptions.transition}-enter--${effectivePositionClass}`);
            toast.classList.add(`gtoast-${transition || toastOptions.transition}-exit--${effectivePositionClass}`);

            if (backdrop) {
                backdrop.classList.remove(`gtoast-backdrop-enter--${effectivePositionClass}`);
                backdrop.classList.add(`gtoast-backdrop-exit--${effectivePositionClass}`);
            }
        } else {
            toast.classList.remove(`gtoast-${toastOptions.transition}-enter--${effectivePositionClass}`);
            toast.classList.remove('swiping');

            if (type === 'swipe' && direction) {
                const toastWidth = toast.offsetWidth;
                const targetX = direction === 'right' ? toastWidth * 1.5 : -toastWidth * 1.5;
                toast.style.transition = `transform ${animationDuration}ms ease-in, opacity ${animationDuration}ms ease-in`;
                toast.style.transform = `translateX(${targetX}px)`;
                toast.style.opacity = '0';
            } else {
                toast.classList.add(`gtoast-${toastOptions.transition}-exit--${effectivePositionClass}`);
            }
        }

        const cleanup = () => {
            if (toast.parentNode) {
                const container = toast.parentNode;
                toast.parentNode.removeChild(toast);
                if (backdrop && backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
                if (container && !container.children.length) {
                    container.remove();
                    this.containers.delete(effectivePositionClass);
                }
            }
            document.body.classList.remove('gtoast-modal-open');
        };

        const handleAnimationEnd = () => {
            cleanup();
        };

        if (backdrop) {
            backdrop.addEventListener('animationend', handleAnimationEnd, { once: true });
        } else {
            toast.addEventListener('animationend', handleAnimationEnd, { once: true });
        }

        setTimeout(handleAnimationEnd, animationDuration);
    }

    // Convenience methods for specific toast types
    success(message, title = null, options = {}) {
        return this.show(message, title, { ...options, type: 'success' });
    }

    error(message, title = null, options = {}) {
        return this.show(message, title, { ...options, type: 'error' });
    }

    info(message, title = null, options = {}) {
        return this.show(message, title, { ...options, type: 'info' });
    }

    warning(message, title = null, options = {}) {
        return this.show(message, title, { ...options, type: 'warning' });
    }

    // Handle promises with pending, success, and error states
    promise(promise, { pending = "Promise is pending...", success, error } = {}, options = {}) {
        const toastOptions = { ...this.options, ...options, progressBar: false, closeButton: false, closeOnClick: false, autoClose: false };

        const pendingToast = this.show(pending, null, {
            ...toastOptions,
            type: null,
            transition: toastOptions.transition
        });

        pendingToast.classList.add('gtoast-promise-pending');
        const iconElement = pendingToast.querySelector('.gtoast-icon');
        iconElement.innerHTML = '<div class="Gtoast__spinner"></div>';

        promise.then(
            (result) => {
                pendingToast.classList.remove('gtoast-promise-pending');
                pendingToast.classList.add('gtoast-success');

                const fullOptions = { ...this.options, ...options };
                const contentElement = pendingToast.querySelector('.gtoast-content');
                contentElement.innerHTML = `<div class="gtoast-message">${success || 'Promise resolved successfully'}</div>`;

                iconElement.innerHTML = fullOptions.successIcon;
                iconElement.classList.add('Gtoast--animate-icon', 'Gtoast__zoom-enter');

                const existingProgress = pendingToast.querySelector('.gtoast-progress-container');
                if (existingProgress) existingProgress.remove();

                if (fullOptions.progressBar) {
                    pendingToast.insertAdjacentHTML('afterbegin', '<div class="gtoast-progress-container"><div class="gtoast-progress-bg"></div><div class="gtoast-progress" style="width: 100%;"></div></div>');
                }
                if (fullOptions.closeButton) {
                    pendingToast.insertAdjacentHTML('beforeend', `<button class="gtoast-close-button" role="button">${fullOptions.closeButtonIcon}</button>`);
                }

                if (fullOptions.autoClose) {
                    this.setupAutoClose(pendingToast, fullOptions);
                }
                this.setupEventListeners(pendingToast, fullOptions);
            },
            (err) => {
                pendingToast.classList.remove('gtoast-promise-pending');
                pendingToast.classList.add('gtoast-error');

                const fullOptions = { ...this.options, ...options };
                const contentElement = pendingToast.querySelector('.gtoast-content');
                contentElement.innerHTML = `<div class="gtoast-message">${error || 'Promise rejected'}</div>`;

                iconElement.innerHTML = fullOptions.errorIcon;
                iconElement.classList.add('Gtoast--animate-icon', 'Gtoast__zoom-enter');

                const existingProgress = pendingToast.querySelector('.gtoast-progress-container');
                if (existingProgress) existingProgress.remove();

                if (fullOptions.progressBar) {
                    pendingToast.insertAdjacentHTML('afterbegin', '<div class="gtoast-progress-container"><div class="gtoast-progress-bg"></div><div class="gtoast-progress" style="width: 100%;"></div></div>');
                }
                if (fullOptions.closeButton) {
                    pendingToast.insertAdjacentHTML('beforeend', `<button class="gtoast-close-button" role="button">${fullOptions.closeButtonIcon}</button>`);
                }

                if (fullOptions.autoClose) {
                    this.setupAutoClose(pendingToast, fullOptions);
                }
                this.setupEventListeners(pendingToast, fullOptions);
            }
        );

        return pendingToast;
    }
}