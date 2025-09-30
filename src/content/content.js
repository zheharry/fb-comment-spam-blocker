/**
 * Content script for Facebook Comment Spam Blocker
 * Monitors Facebook comments and applies spam detection
 */

import { SpamDetector } from '../detectors/spamDetector.js'
import { FacebookParser } from '../utils/facebookParser.js'
import { Logger } from '../utils/logger.js'

class ContentScript {
  constructor() {
    this.logger = new Logger('ContentScript')
    this.spamDetector = null
    this.facebookParser = new FacebookParser()
    this.config = null
    this.blockedComments = new Set()
    this.processedComments = new Set()
    this.mutationObserver = null
    this.isInitialized = false
    
    this.initialize()
  }

  async initialize() {
    try {
      this.logger.info('Initializing Facebook Comment Spam Blocker...')
      
      // Get configuration from background script
      await this.loadConfiguration()
      
      // Initialize spam detector
      this.spamDetector = new SpamDetector(this.config)
      
      // Start monitoring Facebook comments
      this.startCommentMonitoring()
      
      // Set up message listener for configuration updates
      this.setupMessageListener()
      
      this.isInitialized = true
      this.logger.info('Content script initialized successfully')
      
    } catch (error) {
      this.logger.error('Failed to initialize content script:', error)
    }
  }

