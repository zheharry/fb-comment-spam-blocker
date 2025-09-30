/**
 * Logger utility for consistent logging across the extension
 */

export class Logger {
  constructor(context = 'Extension') {
    this.context = context
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    this.currentLevel = this.levels.info
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.currentLevel = this.levels[level]
    }
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`
    return [prefix, message, ...args]
  }

  debug(message, ...args) {
    if (this.currentLevel <= this.levels.debug) {
      console.debug(...this.formatMessage('debug', message, ...args))
    }
  }

  info(message, ...args) {
    if (this.currentLevel <= this.levels.info) {
      console.info(...this.formatMessage('info', message, ...args))
    }
  }

  warn(message, ...args) {
    if (this.currentLevel <= this.levels.warn) {
      console.warn(...this.formatMessage('warn', message, ...args))
    }
  }

  error(message, ...args) {
    if (this.currentLevel <= this.levels.error) {
      console.error(...this.formatMessage('error', message, ...args))
    }
  }
}