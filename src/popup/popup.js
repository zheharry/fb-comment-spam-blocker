/**
 * Popup script for Facebook Comment Spam Blocker
 * Handles the extension popup interface and user interactions
 */

class PopupManager {
  constructor() {
    this.config = null
    this.statistics = null
    this.initialize()
  }

  async initialize() {
    try {
      // Load configuration and statistics
      await this.loadData()
      
      // Set up UI elements
      this.setupUI()
      
      // Set up event listeners
      this.setupEventListeners()
      
      // Update display
      this.updateDisplay()
      
    } catch (error) {
      console.error('Failed to initialize popup:', error)
      this.showError('Failed to load extension data')
    }
  }

  async loadData() {
    // Show loading overlay
    this.showLoading(true)
    
    try {
      // Get configuration
      const configResponse = await this.sendMessage({ type: 'GET_CONFIG' })
      if (configResponse && configResponse.success) {
        this.config = configResponse.data
      } else {
        throw new Error('Failed to load configuration')
      }
    } finally {
      this.showLoading(false)
    }
  }

  setupUI() {
    // Set up toggle states based on configuration
    if (this.config) {
      document.getElementById('enableToggle').checked = this.config.enabled
      document.getElementById('investmentScams').checked = this.config.detectionPatterns?.investmentScams !== false
      document.getElementById('cryptoScams').checked = this.config.detectionPatterns?.cryptoScams !== false
      document.getElementById('genericSpam').checked = this.config.detectionPatterns?.genericSpam !== false
      document.getElementById('socialEngineering').checked = this.config.detectionPatterns?.socialEngineering !== false
      document.getElementById('aggressiveMode').checked = this.config.settings?.aggressiveMode === true
      document.getElementById('showNotifications').checked = this.config.settings?.showNotifications !== false
    }
  }

