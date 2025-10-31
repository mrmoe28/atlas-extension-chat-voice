/**
 * Error Handler - Global error handling and retry logic
 */

export class ErrorHandler {
  static setupGlobalErrorHandling() {
    // Global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // Could send to analytics or show user-friendly message
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent default browser behavior
    });
  }

  static async withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          await this.delay(delay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static showUserError(message, addMessage) {
    console.error('User error:', message);
    if (addMessage) {
      addMessage('system', `Error: ${message}`);
    } else {
      // Fallback: show alert or notification
      alert(`Error: ${message}`);
    }
  }

  static handleApiError(error, context, addMessage) {
    let userMessage = 'An error occurred';

    if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.message.includes('API') || error.message.includes('server')) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message.includes('permission') || error.message.includes('microphone')) {
      userMessage = 'Permission error. Please check microphone access.';
    }

    console.error(`${context}:`, error);
    this.showUserError(userMessage, addMessage);
  }
}