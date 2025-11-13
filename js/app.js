const elements = {
    form: document.getElementById('qr-form'),
    linkInput: document.getElementById('link-input'),
    qrSize: document.getElementById('qr-size'),
    colorDark: document.getElementById('color-dark'),
    colorLight: document.getElementById('color-light'),
    colorDarkDisplay: document.getElementById('color-dark-display'),
    colorLightDisplay: document.getElementById('color-light-display'),
    previewDark: document.getElementById('preview-dark'),
    previewLight: document.getElementById('preview-light'),
    generateBtn: document.getElementById('generate-btn'),
    canvas: document.getElementById('qr-canvas'),
    qrPreview: document.getElementById('qr-preview'),
    qrDownload: document.getElementById('qr-download'),
    presetButtons: document.querySelectorAll('.preset-btn')
};

elements.colorDark.addEventListener('input', (e) => {
    const color = e.target.value.toUpperCase();
    elements.colorDarkDisplay.value = color;
    elements.previewDark.style.backgroundColor = color;
});

elements.colorLight.addEventListener('input', (e) => {
    const color = e.target.value.toUpperCase();
    elements.colorLightDisplay.value = color;
    elements.previewLight.style.backgroundColor = color;
});

elements.previewDark.addEventListener('click', () => {
    elements.colorDark.click();
});

elements.previewLight.addEventListener('click', () => {
    elements.colorLight.click();
});

elements.presetButtons.forEach(button => {
    button.addEventListener('click', function() {
        const darkColor = this.dataset.dark;
        const lightColor = this.dataset.light;
        
        elements.colorDark.value = darkColor;
        elements.colorLight.value = lightColor;
        elements.colorDarkDisplay.value = darkColor.toUpperCase();
        elements.colorLightDisplay.value = lightColor.toUpperCase();
        elements.previewDark.style.backgroundColor = darkColor;
        elements.previewLight.style.backgroundColor = lightColor;
    });
});

elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateQRCode();
});

function generateQRCode() {
    const link = elements.linkInput.value.trim();
    const size = parseInt(elements.qrSize.value);
    const ctx = elements.canvas.getContext('2d');
    
    if (!link) {
        elements.linkInput.classList.add('is-invalid');
        return;
    }
    
    elements.linkInput.classList.remove('is-invalid');
    elements.canvas.width = size;
    elements.canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    
    elements.generateBtn.disabled = true;
    elements.generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generando...';
    
    const tempDiv = document.createElement('div');
    
    try {
        const qrCode = new QRCode(tempDiv, {
            text: link,
            width: size,
            height: size,
            colorDark: elements.colorDark.value,
            colorLight: elements.colorLight.value,
            correctLevel: QRCode.CorrectLevel.H
        });
        
        setTimeout(() => {
            const tempCanvas = tempDiv.querySelector('canvas');
            
            if (tempCanvas) {
                ctx.drawImage(tempCanvas, 0, 0);
                const dataUrl = elements.canvas.toDataURL('image/png');
                elements.qrDownload.href = dataUrl;
                elements.qrDownload.download = `makeqr-${Date.now()}.png`;
                elements.qrPreview.classList.add('show');
                elements.qrPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                elements.generateBtn.innerHTML = '<i class="bi bi-check-lg"></i> ¡Código Generado!';
                setTimeout(() => {
                    elements.generateBtn.innerHTML = '<i class="bi bi-magic"></i> Generar Código QR';
                    elements.generateBtn.disabled = false;
                }, 2000);
            }
        }, 200);
    } catch (error) {
        alert('Error al generar el código QR');
        elements.generateBtn.innerHTML = '<i class="bi bi-magic"></i> Generar Código QR';
        elements.generateBtn.disabled = false;
    }
}

elements.linkInput.addEventListener('input', () => {
    elements.qrPreview.classList.remove('show');
});