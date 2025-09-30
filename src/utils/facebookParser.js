/**
 * Facebook Parser utility
 * Handles Facebook DOM parsing and comment extraction
 */

import { Logger } from './logger.js'

export class FacebookParser {
  constructor() {
    this.logger = new Logger('FacebookParser')
    
    // Facebook DOM selectors (these may need updates as Facebook changes)
    this.selectors = {
      // Comment containers
      comments: [
        '[data-testid="comment"]',
        '[role="article"]',
        '.x1y1aw1k.xn6708d', // Facebook's dynamic class names
        '[data-pagelet="CommentList"]',
        '.commentable_item'
      ],
      
      // Comment text
      commentText: [
        '[data-testid="comment"] [data-ad-preview="message"]',
        '.xdj266r.x11i5rnm.xat24cr.x1mh8g0r', // Text content
        '.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xi81zsa', // Another text pattern
        'span[dir="auto"]' // Generic text span
      ],
      
      // Comment author
      commentAuthor: [
        '[data-testid="comment"] a[role="link"]',
        '.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xt0psk2.x1heor9g.x1xlr1w8',
        'h3 a', // Author link in header
        '.actor a' // Legacy selector
      ],
      
      // Tagged users
      taggedUsers: [
        'a[data-hovercard-prefer-more-content-show="1"]',
        'a[role="link"][tabindex="0"]',
        '.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xt0psk2.x1heor9g'
      ],
      
      // Links in comments
      links: [
        'a[href]',
        'a[target="_blank"]'
      ],
      
      // Comment timestamp/ID elements
      timestamp: [
        '[data-testid="comment"] time',
        'abbr[data-utime]',
        '.timestampContent'
      ]
    }
  }

