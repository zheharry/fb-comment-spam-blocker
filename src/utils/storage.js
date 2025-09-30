/**
 * Storage utility for managing extension data
 * Provides a unified interface for Chrome storage API
 */

export class StorageManager {
  constructor() {
    this.storage = chrome.storage.sync || chrome.storage.local
  }

  /**
   * Get data from storage
   * @param {string|array|object} keys - Key(s) to retrieve
   * @returns {Promise<any>} Retrieved data
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      this.storage.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          // If single key requested, return just the value
          if (typeof keys === 'string') {
            resolve(result[keys])
          } else {
            resolve(result)
          }
        }
      })
    })
  }

  /**
   * Set data in storage
   * @param {string|object} keyOrData - Key or data object
   * @param {any} value - Value to store (if key provided)
   * @returns {Promise<void>}
   */
  async set(keyOrData, value) {
    return new Promise((resolve, reject) => {
      let data
      if (typeof keyOrData === 'string') {
        data = { [keyOrData]: value }
      } else {
        data = keyOrData
      }

      this.storage.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Remove data from storage
   * @param {string|array} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    return new Promise((resolve, reject) => {
      this.storage.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Clear all data from storage
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      this.storage.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Get storage usage info
   * @returns {Promise<object>} Usage info
   */
  async getBytesInUse(keys = null) {
    return new Promise((resolve, reject) => {
      this.storage.getBytesInUse(keys, (bytes) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(bytes)
        }
      })
    })
  }

  /**
   * Listen for storage changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onChanged(callback) {
    const listener = (changes, namespace) => {
      callback(changes, namespace)
    }
    
    chrome.storage.onChanged.addListener(listener)
    
    // Return unsubscribe function
    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }
}