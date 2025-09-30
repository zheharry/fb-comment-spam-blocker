/**
 * Cryptocurrency Scam Detector
 * Specialized detector for crypto investment scams and fraudulent crypto promotions
 */

import { Logger } from '../utils/logger.js'

export class CryptoScamDetector {
  constructor(enabled = true) {
    this.enabled = enabled
    this.logger = new Logger('CryptoScamDetector')
    
    this.patterns = {
      // Cryptocurrency terms
      cryptoKeywords: [
        '比特幣', '以太幣', '以太坊', '萊特幣', '瑞波幣',
        'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'Litecoin', 'LTC',
        'Ripple', 'XRP', 'Dogecoin', 'DOGE', 'Cardano', 'ADA',
        '加密貨幣', '虛擬貨幣', '數位貨幣', '區塊鏈', '挖礦'
      ],
      
      // Scam-related crypto promises
      scamPromises: [
        /快速致富.*加密/i,
        /躺著賺.*比特幣/i,
        /一夜暴富.*虛擬貨幣/i,
        /保證獲利.*crypto/i,
        /穩賺.*區塊鏈/i,
        /零風險.*挖礦/i
      ],
      
      // Common crypto scam phrases
      scamPhrases: [
        '內幕消息', '獨家資訊', '幣圈大佬', '合約交易',
        '槓桿交易', '量化交易', 'DeFi挖礦', 'NFT暴漲',
        '空投福利', '白名單', '私募額度', '早期投資'
      ],
      
      // Fake platform names (common in Chinese crypto scams)
      suspiciousPlatforms: [
        /.*交易所.*保證/i,
        /.*平台.*穩賺/i,
        /.*APP.*獲利/i,
        /.*系統.*自動/i
      ]
    }
    
    this.weights = {
      cryptoKeywords: 0.5,
      scamPromises: 0.8,
      scamPhrases: 0.6,
      suspiciousPlatforms: 0.7
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

    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.patterns)) {
      const categoryResult = this.checkPatternCategory(text, category, patterns)
      
      if (categoryResult.matches.length > 0) {
        detectedPatterns.push(...categoryResult.matches.map(match => ({
          type: 'crypto_scam',
          category,
          pattern: match,
          weight: this.weights[category] || 0.1
        })))
        
        totalScore += categoryResult.score * (this.weights[category] || 0.1)
      }
      
      maxScore += this.weights[category] || 0.1
    }

    // Check for suspicious links
    const linkScore = this.checkSuspiciousLinks(comment)
    if (linkScore > 0) {
      detectedPatterns.push({
        type: 'crypto_scam',
        category: 'suspicious_links',
        pattern: 'crypto_related_suspicious_links',
        weight: 0.4
      })
      totalScore += linkScore * 0.4
      maxScore += 0.4
    }

    const confidence = maxScore > 0 ? Math.min(totalScore, 1.0) : 0

    return {
      isSpam: confidence > 0.6,
      confidence,
      patterns: detectedPatterns,
      type: 'crypto'
    }
  }

  checkPatternCategory(text, category, patterns) {
    const matches = []
    let score = 0

    if (Array.isArray(patterns)) {
      patterns.forEach(pattern => {
        if (typeof pattern === 'string') {
          if (text.toLowerCase().includes(pattern.toLowerCase())) {
            matches.push(pattern)
            score += 1
          }
        } else if (pattern instanceof RegExp) {
          const match = text.match(pattern)
          if (match) {
            matches.push(match[0])
            score += 1
          }
        }
      })
      // Don't normalize by total patterns - instead use a logarithmic scaling
      // to give higher scores for multiple matches while preventing runaway scores
      if (score > 0) {
        score = Math.min(Math.log(score + 1) / Math.log(patterns.length + 1), 1.0)
      }
    }

    return { matches, score }
  }

  checkSuspiciousLinks(comment) {
    const links = comment.links || []
    if (links.length === 0) return 0

    let suspiciousCount = 0
    const text = comment.text || ''
    
    // Check if text contains crypto keywords and there are links
    const hasCryptoContent = this.patterns.cryptoKeywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    )

    if (hasCryptoContent) {
      links.forEach(link => {
        // Check for suspicious domains
        if (this.isSuspiciousCryptoDomain(link)) {
          suspiciousCount++
        }
      })
    }

    return suspiciousCount > 0 ? Math.min(suspiciousCount / links.length, 1.0) : 0
  }

  isSuspiciousCryptoDomain(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase()
      
      // Common patterns in scam crypto domains
      const suspiciousPatterns = [
        /.*-crypto.*\.com$/,
        /.*bitcoin.*\.top$/,
        /.*eth.*\.cc$/,
        /.*trade.*\.xyz$/,
        /.*invest.*\.info$/
      ]
      
      return suspiciousPatterns.some(pattern => pattern.test(domain))
    } catch {
      return false
    }
  }

  updateConfig(enabled) {
    this.enabled = enabled !== false
  }

  addPattern(category, pattern) {
    if (this.patterns[category]) {
      this.patterns[category].push(pattern)
      this.logger.info(`Added crypto pattern "${pattern}" to category "${category}"`)
    }
  }

  removePattern(category, pattern) {
    if (this.patterns[category] && Array.isArray(this.patterns[category])) {
      const index = this.patterns[category].indexOf(pattern)
      if (index > -1) {
        this.patterns[category].splice(index, 1)
        this.logger.info(`Removed crypto pattern "${pattern}" from category "${category}"`)
      }
    }
  }

  getPatterns() {
    return { ...this.patterns }
  }
}