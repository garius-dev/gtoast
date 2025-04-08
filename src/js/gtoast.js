class Gtoast {
    constructor(options = {}) {
        this.defaultOptions = {
            closeButton: true,
            newestOnTop: true,
            progressBar: true,
            positionClass: 'top-right',
            autoClose: 5000,
            theme: 'light',
            transition: 'slide',
            closeOnClick: false,
            resetOnHover: false,
            size: 'sm',
            mobileView: false,
            successIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            errorIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            infoIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
            warningIcon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 19h20L12 2zm0 4v8m0 4h.01"/></svg>',
            closeButtonIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        };
        this.options = { ...this.defaultOptions, ...options };
        this.containers = new Map();

        this.animationDurations = {
            bounce: 400,
            zoom: 300,
            flip: 700,
            slide: 300
        };
    }

    getOrCreateContainer(position) {
        if (!this.containers.has(position)) {
            const container = document.createElement('div');
            container.id = `gtoast-container-${position}`;
            container.className = `gtoast-container gtoast-${position}`;
            document.body.appendChild(container);
            this.containers.set(position, container);
        }
        return this.containers.get(position);
    }

    show(message, title = null, options = {}) {
        const toastOptions = { ...this.options, ...options };

        if (toastOptions.mobileView && window.innerWidth < 768) {
            toastOptions.positionClass = toastOptions.positionClass.includes('bottom') ? 'bottom-center' : 'top-center';
        }

        const container = this.getOrCreateContainer(toastOptions.positionClass);

        const toast = document.createElement('div');
        toast.className = `gtoast gtoast-${toastOptions.transition}-enter--${toastOptions.positionClass}`;

        toast.setAttribute('data-theme', toastOptions.theme);

        if (options.type) {
            toast.classList.add(`gtoast-${options.type}`);
        }

        toast.classList.add(`gtoast-size-${toastOptions.size}`);

        if (toastOptions.mobileView && window.innerWidth < 768) {
            toast.style.setProperty('--gtoast-width', `${window.innerWidth - 24}px`);
        }

        const titleHtml = title ? `<div class="gtoast-title">${title}</div>` : '';

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

        toastOptions.newestOnTop ?
            container.prepend(toast) :
            container.appendChild(toast);

        toast.offsetHeight;

        if (toastOptions.autoClose && !toast.classList.contains('gtoast-promise-pending') && toastOptions.autoClose >= 0) {
            this.setupAutoClose(toast, toastOptions);
        }

        this.setupEventListeners(toast, toastOptions);
        this.setupTouchEvents(toast, toastOptions);

        return toast;
    }

    getIcon(type, options) {
        switch (type) {
            case 'success': return options.successIcon;
            case 'error': return options.errorIcon;
            case 'info': return options.infoIcon;
            case 'warning': return options.warningIcon;
            default: return options.successIcon;
        }
    }

    setupAutoClose(toast, options) {
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
                this.close(toast, options);
            } else {
                animationFrame = requestAnimationFrame(updateProgress);
            }
        };

        animationFrame = requestAnimationFrame(updateProgress);

        toast.addEventListener('mouseenter', () => {
            cancelAnimationFrame(animationFrame);
            //if (progress) progress.style.transition = 'none';
            const elapsed = Date.now() - startTime;
            timeLeft = Math.max(0, timeLeft - elapsed);

            if (options.resetOnHover && progress) {
                progress.style.transition = 'width 0.1s linear';
                progress.offsetHeight;
                progress.style.width = '100%';
            } else if (progress) {
                progress.style.transition = 'none'
            }
        });

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

    setupTouchEvents(toast, options) {

        // Verifica se mobileView é true e a tela é menor que 768px
        if (!options.mobileView || window.innerWidth >= 768) return;

        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        const threshold = toast.offsetWidth * 0.5; // 50% da largura do toast como threshold
        const animationDuration = this.animationDurations[options.transition] || 300;


        const handleTouchStart = (e) => {

            // Evita conflito com closeButton
            if (e.target.closest('.gtoast-close-button') || toast.classList.contains('gtoast-promise-pending')) return;

            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            toast.classList.add('swiping'); // Desativa animações conflitantes
            toast.style.transition = 'none'; // Remove transições para controle manual
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

    close(toast, options, closeOptions = {}) {

        const toastOptions = { ...this.options, ...options };
        const effectivePositionClass = toastOptions.mobileView && window.innerWidth < 768
            ? (toastOptions.positionClass.includes('bottom') ? 'bottom-center' : 'top-center')
            : toastOptions.positionClass;

        const { type = toastOptions.transition, direction } = closeOptions;
        const animationDuration = this.animationDurations[options.transition] || 300;

        toast.classList.remove(`gtoast-${toastOptions.transition}-enter--${effectivePositionClass}`);
        toast.classList.remove('swiping');

        if (type === 'swipe' && direction) {
            const toastWidth = toast.offsetWidth;
            const targetX = direction === 'right' ? toastWidth * 1.5 : -toastWidth * 1.5;
            toast.style.transition = `transform ${animationDuration}ms ease-in, opacity ${animationDuration}ms ease-in`;
            toast.style.transform = `translateX(${targetX}px)`;
            toast.style.opacity = '0';
        }
        else {
            toast.classList.add(`gtoast-${toastOptions.transition}-exit--${effectivePositionClass}`);
        }

        // Listener para remover o toast após a animação
        const cleanup = () => {

            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
                const container = this.containers.get(effectivePositionClass);
                if (container && !container.children.length) {
                    container.remove();
                    this.containers.delete(effectivePositionClass);
                }
            }
        };

        toast.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, animationDuration);

    }

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