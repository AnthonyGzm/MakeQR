// ==========================================
// MakeQR - Professional JavaScript
// ==========================================

class MakeQR {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.initSmoothScroll();
    }

    // Initialize DOM elements
    initElements() {
        this.elements = {
            form: document.getElementById('qr-form'),
            linkInput: document.getElementById('link-input'),
            colorDark: document.getElementById('color-dark'),
            colorLight: document.getElementById('color-light'),
            colorDarkHex: document.getElementById('color-dark-hex'),
            colorLightHex: document.getElementById('color-light-hex'),
            generateBtn: document.getElementById('generate-btn'),
            canvas: document.getElementById('qr-canvas'),
            qrResult: document.getElementById('qr-result'),
            qrDownload: document.getElementById('qr-download'),
            newQrBtn: document.getElementById('new-qr-btn'),
            inputError: document.getElementById('input-error')
        };
    }

    // Initialize event listeners
    initEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateQRCode();
        });

        // Color picker synchronization
        this.elements.colorDark.addEventListener('input', (e) => {
            this.syncColorPicker(e.target, this.elements.colorDarkHex);
        });

        this.elements.colorLight.addEventListener('input', (e) => {
            this.syncColorPicker(e.target, this.elements.colorLightHex);
        });

        // Hex input validation and synchronization
        this.elements.colorDarkHex.addEventListener('input', (e) => {
            this.syncHexInput(e.target, this.elements.colorDark);
        });

        this.elements.colorLightHex.addEventListener('input', (e) => {
            this.syncHexInput(e.target, this.elements.colorLight);
        });

        // New QR button
        this.elements.newQrBtn.addEventListener('click', () => {
            this.resetForm();
        });

        // Clear result on input change
        this.elements.linkInput.addEventListener('input', () => {
            this.elements.qrResult.classList.remove('show');
            this.elements.inputError.textContent = '';
            this.elements.linkInput.classList.remove('is-invalid');
        });

        // Input validation on blur
        this.elements.linkInput.addEventListener('blur', () => {
            this.validateInput(false);
        });
    }

    // Sync color picker to hex input
    syncColorPicker(colorPicker, hexInput) {
        const color = colorPicker.value.toUpperCase();
        hexInput.value = color;
    }

    // Sync hex input to color picker
    syncHexInput(hexInput, colorPicker) {
        let value = hexInput.value.toUpperCase();
        
        // Remove any non-hex characters
        value = value.replace(/[^#0-9A-F]/gi, '');
        
        // Ensure it starts with #
        if (!value.startsWith('#')) {
            value = '#' + value;
        }
        
        // Limit to 7 characters (#RRGGBB)
        value = value.substring(0, 7);
        
        hexInput.value = value;
        
        // Only update color picker if we have a valid hex color
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            colorPicker.value = value;
        }
    }

    // Validate input
    validateInput(showError = true) {
        const link = this.elements.linkInput.value.trim();
        
        if (!link) {
            if (showError) {
                this.elements.inputError.textContent = '⚠️ Por favor ingresa una URL o texto';
                this.elements.linkInput.classList.add('is-invalid');
            }
            return false;
        }

        if (link.length > 2000) {
            if (showError) {
                this.elements.inputError.textContent = '⚠️ El texto es demasiado largo (máximo 2000 caracteres)';
                this.elements.linkInput.classList.add('is-invalid');
            }
            return false;
        }

        this.elements.inputError.textContent = '';
        this.elements.linkInput.classList.remove('is-invalid');
        return true;
    }

    // Validate color contrast
    validateColorContrast() {
        const darkColor = this.elements.colorDark.value;
        const lightColor = this.elements.colorLight.value;

        // Convert hex to RGB
        const getRGB = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };

        // Calculate relative luminance
        const getLuminance = (rgb) => {
            const { r, g, b } = rgb;
            const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const darkRGB = getRGB(darkColor);
        const lightRGB = getRGB(lightColor);
        const darkLum = getLuminance(darkRGB);
        const lightLum = getLuminance(lightRGB);

        // Calculate contrast ratio
        const contrast = lightLum > darkLum 
            ? (lightLum + 0.05) / (darkLum + 0.05)
            : (darkLum + 0.05) / (lightLum + 0.05);

        // Warning if contrast is too low (less than 3:1)
        if (contrast < 3) {
            this.showNotification('⚠️ Los colores seleccionados tienen poco contraste. El QR podría ser difícil de escanear.', 'warning');
            return false;
        }

        return true;
    }

    // Generate QR Code
    async generateQRCode() {
        if (!this.validateInput(true)) {
            return;
        }

        const link = this.elements.linkInput.value.trim();
        const darkColor = this.elements.colorDark.value;
        const lightColor = this.elements.colorLight.value;

        // Validate color contrast
        this.validateColorContrast();

        // Set optimal size based on content length
        const size = this.calculateOptimalSize(link);
        
        // Disable button and show loading
        this.setLoadingState(true);

        try {
            // Clear canvas
            const ctx = this.elements.canvas.getContext('2d');
            this.elements.canvas.width = size;
            this.elements.canvas.height = size;
            ctx.clearRect(0, 0, size, size);

            // Create temporary container for QR code
            const tempDiv = document.createElement('div');
            
            // Generate QR code
            const qrCode = new QRCode(tempDiv, {
                text: link,
                width: size,
                height: size,
                colorDark: darkColor,
                colorLight: lightColor,
                correctLevel: QRCode.CorrectLevel.H // Highest error correction
            });

            // Wait for QR code generation
            await this.waitForQRGeneration(tempDiv);

            // Draw QR code on canvas
            const tempCanvas = tempDiv.querySelector('canvas');
            if (tempCanvas) {
                ctx.drawImage(tempCanvas, 0, 0);
                
                // Prepare download
                const dataUrl = this.elements.canvas.toDataURL('image/png');
                this.elements.qrDownload.href = dataUrl;
                this.elements.qrDownload.download = `makeqr-${this.generateFileName()}.png`;
                
                // Show result
                this.showResult();
                
                // Track analytics (if implemented)
                this.trackGeneration();
            } else {
                throw new Error('No se pudo generar el código QR');
            }

        } catch (error) {
            console.error('Error:', error);
            this.showNotification('❌ Error al generar el código QR. Por favor intenta nuevamente.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Calculate optimal QR size based on content
    calculateOptimalSize(content) {
        const length = content.length;
        
        if (length < 50) return 400;
        if (length < 100) return 450;
        if (length < 200) return 500;
        if (length < 500) return 600;
        return 700;
    }

    // Wait for QR generation
    waitForQRGeneration(container) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 100);
        });
    }

    // Generate unique filename
    generateFileName() {
        const date = new Date();
        const timestamp = date.getTime();
        return timestamp;
    }

    // Set loading state
    setLoadingState(isLoading) {
        if (isLoading) {
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Generando...
            `;
        } else {
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = `
                <i class="bi bi-magic"></i> Generar Código QR
            `;
        }
    }

    // Show result section
    showResult() {
        this.elements.qrResult.classList.add('show');
        
        // Smooth scroll to result
        setTimeout(() => {
            this.elements.qrResult.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);

        // Success feedback
        this.showSuccessFeedback();
    }

    // Show success feedback
    showSuccessFeedback() {
        const originalHTML = this.elements.generateBtn.innerHTML;
        this.elements.generateBtn.innerHTML = `
            <i class="bi bi-check-lg"></i> ¡Código Generado!
        `;
        this.elements.generateBtn.classList.add('btn-success');
        this.elements.generateBtn.classList.remove('btn-primary');

        setTimeout(() => {
            this.elements.generateBtn.innerHTML = originalHTML;
            this.elements.generateBtn.classList.remove('btn-success');
            this.elements.generateBtn.classList.add('btn-primary');
        }, 2000);
    }

    // Reset form
    resetForm() {
        this.elements.form.reset();
        this.elements.qrResult.classList.remove('show');
        this.elements.inputError.textContent = '';
        this.elements.linkInput.classList.remove('is-invalid');
        
        // Reset colors to default
        this.elements.colorDark.value = '#000000';
        this.elements.colorLight.value = '#FFFFFF';
        this.elements.colorDarkHex.value = '#000000';
        this.elements.colorLightHex.value = '#FFFFFF';
        
        // Focus on input
        this.elements.linkInput.focus();
        
        // Scroll to form
        this.elements.form.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    // Show notification (simple implementation)
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Track generation (placeholder for analytics)
    trackGeneration() {
        // Placeholder for analytics tracking
        console.log('QR Code generated');
        
        // Example: Google Analytics
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', 'generate_qr', {
        //         'event_category': 'engagement',
        //         'event_label': 'QR Code Generated'
        //     });
        // }
    }

    // Initialize smooth scroll for anchor links
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if it's just "#"
                if (href === '#') {
                    e.preventDefault();
                    return;
                }
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL without scrolling
                    history.pushState(null, null, href);
                }
            });
        });
    }
}

// ==========================================
// Navbar scroll effect
// ==========================================

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '0.5rem 0';
        } else {
            navbar.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            navbar.style.padding = '1rem 0';
        }
    });
}

// ==========================================
// Scroll to Top Button
// ==========================================

function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
    
    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==========================================
// Initialize on DOM ready
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize MakeQR
    const makeQR = new MakeQR();
    
    // Initialize navbar scroll effect
    initNavbarScroll();
    
    // Initialize scroll to top button
    initScrollToTop();
    
    // Add animation on scroll for feature cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.6s ease-out';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
    
    console.log('✨ MakeQR initialized successfully!');
});

// ==========================================
// Export for potential module use
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MakeQR;
}