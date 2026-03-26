// tests/utils/logger.test.ts
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  let consoleInfoSpy: ReturnType<typeof jest.spyOn>;
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;
  let consoleDebugSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.info('Test info message');

      expect(consoleInfoSpy).toHaveBeenCalled();
      const calls = consoleInfoSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('INFO');
      expect(callArg[0]).toContain('Test info message');

      process.env.NODE_ENV = originalEnv;
    });

    it('should log info message with context', () => {
      logger.info('Test message', { userId: 123 });

      expect(consoleInfoSpy).toHaveBeenCalled();
      const calls = consoleInfoSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('Test message');
      expect(callArg[0]).toContain('userId');
    });
  });

  describe('warn', () => {
    it('should log warn message', () => {
      logger.warn('Test warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('WARN');
      expect(callArg[0]).toContain('Test warning');
    });

    it('should log warn message with context', () => {
      logger.warn('Warning with context', { reason: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('reason');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('ERROR');
      expect(callArg[0]).toContain('Test error');
    });

    it('should log error message with context', () => {
      logger.error('Error with details', { code: 500 });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('code');
    });
  });

  describe('debug', () => {
    it('should log debug message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      const calls = consoleDebugSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('DEBUG');

      process.env.NODE_ENV = originalEnv;
    });

    it('should log debug message with context', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Debug with data', { temp: 25 });

      expect(consoleDebugSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('security', () => {
    it('should log security message', () => {
      logger.security('Security event');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('SECURITY');
      expect(callArg[0]).toContain('Security event');
    });

    it('should log security message with context', () => {
      logger.security('Login attempt', { ip: '192.168.1.1' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('ip');
    });
  });

  describe('formatMessage', () => {
    it('should format message with timestamp and level', () => {
      logger.info('Formatted message');

      expect(consoleInfoSpy).toHaveBeenCalled();
      const calls = consoleInfoSpy.mock.calls;
      const callArg = calls[0] as string[];
      // Check ISO timestamp format
      expect(callArg[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(callArg[0]).toContain('[INFO]');
    });

    it('should include context in formatted message', () => {
      logger.info('Message', { key: 'value' });

      expect(consoleInfoSpy).toHaveBeenCalled();
      const calls = consoleInfoSpy.mock.calls;
      const callArg = calls[0] as string[];
      expect(callArg[0]).toContain('"key":"value"');
    });
  });
});