  setupEventListeners() {
    // Main toggle
    document.getElementById('enableToggle').addEventListener('change', (e) => {
      this.updateConfig({ enabled: e.target.checked })
    })

    // Detection type toggles
    const detectionToggles = [
      'investmentScams', 'cryptoScams', 'genericSpam', 'socialEngineering'
    ]
    
    detectionToggles.forEach(id => {
      document.getElementById(id).addEventListener('change', (e) => {
        this.updateDetectionPattern(id, e.target.checked)
      })
    })

    // Settings toggles
    document.getElementById('aggressiveMode').addEventListener('change', (e) => {
      this.updateSetting('aggressiveMode', e.target.checked)
    })

    document.getElementById('showNotifications').addEventListener('change', (e) => {
      this.updateSetting('showNotifications', e.target.checked)
    })

    // Action buttons
    document.getElementById('manageBlacklist').addEventListener('click', () => {
      this.showBlacklistModal()
    })

    document.getElementById('viewStatistics').addEventListener('click', () => {
      this.showStatisticsModal()
    })

    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings()
    })

    // Quick actions
    document.getElementById('resetStatistics').addEventListener('click', () => {
      this.resetStatistics()
    })

    document.getElementById('openHelp').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/zheharry/fb-comment-spam-blocker/wiki' })
    })

    document.getElementById('reportIssue').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/zheharry/fb-comment-spam-blocker/issues' })
    })

    // Modal event listeners
    this.setupModalEventListeners()
  }

  setupModalEventListeners() {
    // Modal overlay click to close
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') {
        this.closeModals()
      }
    })

    // Close buttons
    document.getElementById('closeBlacklist').addEventListener('click', () => {
      this.closeModals()
    })

    document.getElementById('closeStatistics').addEventListener('click', () => {
      this.closeModals()
    })

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Blacklist management
    document.getElementById('addUser').addEventListener('click', () => {
      this.addToBlacklist('user')
    })

    document.getElementById('addKeyword').addEventListener('click', () => {
      this.addToBlacklist('keyword')
    })

    // Enter key support for inputs
    document.getElementById('newUserInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToBlacklist('user')
      }
    })

    document.getElementById('newKeywordInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToBlacklist('keyword')
      }
    })
  }

  updateDisplay() {
    if (this.config && this.config.statistics) {
      document.getElementById('blockedComments').textContent = this.config.statistics.blockedComments || 0
      document.getElementById('blockedUsers').textContent = this.config.statistics.blockedUsers || 0
      
      // Calculate accuracy
      const total = (this.config.statistics.blockedComments || 0) + (this.config.statistics.falsePositives || 0)
      const accuracy = total > 0 ? Math.round(((this.config.statistics.blockedComments || 0) / total) * 100) : 0
      document.getElementById('accuracy').textContent = total > 0 ? `${accuracy}%` : 'N/A'
    }
  }

  async updateConfig(updates) {
    try {
      this.config = { ...this.config, ...updates }
      await this.sendMessage({
        type: 'UPDATE_CONFIG',
        data: this.config
      })
      
      // Notify content scripts of config change
      this.notifyConfigUpdate()
      
    } catch (error) {
      console.error('Failed to update configuration:', error)
      this.showError('Failed to save settings')
    }
  }

  async updateDetectionPattern(pattern, enabled) {
    const detectionPatterns = {
      ...this.config.detectionPatterns,
      [pattern]: enabled
    }
    await this.updateConfig({ detectionPatterns })
  }

  async updateSetting(setting, value) {
    const settings = {
      ...this.config.settings,
      [setting]: value
    }
    await this.updateConfig({ settings })
  }

  async notifyConfigUpdate() {
    try {
      const tabs = await chrome.tabs.query({ url: '*://www.facebook.com/*' })
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONFIG_UPDATED',
          data: this.config
        }).catch(() => {
          // Tab might not have content script loaded
        })
      })
    } catch (error) {
      // Ignore errors - some tabs might not be accessible
    }
  }

  showBlacklistModal() {
    document.getElementById('modalOverlay').classList.add('show')
    document.getElementById('blacklistModal').style.display = 'flex'
    document.getElementById('statisticsModal').style.display = 'none'
    
    this.loadBlacklistData()
  }

  showStatisticsModal() {
    document.getElementById('modalOverlay').classList.add('show')
    document.getElementById('statisticsModal').style.display = 'flex'
    document.getElementById('blacklistModal').style.display = 'none'
    
    this.loadStatisticsData()
  }

  closeModals() {
    document.getElementById('modalOverlay').classList.remove('show')
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden')
    })
    document.getElementById(`${tabName}Tab`).classList.remove('hidden')
  }

  loadBlacklistData() {
    if (!this.config || !this.config.blacklist) return

    // Load users
    const usersList = document.getElementById('blacklistedUsers')
    usersList.innerHTML = ''
    
    this.config.blacklist.users.forEach(user => {
      const li = document.createElement('li')
      li.innerHTML = `
        <span class="blacklist-item-text">${user}</span>
        <button class="remove-item" data-type="user" data-value="${user}">Remove</button>
      `
      
      li.querySelector('.remove-item').addEventListener('click', (e) => {
        this.removeFromBlacklist(e.target.dataset.type, e.target.dataset.value)
      })
      
      usersList.appendChild(li)
    })

    // Load keywords
    const keywordsList = document.getElementById('blacklistedKeywords')
    keywordsList.innerHTML = ''
    
    this.config.blacklist.keywords.forEach(keyword => {
      const li = document.createElement('li')
      li.innerHTML = `
        <span class="blacklist-item-text">${keyword}</span>
        <button class="remove-item" data-type="keyword" data-value="${keyword}">Remove</button>
      `
      
      li.querySelector('.remove-item').addEventListener('click', (e) => {
        this.removeFromBlacklist(e.target.dataset.type, e.target.dataset.value)
      })
      
      keywordsList.appendChild(li)
    })
  }

  loadStatisticsData() {
    if (!this.config || !this.config.statistics) return

    const statsGrid = document.getElementById('detailedStats')
    const stats = this.config.statistics
    
    const statsData = [
      { label: 'Blocked Comments', value: stats.blockedComments || 0 },
      { label: 'Blocked Users', value: stats.blockedUsers || 0 },
      { label: 'False Positives', value: stats.falsePositives || 0 },
      { label: 'Detection Accuracy', value: this.calculateAccuracy() },
      { label: 'Days Active', value: Math.floor((Date.now() - (stats.lastReset || Date.now())) / (1000 * 60 * 60 * 24)) },
      { label: 'Avg. Blocks/Day', value: this.calculateDailyAverage() }
    ]
    
    statsGrid.innerHTML = statsData.map(stat => `
      <div class="stat-item">
        <span class="stat-value">${stat.value}</span>
        <span class="stat-label">${stat.label}</span>
      </div>
    `).join('')
  }

  calculateAccuracy() {
    if (!this.config || !this.config.statistics) return 'N/A'
    
    const blocked = this.config.statistics.blockedComments || 0
    const falsePositives = this.config.statistics.falsePositives || 0
    const total = blocked + falsePositives
    
    return total > 0 ? `${Math.round((blocked / total) * 100)}%` : 'N/A'
  }

  calculateDailyAverage() {
    if (!this.config || !this.config.statistics) return 0
    
    const blocked = this.config.statistics.blockedComments || 0
    const daysSinceReset = Math.max(1, Math.floor((Date.now() - (this.config.statistics.lastReset || Date.now())) / (1000 * 60 * 60 * 24)))
    
    return Math.round(blocked / daysSinceReset)
  }

  async addToBlacklist(type) {
    const inputId = type === 'user' ? 'newUserInput' : 'newKeywordInput'
    const input = document.getElementById(inputId)
    const value = input.value.trim()
    
    if (!value) return

    try {
      await this.sendMessage({
        type: 'ADD_TO_BLACKLIST',
        data: {
          type: type,
          [type === 'user' ? 'userId' : 'keyword']: value
        }
      })
      
      // Reload configuration
      await this.loadData()
      this.setupUI()
      this.updateDisplay()
      this.loadBlacklistData()
      
      // Clear input
      input.value = ''
      
    } catch (error) {
      console.error(`Failed to add ${type} to blacklist:`, error)
      this.showError(`Failed to add ${type} to blacklist`)
    }
  }

  async removeFromBlacklist(type, value) {
    try {
      await this.sendMessage({
        type: 'REMOVE_FROM_BLACKLIST',
        data: {
          type: type,
          [type === 'user' ? 'userId' : 'keyword']: value
        }
      })
      
      // Reload configuration
      await this.loadData()
      this.setupUI()
      this.updateDisplay()
      this.loadBlacklistData()
      
    } catch (error) {
      console.error(`Failed to remove ${type} from blacklist:`, error)
      this.showError(`Failed to remove ${type} from blacklist`)
    }
  }

  async resetStatistics() {
    if (!confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
      return
    }

    try {
      const resetStats = {
        blockedComments: 0,
        blockedUsers: 0,
        falsePositives: 0,
        lastReset: Date.now()
      }
      
      await this.updateConfig({ statistics: resetStats })
      this.updateDisplay()
      
    } catch (error) {
      console.error('Failed to reset statistics:', error)
      this.showError('Failed to reset statistics')
    }
  }

  exportSettings() {
    try {
      const exportData = {
        config: this.config,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fb-spam-blocker-settings-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Failed to export settings:', error)
      this.showError('Failed to export settings')
    }
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay')
    if (show) {
      overlay.classList.add('show')
    } else {
      overlay.classList.remove('show')
    }
  }

  showError(message) {
    // Simple error display - in production you might want a proper notification system
    alert(message)
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager()
})