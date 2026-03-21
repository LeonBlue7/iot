// src/utils/logger.ts
import config from '../config/index.js';

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = config.nodeEnv === 'production';
  }

  /**
   * 格式化日志输出
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * 信息级别日志
   */
  info(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * 警告级别日志
   */
  warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('WARN', message, context));
  }

  /**
   * 错误级别日志
   */
  error(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('ERROR', message, context));
  }

  /**
   * 调试级别日志
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * 安全相关日志（始终记录）
   */
  security(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('SECURITY', message, context));
  }
}

export const logger = new Logger();
export default logger;
