/**
 * CleanSpot Debug Console Monitor
 * Monitors console logs for state management validation
 */

// Console log monitoring for CleanSpot state management validation
const CleanSpotDebugMonitor = {
  logs: [],
  expectedLogs: [
    '🗺️ Navigation vers la carte avec données du formulaire',
    '🔄 Restauration des données du formulaire depuis la carte',
    '📝 Mise à jour du champ',
    '📊 Nouvel état du formulaire',
    '✅ Données du formulaire restaurées',
    '📤 Paramètres de retour vers create'
  ],
  
  init() {
    console.log('🔍 CleanSpot Debug Monitor initialized');
    this.interceptConsole();
    this.startMonitoring();
  },
  
  interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      this.captureLog('log', args);
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      this.captureLog('error', args);
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.captureLog('warn', args);
      originalWarn.apply(console, args);
    };
  },
  
  captureLog(type, args) {
    const message = args.join(' ');
    const timestamp = new Date().toISOString();
    
    this.logs.push({
      type,
      message,
      timestamp,
      args
    });
    
    // Check for critical errors
    if (message.includes('Maximum update depth exceeded')) {
      this.reportCriticalError('Maximum update depth exceeded detected!');
    }
    
    // Check for expected logs
    this.expectedLogs.forEach(expectedLog => {
      if (message.includes(expectedLog)) {
        this.reportExpectedLog(expectedLog, message);
      }
    });
  },
  
  reportCriticalError(error) {
    console.error('🚨 CRITICAL ERROR DETECTED:', error);
    this.displayAlert('Critical Error', error, 'error');
  },
  
  reportExpectedLog(expected, actual) {
    console.log('✅ EXPECTED LOG FOUND:', expected);
    this.displayAlert('Expected Log Found', `${expected}\n\nFull message: ${actual}`, 'success');
  },
  
  displayAlert(title, message, type) {
    // Create visual alert in browser
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      border-radius: 5px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 400px;
      word-wrap: break-word;
      ${type === 'error' ? 'background-color: #ff4444;' : 'background-color: #44ff44;'}
    `;
    alertDiv.innerHTML = `<strong>${title}</strong><br>${message}`;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  },
  
  startMonitoring() {
    console.log('🔍 Starting CleanSpot state management monitoring...');
    console.log('📋 Expected logs to watch for:', this.expectedLogs);
    
    // Monitor for React errors
    window.addEventListener('error', (event) => {
      this.captureLog('error', [`Uncaught error: ${event.error}`]);
    });
    
    // Monitor for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureLog('error', [`Unhandled promise rejection: ${event.reason}`]);
    });
  },
  
  getReport() {
    const report = {
      totalLogs: this.logs.length,
      errors: this.logs.filter(log => log.type === 'error'),
      warnings: this.logs.filter(log => log.type === 'warn'),
      expectedLogsFound: [],
      criticalErrors: []
    };
    
    // Check which expected logs were found
    this.expectedLogs.forEach(expectedLog => {
      const found = this.logs.some(log => log.message.includes(expectedLog));
      if (found) {
        report.expectedLogsFound.push(expectedLog);
      }
    });
    
    // Check for critical errors
    report.criticalErrors = this.logs.filter(log => 
      log.message.includes('Maximum update depth exceeded') ||
      log.message.includes('Cannot update a component while rendering')
    );
    
    return report;
  },
  
  printReport() {
    const report = this.getReport();
    console.log('📊 CLEANSPOT DEBUG REPORT:');
    console.log('========================');
    console.log(`Total logs captured: ${report.totalLogs}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`Warnings: ${report.warnings.length}`);
    console.log(`Expected logs found: ${report.expectedLogsFound.length}/${this.expectedLogs.length}`);
    console.log(`Critical errors: ${report.criticalErrors.length}`);
    
    if (report.expectedLogsFound.length > 0) {
      console.log('\n✅ Expected logs found:');
      report.expectedLogsFound.forEach(log => console.log(`  - ${log}`));
    }
    
    if (report.criticalErrors.length > 0) {
      console.log('\n🚨 Critical errors:');
      report.criticalErrors.forEach(error => console.log(`  - ${error.message}`));
    }
    
    return report;
  }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  CleanSpotDebugMonitor.init();
  
  // Make available globally for manual testing
  window.CleanSpotDebugMonitor = CleanSpotDebugMonitor;
  
  // Add keyboard shortcut to print report (Ctrl+Shift+R)
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      CleanSpotDebugMonitor.printReport();
    }
  });
  
  console.log('🎯 CleanSpot Debug Monitor ready!');
  console.log('📋 Press Ctrl+Shift+R to print debug report');
}

export default CleanSpotDebugMonitor;