  /**
   * Find all comment elements on the page
   */
  findComments() {
    const comments = []
    
    for (const selector of this.selectors.comments) {
      try {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          // Filter out elements that are already included
          if (!comments.some(existing => existing.contains(el) || el.contains(existing))) {
            comments.push(el)
          }
        })
      } catch (error) {
        this.logger.debug(`Selector failed: ${selector}`, error.message)
      }
    }
    
    this.logger.debug(`Found ${comments.length} comment elements`)
    return comments
  }

  /**
   * Find comment elements within a specific element
   */
  findCommentsInElement(element) {
    const comments = []
    
    for (const selector of this.selectors.comments) {
      try {
        const elements = element.querySelectorAll(selector)
        elements.forEach(el => {
          if (!comments.includes(el)) {
            comments.push(el)
          }
        })
      } catch (error) {
        this.logger.debug(`Selector failed in element: ${selector}`, error.message)
      }
    }
    
    return comments
  }

  /**
   * Get unique identifier for a comment
   */
  getCommentId(commentElement) {
    // Try various methods to get a unique ID
    const methods = [
      () => commentElement.getAttribute('data-testid'),
      () => commentElement.getAttribute('id'),
      () => commentElement.querySelector('[data-utime]')?.getAttribute('data-utime'),
      () => commentElement.querySelector('time')?.getAttribute('datetime'),
      () => this.generateElementHash(commentElement)
    ]
    
    for (const method of methods) {
      try {
        const id = method()
        if (id) return id
      } catch (error) {
        // Continue to next method
      }
    }
    
    return null
  }

  /**
   * Generate a hash-based ID for an element
   */
  generateElementHash(element) {
    const text = element.textContent || ''
    const position = Array.from(element.parentNode.children).indexOf(element)
    const hashString = `${text.substring(0, 50)}_${position}_${element.tagName}`
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `generated_${Math.abs(hash)}`
  }

  /**
   * Parse comment data from DOM element
   */
  parseComment(commentElement) {
    try {
      const commentData = {
        text: this.extractText(commentElement),
        author: this.extractAuthor(commentElement),
        taggedUsers: this.extractTaggedUsers(commentElement),
        links: this.extractLinks(commentElement),
        timestamp: this.extractTimestamp(commentElement),
        element: commentElement
      }
      
      return commentData
    } catch (error) {
      this.logger.error('Error parsing comment:', error)
      return null
    }
  }

  /**
   * Extract text content from comment
   */
  extractText(commentElement) {
    for (const selector of this.selectors.commentText) {
      try {
        const textElement = commentElement.querySelector(selector)
        if (textElement) {
          return textElement.textContent.trim()
        }
      } catch (error) {
        continue
      }
    }
    
    // Fallback: get all text content but filter out navigation elements
    const clone = commentElement.cloneNode(true)
    
    // Remove elements that are not part of the comment text
    const elementsToRemove = [
      'button', 'svg', '.timestampContent', '[role="button"]',
      '[data-testid="more_horiz"]', '.like_link', '.comment_link'
    ]
    
    elementsToRemove.forEach(selector => {
      try {
        clone.querySelectorAll(selector).forEach(el => el.remove())
      } catch (error) {
        // Continue
      }
    })
    
    return clone.textContent.trim()
  }

  /**
   * Extract author information
   */
  extractAuthor(commentElement) {
    for (const selector of this.selectors.commentAuthor) {
      try {
        const authorElement = commentElement.querySelector(selector)
        if (authorElement) {
          return {
            name: authorElement.textContent.trim(),
            username: this.extractUsernameFromUrl(authorElement.href),
            profileUrl: authorElement.href,
            id: this.extractUserIdFromUrl(authorElement.href)
          }
        }
      } catch (error) {
        continue
      }
    }
    
    return null
  }

  /**
   * Extract tagged users from comment
   */
  extractTaggedUsers(commentElement) {
    const taggedUsers = []
    
    for (const selector of this.selectors.taggedUsers) {
      try {
        const userLinks = commentElement.querySelectorAll(selector)
        userLinks.forEach(link => {
          if (link.href && link.href.includes('facebook.com')) {
            const user = {
              name: link.textContent.trim(),
              username: this.extractUsernameFromUrl(link.href),
              profileUrl: link.href,
              id: this.extractUserIdFromUrl(link.href)
            }
            
            // Avoid duplicates
            if (!taggedUsers.some(u => u.id === user.id || u.username === user.username)) {
              taggedUsers.push(user)
            }
          }
        })
      } catch (error) {
        continue
      }
    }
    
    return taggedUsers
  }

  /**
   * Extract links from comment
   */
  extractLinks(commentElement) {
    const links = []
    
    for (const selector of this.selectors.links) {
      try {
        const linkElements = commentElement.querySelectorAll(selector)
        linkElements.forEach(link => {
          if (link.href && !link.href.includes('facebook.com') && !links.includes(link.href)) {
            links.push(link.href)
          }
        })
      } catch (error) {
        continue
      }
    }
    
    return links
  }

  /**
   * Extract timestamp from comment
   */
  extractTimestamp(commentElement) {
    for (const selector of this.selectors.timestamp) {
      try {
        const timeElement = commentElement.querySelector(selector)
        if (timeElement) {
          return timeElement.getAttribute('datetime') || 
                 timeElement.getAttribute('data-utime') ||
                 timeElement.textContent
        }
      } catch (error) {
        continue
      }
    }
    
    return null
  }

  /**
   * Extract username from Facebook profile URL
   */
  extractUsernameFromUrl(url) {
    if (!url) return null
    
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      
      // Handle different Facebook URL formats
      const patterns = [
        /\/([^\/]+)\/?$/,  // facebook.com/username
        /\/profile\.php\?id=(\d+)/, // facebook.com/profile.php?id=123
        /\/people\/[^\/]+\/(\d+)/ // facebook.com/people/name/id
      ]
      
      for (const pattern of patterns) {
        const match = pathname.match(pattern)
        if (match) {
          return match[1]
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Extract user ID from Facebook profile URL
   */
  extractUserIdFromUrl(url) {
    if (!url) return null
    
    try {
      const urlObj = new URL(url)
      
      // Try to get numeric ID from various URL formats
      const idMatch = urlObj.search.match(/id=(\d+)/) || 
                     urlObj.pathname.match(/\/(\d+)$/) ||
                     urlObj.pathname.match(/\/people\/[^\/]+\/(\d+)/)
      
      return idMatch ? idMatch[1] : this.extractUsernameFromUrl(url)
    } catch (error) {
      return null
    }
  }

  /**
   * Update selectors (for handling Facebook UI changes)
   */
  updateSelectors(newSelectors) {
    this.selectors = { ...this.selectors, ...newSelectors }
    this.logger.info('Selectors updated')
  }

  /**
   * Test if current page is Facebook
   */
  isFacebookPage() {
    return window.location.hostname.includes('facebook.com') || 
           window.location.hostname.includes('fb.com')
  }

  /**
   * Get page type (profile, group, page, etc.)
   */
  getPageType() {
    const path = window.location.pathname
    
    if (path.includes('/groups/')) return 'group'
    if (path.includes('/pages/')) return 'page'
    if (path.includes('/profile.php') || path.match(/^\/[^\/]+\/?$/)) return 'profile'
    if (path === '/' || path === '/home.php') return 'feed'
    
    return 'unknown'
  }
}