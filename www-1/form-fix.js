// Form Submit Fix - Debug và sửa lỗi submit button
console.log('🚀 Form Fix Script Loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Form Fix');
    
    // Find form and submit button
    const form = document.getElementById('config-form');
    const submitButton = document.querySelector('button[type="submit"]');
    
    console.log('Form found:', form);
    console.log('Submit button found:', submitButton);
    
    if (form && submitButton) {
        // Remove any existing event listeners
        form.removeEventListener('submit', handleFormSubmit);
        
        // Add new event listener with immediate preventDefault
        form.addEventListener('submit', function(event) {
            console.log('Form submit event triggered!');
            event.preventDefault(); // CRITICAL: Always prevent default form submission
            event.stopPropagation(); // Prevent event bubbling
            
            // Validation (same as original code)
            if (form.checkValidity() === false) {
                console.log('Form validation failed');
                event.stopPropagation();
                form.classList.add('was-validated');
                return;
            }
            
            // Disable button and show loading
            submitButton.disabled = true;
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Đang lưu...';
            
            console.log('Preparing form data...');
            
            // Serialize form data (compatible with original jQuery serializeObject)
            const formData = new FormData(form);
            const data = {};
            
            // Handle all form elements including checkboxes
            for (const [key, value] of formData.entries()) {
                if (data[key]) {
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value || '');
                } else {
                    data[key] = value || '';
                }
            }
            
            // Handle unchecked checkboxes (send as '0' like original code)
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked && checkbox.name) {
                    // Only add if not already handled by FormData
                    if (!(checkbox.name in data)) {
                        data[checkbox.name] = '0';
                    }
                }
            });
            
            console.log('Form data:', data);
            
            // Send to server
            fetch('/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                console.log('Server response:', response);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                console.log('Save successful:', result);
                
                // Show restart modal (compatible with original)
                const restartingModal = document.getElementById('restarting-modal');
                if (restartingModal) {
                    restartingModal.classList.remove('hidden');
                }
                
                // After 3 seconds, switch to device check modal
                setTimeout(() => {
                    if (restartingModal) {
                        restartingModal.classList.add('hidden');
                    }
                    showDeviceCheckModal();
                }, 3000);
            })
            .catch(error => {
                console.error('Save failed:', error);
                alert('Lỗi: ' + error.message);
            })
            .finally(() => {
                // Re-enable button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            });
        });
        
        console.log('Form submit handler attached successfully');
    } else {
        console.error('Form or submit button not found!');
    }
    
    // Test button click directly
    if (submitButton) {
        submitButton.addEventListener('click', function(event) {
            console.log('🎯 Submit button clicked directly');
            // Let form handle the submission
        });
    }
    
    // Add comprehensive debug info
    console.log('📊 Form Analysis:');
    console.log('Form ID:', form ? form.id : 'NOT FOUND');
    console.log('Submit button type:', submitButton ? submitButton.type : 'NOT FOUND');
    console.log('Submit button inside form:', form && submitButton ? form.contains(submitButton) : 'UNKNOWN');
    console.log('Form action:', form ? form.action : 'NOT FOUND');
    console.log('Form method:', form ? form.method : 'NOT FOUND');
    console.log('Form enctype:', form ? form.enctype : 'NOT FOUND');
    console.log('🚨 URI Too Long Fix: method="post" action="" should prevent GET submission');
    
    // Add test button for debugging
    const testButton = document.createElement('button');
    testButton.textContent = 'TEST FORM';
    testButton.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:10px;border:none;cursor:pointer;';
    testButton.onclick = function() {
        console.log('🧪 Manual test triggered');
        const form = document.getElementById('config-form');
        if (form) {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            console.log('Dispatching submit event to form');
            form.dispatchEvent(event);
        }
    };
    document.body.appendChild(testButton);
    
    // Test modal display
    const testModalButton = document.createElement('button');
    testModalButton.textContent = 'TEST MODAL';
    testModalButton.style.cssText = 'position:fixed;top:60px;right:10px;z-index:9999;background:blue;color:white;padding:10px;border:none;cursor:pointer;';
    testModalButton.onclick = function() {
        console.log('🧪 Testing modal display');
        const modal = document.getElementById('restarting-modal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Modal should be visible now');
        }
    };
    document.body.appendChild(testModalButton);
});

// Device check modal function
function showDeviceCheckModal() {
    const modal = document.getElementById('device-check-modal');
    const progressFill = document.getElementById('check-progress');
    const countdown = document.getElementById('countdown');
    const manualReload = document.getElementById('manual-reload');
    
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    let timeLeft = 10;
    let checkInterval;
    
    // Update countdown and progress
    const updateProgress = () => {
        const progress = ((10 - timeLeft) / 10) * 100;
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        if (countdown) {
            countdown.textContent = timeLeft;
        }
        
        // Try to ping device
        if (timeLeft <= 8) { // Start checking after 2 seconds
            checkDeviceStatus();
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(checkInterval);
            // Auto reload after 10 seconds
            window.location.reload();
        }
    };
    
    // Start countdown
    checkInterval = setInterval(updateProgress, 1000);
    updateProgress(); // Initial call
    
    // Manual reload button
    if (manualReload) {
        manualReload.onclick = () => {
            clearInterval(checkInterval);
            window.location.reload();
        };
    }
}

// Check if device is responsive
async function checkDeviceStatus() {
    try {
        const response = await fetch('/status', {
            method: 'GET',
            timeout: 2000
        });
        
        if (response.ok) {
            console.log('Device is responsive - auto reloading');
            const status = document.getElementById('check-status');
            if (status) {
                status.innerHTML = '<span style="color: #28a745;">✅ Thiết bị đã hoạt động! Đang tải lại...</span>';
            }
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        console.log('Device not ready yet:', error.message);
    }
}

// Backup function for manual testing
window.testFormSubmit = function() {
    console.log('Manual form submit test');
    const form = document.getElementById('config-form');
    if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
    }
};
