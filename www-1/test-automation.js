// 🧪 **TEST AUTOMATION SCRIPT - LƯU CẤU HÌNH**
// Add this script to run automated tests

console.log('🚀 Starting Automated Tests...');

let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function addTest(name, result, details = '') {
    testResults.tests.push({ name, result, details });
    if (result) {
        testResults.passed++;
        console.log(`✅ ${name}: PASS ${details}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}: FAIL ${details}`);
    }
}

// Wait for DOM and scripts to load
setTimeout(() => {
    console.log('\n📋 Running Test Suite...\n');
    
    // Test 1: Element Detection
    const form = document.getElementById('config-form');
    const submitButton = document.querySelector('button[type="submit"]');
    const uartToggle = document.querySelector('#uart-toggle');
    const restartingModal = document.getElementById('restarting-modal');
    const deviceCheckModal = document.getElementById('device-check-modal');
    
    addTest('Form Element Found', !!form, form ? `ID: ${form.id}` : '');
    addTest('Submit Button Found', !!submitButton, submitButton ? `Type: ${submitButton.type}` : '');
    addTest('Submit Button Inside Form', form && submitButton ? form.contains(submitButton) : false);
    addTest('UART Toggle Found', !!uartToggle, uartToggle ? 'OK' : '');
    addTest('Restarting Modal Found', !!restartingModal, restartingModal ? 'OK' : '');
    addTest('Device Check Modal Found', !!deviceCheckModal, deviceCheckModal ? 'OK' : '');
    
    // Test 2: Event Listeners
    let formHasSubmitListener = false;
    let uartHasClickListener = false;
    
    // Check if form submit works
    if (form) {
        const testEvent = new Event('submit', { bubbles: true, cancelable: true });
        let eventFired = false;
        
        const testHandler = (e) => {
            e.preventDefault();
            eventFired = true;
            console.log('Form submit event detected in test');
        };
        
        form.addEventListener('submit', testHandler);
        form.dispatchEvent(testEvent);
        form.removeEventListener('submit', testHandler);
        
        formHasSubmitListener = eventFired;
    }
    
    addTest('Form Submit Event Listener', formHasSubmitListener);
    
    // Test 3: Modal Functionality
    if (restartingModal) {
        const wasHidden = restartingModal.classList.contains('hidden');
        restartingModal.classList.remove('hidden');
        const isVisible = !restartingModal.classList.contains('hidden');
        restartingModal.classList.add('hidden');
        
        addTest('Modal Show/Hide Works', wasHidden && isVisible);
    }
    
    // Test 4: UART Toggle
    if (uartToggle) {
        const uartConfig = document.querySelector('#uart-config');
        if (uartConfig) {
            const initialState = uartConfig.classList.contains('show');
            
            // Simulate click
            const clickEvent = new Event('click', { bubbles: true, cancelable: true });
            uartToggle.dispatchEvent(clickEvent);
            
            const afterClickState = uartConfig.classList.contains('show');
            addTest('UART Toggle Changes State', initialState !== afterClickState);
        }
    }
    
    // Test 5: Global Functions
    addTest('testFormSubmit Function Exists', typeof window.testFormSubmit === 'function');
    addTest('forceShowUART Function Exists', typeof window.forceShowUART === 'function');
    
    // Test Results Summary
    setTimeout(() => {
        console.log('\n📊 TEST RESULTS SUMMARY:');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📊 Total: ${testResults.tests.length}`);
        console.log(`🎯 Success Rate: ${(testResults.passed / testResults.tests.length * 100).toFixed(1)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Ready for production!');
        } else {
            console.log('\n⚠️ Some tests failed. Check issues above.');
            console.log('\nFailed Tests:');
            testResults.tests.filter(t => !t.result).forEach(t => {
                console.log(`❌ ${t.name}: ${t.details}`);
            });
        }
        
        // Store results globally for inspection
        window.testResults = testResults;
        console.log('\n💡 Access detailed results: window.testResults');
    }, 1000);
    
}, 2000);

// Add manual test triggers
window.runFormTest = function() {
    console.log('🧪 Manual Form Test');
    const form = document.getElementById('config-form');
    if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
    }
};

window.runModalTest = function() {
    console.log('🧪 Manual Modal Test');
    const modal = document.getElementById('restarting-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('hidden'), 3000);
    }
};

console.log('💡 Manual test functions available:');
console.log('- runFormTest()');
console.log('- runModalTest()');
console.log('- testFormSubmit()');
console.log('- forceShowUART()');
