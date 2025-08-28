/**
 * ESP32 NTRIP Duo - Optimized JavaScript (Vanilla JS)
 * Theo UI Design Rules: No jQuery, No frameworks, Performance first
 */

(function() {
    'use strict';
    
    // ===== CONSTANTS =====
    const CONFIG = {
        AUTO_SAVE_DELAY: 1000,
        MAX_RETRIES: 3,
        STATUS_UPDATE_INTERVAL: 2500,
        RESTART_WAIT_TIME: 2500,
        ENDPOINTS: {
            CONFIG: '/config',
            STATUS: '/status',
            WIFI_SCAN: '/wifi/scan'
        },
        // Version checking URLs (same as original)
        RELEASES_API_URL: 'https://github.com/incarvr6/esp32-ntrip/releases/tag/0.0.1',
        RELEASES_HTML_URL: 'https://github.com/incarvr6/esp32-ntrip/releases/tag/0.0.1'
    };
    
    // ===== STATE =====
    let state = {
        currentConfig: {},
        statusUpdateTimer: null,
        reloadOnStatus: false,
        isSubmitting: false
    };
    
    // ===== UTILITY FUNCTIONS =====
    
    /**
     * Debounce function để tối ưu performance
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Serialize form data to object
     */
    function serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (like IP address parts)
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    /**
     * Make HTTP request với error handling
     */
    async function makeRequest(url, options = {}) {
        try {
            // Add timeout like original code (2000ms)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal,
                ...options
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }
    
    /**
     * Show/hide elements
     */
    function toggleElement(element, show) {
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
    
    /**
     * Format time từ seconds sang HH:MM:SS
     */
    function formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return [hours, minutes, secs]
            .map(v => v.toString().padStart(2, '0'))
            .join(':');
    }
    
    /**
     * Format byte size to human readable
     */
    function formatBytes(bytes) {
        const thresh = 1000; // Use 1000 like original code
        if (Math.abs(bytes) < thresh) {
            return bytes + 'B';
        }
        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + units[u];
    }
    
    /**
     * Get WiFi RSSI color class (same as original)
     */
    function getWifiRssiColorClass(rssi) {
        if (rssi > -50) {
            return 'primary';
        } else if (rssi > -60) {
            return 'success';
        } else if (rssi > -70) {
            return 'warning';
        } else {
            return 'danger';
        }
    }
    
    // ===== DOM MANAGEMENT =====
    
    /**
     * Get element với error handling
     */
    function getElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element;
    }
    
    /**
     * Get all elements
     */
    function getAllElements(selector) {
        return document.querySelectorAll(selector);
    }
    
    // ===== FORM HANDLING =====
    
    /**
     * Load configuration từ server
     */
    async function loadConfiguration() {
        try {
            const config = await makeRequest(CONFIG.ENDPOINTS.CONFIG);
            state.currentConfig = config;
            populateForm(config);
            updateVersionInfo(config.version);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            showNotification('Không thể tải cấu hình', 'error');
        }
    }
    
    /**
     * Populate form với data
     */
    function populateForm(data) {
        const form = getElement('#config-form');
        if (!form) return;
        
        // Populate input fields
        for (const [key, value] of Object.entries(data)) {
            const inputs = form.querySelectorAll(`[name="${key}"]`);
            
            inputs.forEach((input, index) => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = Array.isArray(value) ? 
                        value.includes(input.value) : 
                        input.value === value.toString();
                } else {
                    input.value = Array.isArray(value) ? 
                        (value[index] || '') : 
                        value;
                }
            });
        }
        
        // Update UI based on form state
        updateFormUI();
    }
    
    /**
     * Update UI based on form state
     */
    function updateFormUI() {
        // Update section enable/disable states
        updateSectionStates();
        
        // Update static IP visibility
        updateStaticIPVisibility();
        
        // Update UART advanced settings
        updateUARTAdvancedVisibility();
    }
    
    /**
     * Update section enable/disable states
     */
    function updateSectionStates() {
        const sections = [
            { toggle: '#wifi-sta-enable', content: '.section:has(#wifi-sta-enable) .section-content' },
            { toggle: '#wifi-ap-enable', content: '.section:has(#wifi-ap-enable) .section-content' },
            { toggle: '#ntrip-srv-enable', content: '.section:has(#ntrip-srv-enable) .section-content' },
            { toggle: '#ntrip-srv2-enable', content: '.section:has(#ntrip-srv2-enable) .section-content' },
            { toggle: '#ntrip-cli-enable', content: '.section:has(#ntrip-cli-enable) .section-content' }
        ];
        
        sections.forEach(({ toggle, content }) => {
            const toggleEl = getElement(toggle);
            const contentEl = getElement(content);
            
            if (toggleEl && contentEl) {
                contentEl.style.opacity = toggleEl.checked ? '1' : '0.5';
                contentEl.style.pointerEvents = toggleEl.checked ? 'auto' : 'none';
            }
        });
    }
    
    /**
     * Update static IP configuration visibility
     */
    function updateStaticIPVisibility() {
        const staticRadio = getElement('input[name="w_sta_static"][value="1"]');
        const staticConfig = getElement('#static-ip-config');
        
        if (staticRadio && staticConfig) {
            toggleElement(staticConfig, staticRadio.checked);
        }
    }
    
    /**
     * Update UART advanced settings visibility
     */
    function updateUARTAdvancedVisibility() {
        const uartConfig = getElement('#uart-config');
        if (uartConfig) {
            // Initially hidden, shown by button click
            toggleElement(uartConfig, uartConfig.classList.contains('show'));
        }
    }
    
    /**
     * Handle form submission
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        if (state.isSubmitting) return;
        
        const form = event.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        state.isSubmitting = true;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Đang lưu...';
            
            const formData = serializeForm(form);
            await makeRequest(CONFIG.ENDPOINTS.CONFIG, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            showRestartModal();
            
            // Set flag to reload after restart
            setTimeout(() => {
                state.reloadOnStatus = true;
            }, CONFIG.RESTART_WAIT_TIME);
            
        } catch (error) {
            console.error('Failed to save configuration:', error);
            showNotification('Lỗi khi lưu cấu hình', 'error');
        } finally {
            state.isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
    
    // ===== STATUS UPDATES =====
    
    /**
     * Update device status
     */
    async function updateStatus() {
        try {
            const status = await makeRequest(CONFIG.ENDPOINTS.STATUS);
            
            if (state.reloadOnStatus) {
                window.location.reload();
                return;
            }
            
            updateStatusDisplay(status);
            
        } catch (error) {
            console.error('Status update failed:', error);
        } finally {
            // Schedule next update
            state.statusUpdateTimer = setTimeout(updateStatus, CONFIG.STATUS_UPDATE_INTERVAL);
        }
    }
    
    /**
     * Update status display elements
     */
    function updateStatusDisplay(status) {
        // Update uptime
        const uptimeEl = getElement('#uptime');
        if (uptimeEl && status.uptime) {
            uptimeEl.textContent = formatUptime(status.uptime);
        }
        
        // Update memory
        const memoryEl = getElement('#memory');
        if (memoryEl && status.heap) {
            const percent = Math.round((status.heap.free / status.heap.total) * 100);
            memoryEl.textContent = `${percent}% free`;
        }
        
        // Update WiFi status
        updateWiFiStatus(status.wifi);
        
        // Update NTRIP status
        updateNTRIPStatus(status.streams);
    }
    
    /**
     * Update WiFi status displays
     */
    function updateWiFiStatus(wifi) {
        if (!wifi) return;
        
        // Station status
        const staStatus = getElement('#wifi-sta-status');
        if (staStatus) {
            if (!wifi.sta || !wifi.sta.active) {
                staStatus.textContent = 'Không hoạt động';
            } else if (!wifi.sta.connected) {
                staStatus.textContent = 'Không kết nối';
            } else {
                staStatus.textContent = `${wifi.sta.ssid} - ${wifi.sta.ip4}`;
            }
        }
        
        // Access Point status
        const apStatus = getElement('#wifi-ap-status');
        if (apStatus) {
            if (!wifi.ap || !wifi.ap.active) {
                apStatus.textContent = 'Không hoạt động';
            } else {
                apStatus.textContent = `${wifi.ap.ssid} - ${wifi.ap.devices} thiết bị`;
            }
        }
    }
    
    /**
     * Update NTRIP status displays
     */
    function updateNTRIPStatus(streams) {
        if (!streams) return;
        
        const statusElements = [
            { id: '#ntrip-srv-status', stream: 'ntrip_server' },
            { id: '#ntrip-srv2-status', stream: 'ntrip_server_2' },
            { id: '#ntrip-cli-status', stream: 'ntrip_client' }
        ];
        
        statusElements.forEach(({ id, stream }) => {
            const element = getElement(id);
            if (element && streams[stream]) {
                const stats = streams[stream];
                element.textContent = `${formatBytes(stats.total.in)} in / ${formatBytes(stats.total.out)} out`;
            }
        });
    }
    
    // ===== WIFI SCANNING =====
    
    /**
     * Scan for WiFi networks
     */
    async function scanWiFiNetworks() {
        const scanButton = getElement('#wifi-scan');
        const networksSelect = getElement('#wifi-networks');
        
        if (!scanButton || !networksSelect) return;
        
        try {
            scanButton.disabled = true;
            scanButton.textContent = 'Đang quét...';
            
            const networks = await makeRequest(CONFIG.ENDPOINTS.WIFI_SCAN);
            
            // Clear existing options
            networksSelect.innerHTML = '<option value="">Chọn mạng...</option>';
            
            // Add found networks
            networks.forEach(network => {
                const option = document.createElement('option');
                option.value = network.ssid;
                option.textContent = `${network.ssid} (${network.rssi}dBm) ${network.authmode !== 'OPEN' ? '🔒' : ''}`;
                networksSelect.appendChild(option);
            });
            
            // Show networks dropdown
            toggleElement(networksSelect, true);
            
        } catch (error) {
            console.error('WiFi scan failed:', error);
            showNotification('Quét WiFi thất bại', 'error');
        } finally {
            scanButton.disabled = false;
            scanButton.textContent = 'Quét';
        }
    }
    
    /**
     * Handle WiFi network selection
     */
    function handleWiFiNetworkSelect(event) {
        const selectedSSID = event.target.value;
        const ssidInput = getElement('#wifi-ssid');
        
        if (ssidInput && selectedSSID) {
            ssidInput.value = selectedSSID;
            // Hide the dropdown after selection
            toggleElement(event.target, false);
        }
    }
    
    // ===== UI INTERACTIONS =====
    
    /**
     * Show restart modal
     */
    function showRestartModal() {
        const modal = getElement('#loading-modal');
        if (modal) {
            toggleElement(modal, true);
        }
    }
    
    /**
     * Show notification (simple implementation)
     */
    function showNotification(message, type = 'info') {
        // Simple alert for now - could be enhanced with toast notifications
        if (type === 'error') {
            alert('Lỗi: ' + message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    // UART toggle handled by separate uart-fix.js file
    
    /**
     * Handle reset configuration
     */
    function handleResetConfig() {
        if (confirm('Bạn có chắc chắn muốn khôi phục cấu hình về mặc định không?\\nTất cả cài đặt hiện tại sẽ bị mất.')) {
            // Reset form to defaults
            const form = getElement('#config-form');
            if (form) {
                form.reset();
                updateFormUI();
            }
        }
    }
    
    /**
     * Update version information
     */
    function updateVersionInfo(version) {
        const versionEl = getElement('#project-version');
        if (versionEl && version) {
            versionEl.textContent = version;
        }
    }
    
    // ===== EVENT LISTENERS =====
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Form submission handled by form-fix.js
        
        // Section toggles
        const toggles = getAllElements('input[type="checkbox"][id$="-enable"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', debounce(updateSectionStates, 100));
        });
        
        // Static IP toggle
        const staticRadios = getAllElements('input[name="w_sta_static"]');
        staticRadios.forEach(radio => {
            radio.addEventListener('change', updateStaticIPVisibility);
        });
        
        // WiFi scan
        const scanButton = getElement('#wifi-scan');
        if (scanButton) {
            scanButton.addEventListener('click', scanWiFiNetworks);
        }
        
        // WiFi network selection
        const networksSelect = getElement('#wifi-networks');
        if (networksSelect) {
            networksSelect.addEventListener('change', handleWiFiNetworkSelect);
        }
        
        // UART toggle handled by uart-fix.js
        
        // Reset configuration
        const resetButton = getElement('#reset-config');
        if (resetButton) {
            resetButton.addEventListener('click', handleResetConfig);
        }
        
        // Auto-save on form changes (debounced)
        if (form) {
            const debouncedSave = debounce(() => {
                // Could implement auto-save here if needed
                console.log('Form changed - auto-save could be triggered');
            }, CONFIG.AUTO_SAVE_DELAY);
            
            form.addEventListener('change', debouncedSave);
        }
    }
    
    // ===== INITIALIZATION =====
    
    /**
     * Initialize the application
     */
    async function init() {
        console.log('ESP32 NTRIP Duo - Initializing...');
        
        try {
            // Setup event listeners
            setupEventListeners();
            
            // Load initial configuration
            await loadConfiguration();
            
            // Start status updates
            updateStatus();
            
            console.log('ESP32 NTRIP Duo - Initialized successfully');
            
        } catch (error) {
            console.error('Initialization failed:', error);
            showNotification('Khởi tạo ứng dụng thất bại', 'error');
        }
    }
    
    // ===== CLEANUP =====
    
    /**
     * Cleanup on page unload
     */
    function cleanup() {
        if (state.statusUpdateTimer) {
            clearTimeout(state.statusUpdateTimer);
        }
    }
    
    // ===== START APPLICATION =====
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
})();

// ===== UTILITY FUNCTIONS (Global scope for HTML oninput) =====

/**
 * Auto-tab to next input field when maxLength is reached
 * Used for PIN input fields
 */
function autoTab(target) {
    const length = target.value.length;
    if (length >= target.maxLength) {
        target.value = target.value.slice(-1);
        let next = target;
        while (next = next.nextElementSibling) {
            if (next.tagName === 'INPUT' && next.type === 'number') {
                next.focus();
                break;
            }
        }
    }
}

/**
 * Escape special characters for display
 * Used for socket message formatting  
 */
function print_escape(str) {
    return str.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

/**
 * Unescape special characters from display
 * Used for socket message formatting
 */
function print_unescape(str) {
    return str.replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
}