  async loadConfiguration() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
        if (response && response.success) {
          this.config = response.data
          resolve()
        } else {
          reject(new Error('Failed to load configuration'))
        }
      })
    })
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CONFIG_UPDATED') {
        this.config = message.data
        if (this.spamDetector) {
          this.spamDetector.updateConfig(this.config)
        }
        sendResponse({ success: true })
      }
      return true
    })
  }

  startCommentMonitoring() {
    // Initial scan of existing comments
    this.scanExistingComments()
    
    // Set up mutation observer for new comments
    this.setupMutationObserver()
    
    // Periodic rescan to catch any missed comments
    setInterval(() => {
      this.scanExistingComments()
    }, 10000) // Every 10 seconds
  }

  scanExistingComments() {
    if (!this.config || !this.config.enabled) return

    try {
      const comments = this.facebookParser.findComments()
      this.logger.debug(`Found ${comments.length} comments to analyze`)
      
      comments.forEach(commentElement => {
        this.processComment(commentElement)
      })
      
    } catch (error) {
      this.logger.error('Error scanning existing comments:', error)
    }
  }

  setupMutationObserver() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node contains comments
            const comments = this.facebookParser.findCommentsInElement(node)
            comments.forEach(commentElement => {
              // Add small delay to ensure comment is fully loaded
              setTimeout(() => {
                this.processComment(commentElement)
              }, 100)
            })
          }
        })
      })
    })

    // Start observing
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    this.logger.debug('Mutation observer set up for comment monitoring')
  }

  async processComment(commentElement) {
    try {
      // Get unique identifier for this comment
      const commentId = this.facebookParser.getCommentId(commentElement)
      if (!commentId || this.processedComments.has(commentId)) {
        return
      }

      // Parse comment data
      const commentData = this.facebookParser.parseComment(commentElement)
      if (!commentData || !commentData.text) {
        return
      }

      // Mark as processed
      this.processedComments.add(commentId)
      
      this.logger.debug('Processing comment:', {
        id: commentId,
        author: commentData.author?.username,
        textLength: commentData.text.length,
        taggedUsers: commentData.taggedUsers?.length || 0
      })

      // Analyze comment for spam
      const detectionResult = await this.spamDetector.analyzeComment(commentData)
      
      // Handle detection result
      if (detectionResult.isSpam) {
        await this.handleSpamComment(commentElement, commentData, detectionResult)
      }
      
    } catch (error) {
      this.logger.error('Error processing comment:', error)
    }
  }

  async handleSpamComment(commentElement, commentData, detectionResult) {
    const commentId = this.facebookParser.getCommentId(commentElement)
    
    this.logger.info('Spam detected:', {
      id: commentId,
      confidence: detectionResult.confidence,
      patterns: detectionResult.patterns.map(p => p.category),
      author: commentData.author?.username
    })

    // Hide the comment
    this.hideComment(commentElement, detectionResult)
    
    // Track blocked comment
    this.blockedComments.add(commentId)
    
    // Add to blacklist if confidence is high
    if (detectionResult.confidence > 0.9 && commentData.author) {
      await this.addToBlacklist(commentData.author)
    }
    
    // Update statistics
    chrome.runtime.sendMessage({
      type: 'UPDATE_STATISTICS',
      data: { blockedComments: 1 }
    })
    
    // Show notification if enabled
    if (this.config.settings?.showNotifications) {
      this.showSpamNotification(detectionResult)
    }
  }

  hideComment(commentElement, detectionResult) {
    // Add spam indicator class
    commentElement.classList.add('fb-spam-blocker-hidden')
    
    // Create replacement element
    const replacementDiv = document.createElement('div')
    replacementDiv.className = 'fb-spam-blocker-replacement'
    replacementDiv.innerHTML = `
      <div class="spam-notice">
        <span class="spam-icon">🛡️</span>
        <span class="spam-text">Spam comment blocked (${Math.round(detectionResult.confidence * 100)}% confidence)</span>
        <button class="show-comment-btn" type="button">Show anyway</button>
        <button class="report-false-positive-btn" type="button">Not spam</button>
      </div>
    `
    
    // Set up event listeners
    const showBtn = replacementDiv.querySelector('.show-comment-btn')
    const reportBtn = replacementDiv.querySelector('.report-false-positive-btn')
    
    showBtn.addEventListener('click', () => {
      commentElement.style.display = ''
      replacementDiv.remove()
    })
    
    reportBtn.addEventListener('click', () => {
      this.reportFalsePositive(detectionResult)
      commentElement.style.display = ''
      replacementDiv.remove()
    })
    
    // Hide original comment and insert replacement
    commentElement.style.display = 'none'
    commentElement.parentNode.insertBefore(replacementDiv, commentElement.nextSibling)
  }

  async addToBlacklist(author) {
    if (!author.id && !author.username) return
    
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_TO_BLACKLIST',
        data: {
          type: 'user',
          userId: author.id || author.username
        }
      })
      
      this.logger.info(`Added user ${author.username || author.id} to blacklist`)
    } catch (error) {
      this.logger.error('Failed to add user to blacklist:', error)
    }
  }

  showSpamNotification(detectionResult) {
    // Create floating notification
    const notification = document.createElement('div')
    notification.className = 'fb-spam-blocker-notification'
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">🛡️</span>
        <span class="notification-text">Blocked spam comment</span>
        <button class="notification-close" type="button">×</button>
      </div>
    `
    
    // Position and style
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1877f2;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close')
    closeBtn.addEventListener('click', () => {
      notification.remove()
    })
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove()
      }
    }, 5000)
    
    document.body.appendChild(notification)
  }

  async reportFalsePositive(detectionResult) {
    try {
      await chrome.runtime.sendMessage({
        type: 'REPORT_FALSE_POSITIVE',
        data: {
          patterns: detectionResult.patterns,
          confidence: detectionResult.confidence,
          timestamp: Date.now()
        }
      })
      
      this.logger.info('False positive reported')
    } catch (error) {
      this.logger.error('Failed to report false positive:', error)
    }
  }

  // Cleanup method
  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }
    
    // Remove any injected elements
    document.querySelectorAll('.fb-spam-blocker-replacement, .fb-spam-blocker-notification')
      .forEach(el => el.remove())
    
    // Restore hidden comments
    document.querySelectorAll('.fb-spam-blocker-hidden')
      .forEach(el => {
        el.style.display = ''
        el.classList.remove('fb-spam-blocker-hidden')
      })
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript()
  })
} else {
  new ContentScript()
}

// Handle page navigation in Facebook SPA
let currentUrl = location.href
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href
    // Reinitialize on navigation
    setTimeout(() => {
      new ContentScript()
    }, 1000)
  }
}).observe(document, { subtree: true, childList: true })