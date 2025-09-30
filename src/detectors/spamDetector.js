/**
 * Main spam detection engine
 * Coordinates different detection strategies and maintains pattern database
 */

import { InvestmentScamDetector } from './investmentScamDetector.js'
import { CryptoScamDetector } from './cryptoScamDetector.js'
import { GenericSpamDetector } from './genericSpamDetector.js'
import { SocialEngineeringDetector } from './socialEngineeringDetector.js'
import { Logger } from '../utils/logger.js'

export class SpamDetector {
  constructor(config = {}) {
    this.config = config
    this.logger = new Logger('SpamDetector')

    // Initialize individual detectors
    this.detectors = {
      investment: new InvestmentScamDetector(config.detectionPatterns?.investmentScams),
      crypto: new CryptoScamDetector(config.detectionPatterns?.cryptoScams),
      generic: new GenericSpamDetector(config.detectionPatterns?.genericSpam),
      socialEngineering: new SocialEngineeringDetector(config.detectionPatterns?.socialEngineering)
    }

    this.blacklist = config.blacklist || { users: [], keywords: [] }
    this.whitelist = config.whitelist || { users: [], domains: [] }
    this.aggressiveMode = config.settings?.aggressiveMode || false
  }

  /**
   * Analyze a comment for spam patterns
   * @param {Object} comment - Comment object with text, author, etc.
   * @returns {Object} Detection result
   */
  async analyzeComment(comment) {
    try {
      const startTime = performance.now()

      // Quick whitelist check
      if (this.isWhitelisted(comment)) {
        return {
          isSpam: false,
          confidence: 0,
          reason: 'whitelisted',
          patterns: [],
          processingTime: performance.now() - startTime
        }
      }

      // Quick blacklist check
      const blacklistResult = this.checkBlacklist(comment)
      if (blacklistResult.isSpam) {
        return {
          ...blacklistResult,
          processingTime: performance.now() - startTime
        }
      }

      // Run detection algorithms
      const detectionResults = await Promise.all([
        this.runDetector('investment', comment),
        this.runDetector('crypto', comment),
        this.runDetector('generic', comment),
        this.runDetector('socialEngineering', comment)
      ])

      // Combine results
      const combinedResult = this.combineResults(detectionResults, comment)
      combinedResult.processingTime = performance.now() - startTime

      this.logger.debug('Comment analysis completed:', {
        isSpam: combinedResult.isSpam,
        confidence: combinedResult.confidence,
        patterns: combinedResult.patterns,
        processingTime: combinedResult.processingTime
      })

      return combinedResult
    } catch (error) {
      this.logger.error('Error analyzing comment:', error)
      return {
        isSpam: false,
        confidence: 0,
        reason: 'analysis_error',
        error: error.message,
        patterns: []
      }
    }
  }

  /**
   * Check if comment author or content is whitelisted
   */
  isWhitelisted(comment) {
    if (!comment.author) return false

    // Check user whitelist
    if (this.whitelist.users.includes(comment.author.id) ||
        this.whitelist.users.includes(comment.author.username)) {
      return true
    }

    // Check domain whitelist for links
    if (comment.links && comment.links.length > 0) {
      return comment.links.some(link => {
        try {
          const url = new URL(link)
          return this.whitelist.domains.includes(url.hostname)
        } catch {
          return false
        }
      })
    }

    return false
  }

  /**
   * Check if comment matches blacklist criteria
   */
  checkBlacklist(comment) {
    // Check user blacklist
    if (comment.author &&
        (this.blacklist.users.includes(comment.author.id) ||
         this.blacklist.users.includes(comment.author.username))) {
      return {
        isSpam: true,
        confidence: 1.0,
        reason: 'blacklisted_user',
        patterns: ['blacklisted_user']
      }
    }

    // Check keyword blacklist
    const text = comment.text.toLowerCase()
    const matchedKeywords = this.blacklist.keywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    )

    if (matchedKeywords.length > 0) {
      return {
        isSpam: true,
        confidence: 0.9,
        reason: 'blacklisted_keywords',
        patterns: matchedKeywords.map(k => `blacklisted_keyword:${k}`)
      }
    }

    return { isSpam: false }
  }

  /**
   * Run a specific detector
   */
  async runDetector(type, comment) {
    try {
      if (!this.detectors[type]) {
        return { isSpam: false, confidence: 0, patterns: [] }
      }

      // Map detector types to config keys
      const configMap = {
        investment: 'investmentScams',
        crypto: 'cryptoScams',
        generic: 'genericSpam',
        socialEngineering: 'socialEngineering'
      }

      const configKey = configMap[type]
      if (!this.config.detectionPatterns?.[configKey]) {
        return { isSpam: false, confidence: 0, patterns: [] }
      }

      return await this.detectors[type].detect(comment)
    } catch (error) {
      this.logger.error(`Error running ${type} detector:`, error)
      return { isSpam: false, confidence: 0, patterns: [] }
    }
  }

  /**
   * Combine results from multiple detectors
   */
  combineResults(results, _comment) {
    const validResults = results.filter(r => r.confidence > 0)

    if (validResults.length === 0) {
      return {
        isSpam: false,
        confidence: 0,
        reason: 'no_patterns_detected',
        patterns: []
      }
    }

    // Calculate weighted confidence
    let totalWeight = 0
    let weightedConfidence = 0
    const allPatterns = []

    validResults.forEach(result => {
      const weight = this.getDetectorWeight(result.type)
      totalWeight += weight
      weightedConfidence += result.confidence * weight
      allPatterns.push(...result.patterns)
    })

    const finalConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0

    // Determine spam threshold
    const threshold = this.aggressiveMode ? 0.6 : 0.8
    const isSpam = finalConfidence >= threshold

    return {
      isSpam,
      confidence: finalConfidence,
      reason: isSpam ? 'pattern_detection' : 'below_threshold',
      patterns: allPatterns,
      detectorResults: validResults
    }
  }

  /**
   * Get weight for each detector type
   */
  getDetectorWeight(type) {
    const weights = {
      investment: 1.2, // Investment scams are high priority
      crypto: 1.1, // Crypto scams are also high priority
      socialEngineering: 1.0,
      generic: 0.8 // Generic spam detection is less specific
    }
    return weights[type] || 1.0
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.blacklist = newConfig.blacklist || this.blacklist
    this.whitelist = newConfig.whitelist || this.whitelist
    this.aggressiveMode = newConfig.settings?.aggressiveMode || this.aggressiveMode

    // Update individual detectors
    Object.keys(this.detectors).forEach(key => {
      if (this.detectors[key].updateConfig) {
        this.detectors[key].updateConfig(newConfig.detectionPatterns?.[key])
      }
    })
  }

  /**
   * Get detection statistics
   */
  getStatistics() {
    return {
      detectorsLoaded: Object.keys(this.detectors).length,
      blacklistSize: {
        users: this.blacklist.users.length,
        keywords: this.blacklist.keywords.length
      },
      whitelistSize: {
        users: this.whitelist.users.length,
        domains: this.whitelist.domains.length
      },
      aggressiveMode: this.aggressiveMode
    }
  }
}
