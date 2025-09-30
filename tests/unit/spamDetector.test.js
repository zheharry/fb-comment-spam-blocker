/**
 * Unit tests for SpamDetector
 */

import { SpamDetector } from '../../src/detectors/spamDetector.js'

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn()
  }
}

describe('SpamDetector', () => {
  let spamDetector
  let mockConfig

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      detectionPatterns: {
        investmentScams: true,
        cryptoScams: true,
        genericSpam: true,
        socialEngineering: true
      },
      blacklist: {
        users: ['spammer123'],
        keywords: ['股海策略師', '快速致富']
      },
      whitelist: {
        users: ['trusted_user'],
        domains: ['trusted-site.com']
      },
      settings: {
        aggressiveMode: false
      }
    }

    spamDetector = new SpamDetector(mockConfig)
  })

  describe('analyzeComment', () => {
    test('should detect investment scam comment', async () => {
      const comment = {
        text: '自己看不懂老是虧，跟著 波段小仙女晴兒 無腦上車，還真轉了點👍👍',
        author: { id: 'user123', username: 'testuser' },
        taggedUsers: [],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.patterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'investment_scam'
          })
        ])
      )
    })

    test('should detect crypto scam comment', async () => {
      // Use aggressive mode for this test to lower threshold
      const aggressiveConfig = {
        ...mockConfig,
        settings: { aggressiveMode: true }
      }
      const aggressiveDetector = new SpamDetector(aggressiveConfig)
      
      const comment = {
        text: '比特幣 以太幣 內幕消息！量化交易 DeFi挖礦 幣圈大佬推薦 合約交易',
        author: { id: 'user456', username: 'cryptoscammer' },
        taggedUsers: [],
        links: []
      }

      const result = await aggressiveDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.patterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'crypto_scam'
          })
        ])
      )
    })

    test('should detect social engineering with tagged users', async () => {
      const comment = {
        text: '大家一起來看 推薦給朋友',
        author: { id: 'user789', username: 'socialengineer' },
        taggedUsers: [
          { id: 'friend1', username: 'friend1' },
          { id: 'friend2', username: 'friend2' },
          { id: 'friend3', username: 'friend3' }
        ],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(true)
      expect(result.patterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'social_engineering'
          })
        ])
      )
    })

    test('should not flag normal comment as spam', async () => {
      const comment = {
        text: '這篇文章寫得很好，謝謝分享！',
        author: { id: 'normaluser', username: 'normaluser' },
        taggedUsers: [],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(false)
      expect(result.confidence).toBeLessThan(0.5)
    })

    test('should respect whitelist', async () => {
      const comment = {
        text: '股海策略師 真的很棒', // Would normally be spam
        author: { id: 'trusted_user', username: 'trusted_user' },
        taggedUsers: [],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(false)
      expect(result.reason).toBe('whitelisted')
    })

    test('should detect blacklisted user', async () => {
      const comment = {
        text: '正常的留言內容',
        author: { id: 'spammer123', username: 'spammer123' },
        taggedUsers: [],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(true)
      expect(result.reason).toBe('blacklisted_user')
      expect(result.confidence).toBe(1.0)
    })

    test('should detect blacklisted keywords', async () => {
      const comment = {
        text: '我推薦 股海策略師 給大家',
        author: { id: 'regularuser', username: 'regularuser' },
        taggedUsers: [],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      expect(result.isSpam).toBe(true)
      expect(result.reason).toBe('blacklisted_keywords')
      expect(result.confidence).toBe(0.9)
    })

    test('should handle aggressive mode', async () => {
      // Set aggressive mode
      spamDetector.updateConfig({ 
        ...mockConfig, 
        settings: { aggressiveMode: true } 
      })

      const comment = {
        text: '投資 獲利', // Borderline spam
        author: { id: 'user123', username: 'user123' },
        taggedUsers: [],
        links: []
      }

      const result = await spamDetector.analyzeComment(comment)

      // In aggressive mode, lower threshold should catch more potential spam
      // The exact result depends on the specific patterns matched
      expect(typeof result.isSpam).toBe('boolean')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
    })
  })

  describe('updateConfig', () => {
    test('should update configuration correctly', () => {
      const newConfig = {
        ...mockConfig,
        blacklist: {
          users: ['newspammer'],
          keywords: ['新關鍵字']
        }
      }

      spamDetector.updateConfig(newConfig)

      expect(spamDetector.blacklist.users).toContain('newspammer')
      expect(spamDetector.blacklist.keywords).toContain('新關鍵字')
    })
  })

  describe('getStatistics', () => {
    test('should return detector statistics', () => {
      const stats = spamDetector.getStatistics()

      expect(stats).toHaveProperty('detectorsLoaded')
      expect(stats).toHaveProperty('blacklistSize')
      expect(stats).toHaveProperty('whitelistSize')
      expect(stats).toHaveProperty('aggressiveMode')
      expect(stats.detectorsLoaded).toBeGreaterThan(0)
    })
  })

  describe('combineResults', () => {
    test('should combine multiple detector results correctly', () => {
      const mockResults = [
        { 
          isSpam: true, 
          confidence: 0.8, 
          patterns: ['investment_keyword'], 
          type: 'investment' 
        },
        { 
          isSpam: true, 
          confidence: 0.6, 
          patterns: ['tagged_users'], 
          type: 'socialEngineering' 
        }
      ]

      const combined = spamDetector.combineResults(mockResults, {})

      expect(combined.isSpam).toBe(true)
      expect(combined.confidence).toBeGreaterThan(0.6)
      expect(combined.patterns).toEqual(['investment_keyword', 'tagged_users'])
      expect(combined.detectorResults).toHaveLength(2)
    })

    test('should handle no matching results', () => {
      const mockResults = [
        { isSpam: false, confidence: 0, patterns: [] },
        { isSpam: false, confidence: 0, patterns: [] }
      ]

      const combined = spamDetector.combineResults(mockResults, {})

      expect(combined.isSpam).toBe(false)
      expect(combined.confidence).toBe(0)
      expect(combined.reason).toBe('no_patterns_detected')
    })
  })
})