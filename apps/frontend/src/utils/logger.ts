// Frontend logging utility for EventPass Pro

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  userAgent?: string;
  url?: string;
}

class FrontendLogger {
  private sessionId: string;
  private isDevelopment: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        sessionId: this.sessionId,
      },
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private async sendLog(entry: LogEntry): Promise<void> {
    try {
      // In development, also log to console
      if (this.isDevelopment) {
        console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry);
      }

      // Send to backend logging endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      // Fallback: log to console if sending fails
      console.error('Failed to send log entry:', err);
    }
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.sendLog(entry);
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.sendLog(entry);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, error);
    this.sendLog(entry);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.sendLog(entry);
  }

  // Specific logging methods for common frontend events
  logUserAction(action: string, component: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      component,
      action,
      metadata,
    });
  }

  logPageView(page: string): void {
    this.info('Page view', {
      component: 'navigation',
      action: 'page_view',
      metadata: { page },
    });
  }

  logApiCall(endpoint: string, method: string, duration: number, success: boolean): void {
    this.info('API call', {
      component: 'api',
      action: 'api_call',
      metadata: {
        endpoint,
        method,
        duration,
        success,
      },
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error('Frontend error', context, error);
  }

  logPerformance(metric: string, value: number, unit: string): void {
    this.info('Performance metric', {
      component: 'performance',
      action: 'metric',
      metadata: {
        metric,
        value,
        unit,
      },
    });
  }
}

// Export singleton instance
export const logger = new FrontendLogger();

// React hook for logging
export const useLogger = () => {
  return logger;
};

// Utility functions for common logging scenarios
export const logUserInteraction = (element: string, action: string, details?: any) => {
  logger.logUserAction(action, element, details);
};

export const logFormSubmission = (formName: string, success: boolean, errors?: any) => {
  logger.info('Form submission', {
    component: 'form',
    action: 'submit',
    metadata: {
      formName,
      success,
      errors,
    },
  });
};

export const logQrCodeScan = (success: boolean, error?: string) => {
  logger.info('QR code scan', {
    component: 'qr-scanner',
    action: 'scan',
    metadata: {
      success,
      error,
    },
  });
};