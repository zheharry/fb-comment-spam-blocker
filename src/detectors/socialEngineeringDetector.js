/**
 * Social Engineering Detector
 * Detects social engineering tactics used to spread spam through user tagging
 */

import { Logger } from '../utils/logger.js'

export class SocialEngineeringDetector {
  constructor(enabled = true) {
    this.enabled = enabled
    this.logger = new Logger('SocialEngineeringDetector')
    
    this.patterns = {
      // Patterns indicating user manipulation
      manipulationPhrases: [
        '快告訴朋友', '分享給朋友', '讓朋友知道', '推薦給朋友',
        '告訴身邊的人', '分享出去', '讓更多人知道',
        '一起來看', '大家一起', '邀請朋友'
      ],
      
      // Fake urgency to create FOMO
      urgencyTactics: [
        '名額有限', '僅限今天', '錯過就沒了', '最後機會',
        '限時限量', '售完為止', '今日特價', '限今日'
      ],
      
      // Authority claims
      authorityClaims: [
        /.*專家.*推薦/i,
        /.*老師.*建議/i,
        /.*大師.*說/i,
        /.*權威.*認證/i,
        /.*官方.*推薦/i
      ],
      
      // Social proof manipulation
      socialProofPhrases: [
        '很多人都在', '大家都說', '朋友都推薦', '網友分享',
        '熱門推薦', '爆紅', '瘋傳', '討論度很高'
      ]
    }
    
    this.weights = {
      manipulationPhrases: 0.4,
      urgencyTactics: 0.3,
      authorityClaims: 0.5,
      socialProofPhrases: 0.3
    }
  }

  async detect(comment) {
    if (!this.enabled) {
      return { isSpam: false, confidence: 0, patterns: [] }
    }

    const text = comment.text || ''
    const taggedUsers = comment.taggedUsers || []
    const detectedPatterns = []
    let totalScore = 0
    let maxScore = 0

    // Check for excessive user tagging
    const taggingScore = this.checkExcessiveTagging(taggedUsers, text)
    if (taggingScore > 0) {
      detectedPatterns.push({
        type: 'social_engineering',
        category: 'excessive_tagging',
        pattern: `${taggedUsers.length} users tagged`,
        weight: 0.6
      })
      totalScore += taggingScore * 0.6
      maxScore += 0.6
    }

    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.patterns)) {
      const categoryResult = this.checkPatternCategory(text, category, patterns)
      
      if (categoryResult.matches.length > 0) {
        detectedPatterns.push(...categoryResult.matches.map(match => ({
          type: 'social_engineering',
          category,
          pattern: match,
          weight: this.weights[category] || 0.1
        })))
        
        totalScore += categoryResult.score * (this.weights[category] || 0.1)
      }
      
      maxScore += this.weights[category] || 0.1
    }

    // Check for coordinated behavior patterns
    const coordinatedScore = this.checkCoordinatedBehavior(comment)
    if (coordinatedScore > 0) {
      detectedPatterns.push({
        type: 'social_engineering',
        category: 'coordinated_behavior',
        pattern: 'suspicious posting pattern',
        weight: 0.4
      })
      totalScore += coordinatedScore * 0.4
      maxScore += 0.4
    }

    // Bonus score if tagging is combined with other manipulation tactics
    if (taggedUsers.length > 0 && detectedPatterns.some(p => p.category !== 'excessive_tagging')) {
      totalScore += 0.2
      maxScore += 0.2
    }

    const confidence = maxScore > 0 ? Math.min(totalScore / maxScore, 1.0) : 0

    return {
      isSpam: confidence > 0.6,
      confidence,
      patterns: detectedPatterns,
      type: 'socialEngineering'
    }
  }

  checkExcessiveTagging(taggedUsers, text) {
    if (taggedUsers.length === 0) return 0

    const textLength = text.length
    const tagCount = taggedUsers.length

    // More tags than reasonable for content length
    if (tagCount > 5) {
      return 1.0 // Definitely suspicious
    } else if (tagCount > 3 && textLength < 100) {
      return 0.8 // Very suspicious for short content
    } else if (tagCount > 2 && textLength < 50) {
      return 0.6 // Suspicious for very short content
    } else if (tagCount > textLength / 20) {
      return 0.4 // High tag to content ratio
    }

    return 0
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
      score = Math.min(score / patterns.length, 1.0)
    }

    return { matches, score }
  }

  checkCoordinatedBehavior(comment) {
    // Check for signs of coordinated inauthentic behavior
    // This would require additional data about posting patterns,
    // account age, etc. For now, we'll use basic heuristics
    
    const text = comment.text || ''
    const author = comment.author || {}
    
    let suspiciousFactors = 0

    // Very new account posting promotional content
    if (author.accountAge && author.accountAge < 30) { // Less than 30 days
      suspiciousFactors += 1
    }

    // Generic profile (common in bot accounts)
    if (author.name && /^[A-Za-z]+ [A-Za-z]+$/.test(author.name)) {
      suspiciousFactors += 1
    }

    // Comment is mostly tags with minimal content
    const taggedUsers = comment.taggedUsers || []
    if (taggedUsers.length > 0 && text.replace(/@\w+/g, '').trim().length < 20) {
      suspiciousFactors += 1
    }

    // Normalize suspicion score
    return Math.min(suspiciousFactors / 3, 1.0)
  }

  updateConfig(enabled) {
    this.enabled = enabled !== false
  }

  addPattern(category, pattern) {
    if (this.patterns[category] && Array.isArray(this.patterns[category])) {
      this.patterns[category].push(pattern)
      this.logger.info(`Added social engineering pattern "${pattern}" to category "${category}"`)
    }
  }

  removePattern(category, pattern) {
    if (this.patterns[category] && Array.isArray(this.patterns[category])) {
      const index = this.patterns[category].indexOf(pattern)
      if (index > -1) {
        this.patterns[category].splice(index, 1)
        this.logger.info(`Removed social engineering pattern "${pattern}" from category "${category}"`)
      }
    }
  }

  getPatterns() {
    return { ...this.patterns }
  }
}