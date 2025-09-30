/**
 * Investment Scam Detector
 * Specialized detector for investment advisor and financial scam promotions
 */

import { Logger } from '../utils/logger.js'

export class InvestmentScamDetector {
  constructor(enabled = true) {
    this.enabled = enabled
    this.logger = new Logger('InvestmentScamDetector')
    
    // Pattern definitions for investment scams
    this.patterns = {
      // Chinese investment scam keywords
      investmentKeywords: [
        '股海策略師', '投資老師', '理財師', '股票老師', '操盤手',
        '投資顧問', '財經專家', '股市大師', '投資達人', '理財專家',
        '波段小仙女', '短線老司機', '當沖解盤手', '波段風向標', '麋路衝短線',
        '波段', '短線', '當沖', '解盤手', '風向標'
      ],
      
      // Profit-related terms
      profitKeywords: [
        '獲利', '賺錢', '收益', '報酬', '回報', '利潤', '盈利',
        '翻倍', '暴漲', '漲停', '漲幅', '收穫', '賺到',
        '轉了點', '賺', '報牌', '自己看不懂老是虧'
      ],
      
      // Testimonial patterns
      testimonialPatterns: [
        /真的建議去看看.*跟他學習/i,
        /跟.*學習.*感謝/i,
        /老師.*真的.*感謝/i,
        /學習.*一段時間.*感謝/i,
        /非常感謝.*老師/i,
        /推薦.*老師.*不錯/i,
        /跟著.*無腦上車/i,
        /跟著.*學.*投資/i,
        /真的推爆.*/i,
        /大家一定要關注.*/i,
        /推薦.*準確率/i,
        /.*的操作.*接地氣/i,
        /散戶也能跟.*賺/i
      ],
      
      // Urgency and emotional triggers
      urgencyKeywords: [
        '把握機會', '不要錯過', '限時', '趕快', '馬上', '立即',
        '錯過可惜', '機不可失', '難得機會', '千載難逢'
      ],
      
      // Financial promises
      promisePatterns: [
        /保證.*獲利/i,
        /穩賺不賠/i,
        /零風險/i,
        /一定賺/i,
        /包賺/i,
        /躺著賺/i,
        /輕鬆賺/i
      ],
      
      // Social proof and encouragement patterns
      socialProofPatterns: [
        '比自己亂衝好多了',
        '驚訝不已',
        '還真轉了點',
        '推爆',
        '超接地氣',
        '準確率',
        '無腦上車',
        '關注.*分享',
        '散戶也能跟'
      ]
    }
    
    // Scoring weights for different pattern types
    this.weights = {
      investmentKeywords: 0.6,
      profitKeywords: 0.4,
      testimonialPatterns: 0.8,
      urgencyKeywords: 0.3,
      promisePatterns: 0.6,
      socialProofPatterns: 0.7
    }
  }

  /**
   * Detect investment scam patterns in comment
   * @param {Object} comment - Comment object
   * @returns {Object} Detection result
   */
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
          type: 'investment_scam',
          category,
          pattern: match,
          weight: this.weights[category] || 0.1
        })))
        
        totalScore += categoryResult.score * (this.weights[category] || 0.1)
      }
      
      maxScore += this.weights[category] || 0.1
    }

    // Check for user tagging with investment content
    const taggedUsersScore = this.checkTaggedUsers(comment, text)
    if (taggedUsersScore > 0) {
      detectedPatterns.push({
        type: 'investment_scam',
        category: 'tagged_users',
        pattern: 'investment_content_with_tags',
        weight: 0.3
      })
      totalScore += taggedUsersScore * 0.3
      maxScore += 0.3
    }

    // Calculate confidence (normalized score)
    const confidence = maxScore > 0 ? Math.min(totalScore, 1.0) : 0

    this.logger.debug('Investment scam detection result:', {
      confidence,
      patternsFound: detectedPatterns.length,
      categories: detectedPatterns.map(p => p.category)
    })

    return {
      isSpam: confidence > 0.7,
      confidence,
      patterns: detectedPatterns,
      type: 'investment'
    }
  }

  /**
   * Check a specific pattern category
   */
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

  /**
   * Check for tagged users in investment-related content
   */
  checkTaggedUsers(comment, text) {
    // Check if comment has tagged users
    const taggedUsers = comment.taggedUsers || []
    if (taggedUsers.length === 0) return 0

    // Check if the text contains investment-related content
    const hasInvestmentContent = this.patterns.investmentKeywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    ) || this.patterns.profitKeywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    )

    if (hasInvestmentContent && taggedUsers.length > 0) {
      // More tagged users = higher suspicious score
      return Math.min(taggedUsers.length / 5, 1.0)
    }

    return 0
  }

  /**
   * Update detector configuration
   */
  updateConfig(enabled) {
    this.enabled = enabled !== false
  }

  /**
   * Add new pattern to detector
   */
  addPattern(category, pattern) {
    if (this.patterns[category]) {
      if (Array.isArray(this.patterns[category])) {
        this.patterns[category].push(pattern)
      }
      this.logger.info(`Added pattern "${pattern}" to category "${category}"`)
    } else {
      this.logger.warn(`Unknown pattern category: ${category}`)
    }
  }

  /**
   * Remove pattern from detector
   */
  removePattern(category, pattern) {
    if (this.patterns[category] && Array.isArray(this.patterns[category])) {
      const index = this.patterns[category].indexOf(pattern)
      if (index > -1) {
        this.patterns[category].splice(index, 1)
        this.logger.info(`Removed pattern "${pattern}" from category "${category}"`)
      }
    }
  }

  /**
   * Get current patterns
   */
  getPatterns() {
    return { ...this.patterns }
  }
}