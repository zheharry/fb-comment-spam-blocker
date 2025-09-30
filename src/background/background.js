/**
 * Background script for Facebook Comment Spam Blocker
 * Handles extension lifecycle, storage management, and communication between components
 */

import { StorageManager } from '../utils/storage.js'
import { Logger } from '../utils/logger.js'

class BackgroundService {
  constructor() {
    this.storageManager = new StorageManager()
    this.logger = new Logger('Background')
    this.initialize()
  }

  async initialize() {
    this.logger.info('Background service initializing...')

    // Set up default configuration
    await this.setupDefaultConfig()

    // Set up event listeners
    this.setupEventListeners()

    this.logger.info('Background service initialized')
  }

  async setupDefaultConfig() {
    const defaultConfig = {
      enabled: true,
      detectionPatterns: {
        investmentScams: true,
        cryptoScams: true,
        genericSpam: true,
        socialEngineering: true
      },
      blacklist: {
        users: [],
        keywords: [
          '股海策略師',
          '投資',
          '獲利',
          '賺錢',
          '比特幣',
          '以太幣',
          '加密貨幣',
          '虛擬貨幣',
          '快速致富'
        ]
      },
      whitelist: {
        users: [],
        domains: []
      },
      statistics: {
        blockedComments: 0,
        blockedUsers: 0,
        falsePositives: 0,
        lastReset: Date.now()
      },
      settings: {
        aggressiveMode: false,
        showNotifications: true,
        logLevel: 'info',
        autoUpdate: true
      }
    }

    const existingConfig = await this.storageManager.get('config')
    if (!existingConfig) {
      await this.storageManager.set('config', defaultConfig)
      this.logger.info('Default configuration set')
    }
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details)
    })

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })

    // Handle tab updates to inject content script if needed
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab)
    })
  }

  async handleInstallation(details) {
    if (details.reason === 'install') {
      this.logger.info('Extension installed')
      // Show welcome page or setup wizard
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup/welcome.html')
      })
    } else if (details.reason === 'update') {
      this.logger.info(`Extension updated from ${details.previousVersion}`)
      // Handle migration if needed
      await this.handleVersionUpdate(details.previousVersion)
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'GET_CONFIG':
          const config = await this.storageManager.get('config')
          sendResponse({ success: true, data: config })
          break

        case 'UPDATE_CONFIG':
          await this.storageManager.set('config', message.data)
          sendResponse({ success: true })
          break

        case 'ADD_TO_BLACKLIST':
          await this.addToBlacklist(message.data)
          sendResponse({ success: true })
          break

        case 'REMOVE_FROM_BLACKLIST':
          await this.removeFromBlacklist(message.data)
          sendResponse({ success: true })
          break

        case 'UPDATE_STATISTICS':
          await this.updateStatistics(message.data)
          sendResponse({ success: true })
          break

        case 'REPORT_SPAM':
          await this.reportSpam(message.data)
          sendResponse({ success: true })
          break

        case 'REPORT_FALSE_POSITIVE':
          await this.reportFalsePositive(message.data)
          sendResponse({ success: true })
          break

        default:
          this.logger.warn(`Unknown message type: ${message.type}`)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      this.logger.error('Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Check if this is a Facebook page and extension is enabled
    if (changeInfo.status === 'complete' &&
        tab.url &&
        (tab.url.includes('facebook.com') || tab.url.includes('fb.com'))) {
      const config = await this.storageManager.get('config')
      if (config && config.enabled) {
        // Ensure content script is injected
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content/content.js']
          })
        } catch (error) {
          // Content script might already be injected
          this.logger.debug('Content script injection skipped:', error.message)
        }
      }
    }
  }

  async addToBlacklist(data) {
    const config = await this.storageManager.get('config')

    if (data.type === 'user' && data.userId) {
      if (!config.blacklist.users.includes(data.userId)) {
        config.blacklist.users.push(data.userId)
        await this.storageManager.set('config', config)
        this.logger.info(`Added user ${data.userId} to blacklist`)
      }
    } else if (data.type === 'keyword' && data.keyword) {
      if (!config.blacklist.keywords.includes(data.keyword)) {
        config.blacklist.keywords.push(data.keyword)
        await this.storageManager.set('config', config)
        this.logger.info(`Added keyword "${data.keyword}" to blacklist`)
      }
    }
  }

  async removeFromBlacklist(data) {
    const config = await this.storageManager.get('config')

    if (data.type === 'user' && data.userId) {
      config.blacklist.users = config.blacklist.users.filter(id => id !== data.userId)
      await this.storageManager.set('config', config)
      this.logger.info(`Removed user ${data.userId} from blacklist`)
    } else if (data.type === 'keyword' && data.keyword) {
      config.blacklist.keywords = config.blacklist.keywords.filter(k => k !== data.keyword)
      await this.storageManager.set('config', config)
      this.logger.info(`Removed keyword "${data.keyword}" from blacklist`)
    }
  }

  async updateStatistics(data) {
    const config = await this.storageManager.get('config')

    if (data.blockedComments) {
      config.statistics.blockedComments += data.blockedComments
    }
    if (data.blockedUsers) {
      config.statistics.blockedUsers += data.blockedUsers
    }
    if (data.falsePositives) {
      config.statistics.falsePositives += data.falsePositives
    }

    await this.storageManager.set('config', config)
  }

  async reportSpam(data) {
    // Log spam report for pattern improvement
    this.logger.info('Spam reported:', data)

    // In a real implementation, this could send data to a backend service
    // for pattern analysis and improvement
  }

  async reportFalsePositive(data) {
    // Log false positive for pattern adjustment
    this.logger.warn('False positive reported:', data)

    // Update statistics
    await this.updateStatistics({ falsePositives: 1 })

    // In a real implementation, this could adjust detection patterns
    // or add to whitelist automatically
  }

  async handleVersionUpdate(previousVersion) {
    // Handle migration between versions
    this.logger.info(`Migrating from version ${previousVersion}`)

    // Example: Add new configuration options while preserving existing settings
    const config = await this.storageManager.get('config')
    const defaultConfig = await this.getDefaultConfig()

    // Merge new default options with existing config
    const mergedConfig = this.mergeConfigs(config, defaultConfig)
    await this.storageManager.set('config', mergedConfig)
  }

  mergeConfigs(existing, defaults) {
    // Simple recursive merge - in production, use a proper deep merge library
    const result = { ...defaults }

    for (const key in existing) {
      if (existing.hasOwnProperty(key)) {
        if (typeof existing[key] === 'object' && !Array.isArray(existing[key])) {
          result[key] = this.mergeConfigs(existing[key], defaults[key] || {})
        } else {
          result[key] = existing[key]
        }
      }
    }

    return result
  }
}

// Initialize background service
new BackgroundService()
