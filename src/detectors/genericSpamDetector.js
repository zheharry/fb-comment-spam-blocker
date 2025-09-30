/**
 * Generic Spam Detector
 * Detects common spam patterns not specific to investment or crypto scams
 */

import { Logger } from '../utils/logger.js'

export class GenericSpamDetector {
  constructor(enabled = true) {
    this.enabled = enabled
    this.logger = new Logger('GenericSpamDetector')
    
    this.patterns = {
      // Excessive emoji usage
      excessiveEmojis: /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]{5,}/gu,
      
      // Repetitive characters
      repetitiveChars: /(.)\1{4,}/g,
      
      // Excessive capitalization
      excessiveCaps: /[A-Z]{5,}/g,
      
      // Link spam patterns
      linkPatterns: [
        /bit\.ly\/\w+/gi,
        /tinyurl\.com\/\w+/gi,
        /短網址/gi
      ],
      
      // Generic spam keywords
      spamKeywords: [
        '點擊連結', '限時優惠', '免費贈送', '立即領取',
        '私訊我', '加我好友', '詳情私聊', '有興趣私',
        '廣告', '推廣', '宣傳', '代理', '招商',
        '賺外快', '兼職', '在家工作', '網路賺錢'
      ],
      
      // Promotional phrases
      promotionalPhrases: [
        /加入.*群組/i,
        /掃描.*QR/i,
        /關注.*獲得/i,
        /分享.*朋友/i,
        /轉發.*有獎/i
      ]
    }
    
    this.weights = {
      excessiveEmojis: 0.3,
      repetitiveChars: 0.2,
      excessiveCaps: 0.2,
      linkPatterns: 0.4,
      spamKeywords: 0.5,
      promotionalPhrases: 0.4
    }
  }

  async detect(comment) {
    if (!this.enabled) {
      return { isSpam: false, confidence: 0, patterns: [] }
    }

    const text = comment.text || ''
    const detectedPatterns = []
    let totalScore = 0
    let maxScore = 0

    // Check emoji excess
    const emojiMatches = text.match(this.patterns.excessiveEmojis)
    if (emojiMatches && emojiMatches.length > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'excessive_emojis',
        pattern: `${emojiMatches.length} emoji sequences`,
        weight: this.weights.excessiveEmojis
      })
      totalScore += Math.min(emojiMatches.length / 3, 1.0) * this.weights.excessiveEmojis
    }
    maxScore += this.weights.excessiveEmojis

    // Check repetitive characters
    const repetitiveMatches = text.match(this.patterns.repetitiveChars)
    if (repetitiveMatches && repetitiveMatches.length > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'repetitive_chars',
        pattern: `${repetitiveMatches.length} repetitive sequences`,
        weight: this.weights.repetitiveChars
      })
      totalScore += Math.min(repetitiveMatches.length / 2, 1.0) * this.weights.repetitiveChars
    }
    maxScore += this.weights.repetitiveChars

    // Check excessive caps
    const capsMatches = text.match(this.patterns.excessiveCaps)
    if (capsMatches && capsMatches.length > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'excessive_caps',
        pattern: `${capsMatches.length} caps sequences`,
        weight: this.weights.excessiveCaps
      })
      totalScore += Math.min(capsMatches.length / 2, 1.0) * this.weights.excessiveCaps
    }
    maxScore += this.weights.excessiveCaps

    // Check link patterns
    let linkScore = 0
    this.patterns.linkPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        linkScore += matches.length
      }
    })
    if (linkScore > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'suspicious_links',
        pattern: `${linkScore} suspicious links`,
        weight: this.weights.linkPatterns
      })
      totalScore += Math.min(linkScore / 2, 1.0) * this.weights.linkPatterns
    }
    maxScore += this.weights.linkPatterns

    // Check spam keywords
    const keywordMatches = this.patterns.spamKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    )
    if (keywordMatches.length > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'spam_keywords',
        pattern: keywordMatches.join(', '),
        weight: this.weights.spamKeywords
      })
      totalScore += Math.min(keywordMatches.length / 3, 1.0) * this.weights.spamKeywords
    }
    maxScore += this.weights.spamKeywords

    // Check promotional phrases
    let promoScore = 0
    this.patterns.promotionalPhrases.forEach(pattern => {
      if (text.match(pattern)) {
        promoScore += 1
      }
    })
    if (promoScore > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'promotional_phrases',
        pattern: `${promoScore} promotional phrases`,
        weight: this.weights.promotionalPhrases
      })
      totalScore += Math.min(promoScore / 2, 1.0) * this.weights.promotionalPhrases
    }
    maxScore += this.weights.promotionalPhrases

    // Check comment length and link ratio
    const lengthScore = this.checkLengthAndLinks(comment)
    if (lengthScore > 0) {
      detectedPatterns.push({
        type: 'generic_spam',
        category: 'length_link_ratio',
        pattern: 'suspicious length to link ratio',
        weight: 0.3
      })
      totalScore += lengthScore * 0.3
      maxScore += 0.3
    }

    const confidence = maxScore > 0 ? Math.min(totalScore / maxScore, 1.0) : 0

    return {
      isSpam: confidence > 0.5,
      confidence,
      patterns: detectedPatterns,
      type: 'generic'
    }
  }

  checkLengthAndLinks(comment) {
    const text = comment.text || ''
    const links = comment.links || []
    
    if (links.length === 0) return 0

    // Short text with many links is suspicious
    const textLength = text.length
    const linkCount = links.length

    if (textLength < 50 && linkCount > 1) {
      return 0.8
    } else if (textLength < 100 && linkCount > 2) {
      return 0.6
    } else if (linkCount > textLength / 20) {
      return 0.4
    }

    return 0
  }

  updateConfig(enabled) {
    this.enabled = enabled !== false
  }

  addPattern(category, pattern) {
    if (category === 'spamKeywords' && Array.isArray(this.patterns.spamKeywords)) {
      this.patterns.spamKeywords.push(pattern)
      this.logger.info(`Added generic spam pattern "${pattern}"`)
    }
  }

  removePattern(category, pattern) {
    if (category === 'spamKeywords' && Array.isArray(this.patterns.spamKeywords)) {
      const index = this.patterns.spamKeywords.indexOf(pattern)
      if (index > -1) {
        this.patterns.spamKeywords.splice(index, 1)
        this.logger.info(`Removed generic spam pattern "${pattern}"`)
      }
    }
  }

  getPatterns() {
    return { ...this.patterns }
  }
}