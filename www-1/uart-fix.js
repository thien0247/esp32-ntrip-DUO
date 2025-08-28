// UART Toggle Fix
function handleUARTToggle() {
    const uartConfig = document.querySelector('#uart-config');
    const toggleButton = document.querySelector('#uart-toggle');
    
    if (uartConfig && toggleButton) {
        const isShown = uartConfig.classList.contains('show');
        
        if (isShown) {
            uartConfig.classList.remove('show');
            toggleButton.textContent = 'Cấu hình nâng cao';
        } else {
            uartConfig.classList.add('show');
            toggleButton.textContent = 'Ẩn cấu hình';
        }
    }
}

// Add event listener
document.addEventListener('DOMContentLoaded', function() {
    const uartToggle = document.querySelector('#uart-toggle');
    if (uartToggle) {
        uartToggle.addEventListener('click', handleUARTToggle);
    }
});
