/**
 * Jest test setup file
 * Sets up global mocks and test utilities
 */

// Mock chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    lastError: null,
    getURL: jest.fn((path) => `chrome-extension://test-extension-id/${path}`)
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    onUpdated: {
      addListener: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn()
  }
}

// Mock browser APIs for cross-browser compatibility
global.browser = global.chrome

// Mock DOM APIs that might not be available in jsdom
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe() {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }
}

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000
  }
}

// Mock URL constructor for older environments
if (typeof URL === 'undefined') {
  global.URL = class URL {
    constructor(url) {
      // Simple URL parsing mock
      this.href = url
      const match = url.match(/^https?:\/\/([^\/]+)/)
      this.hostname = match ? match[1] : ''
      this.pathname = url.replace(/^https?:\/\/[^\/]+/, '') || '/'
      this.search = ''
    }
  }
}

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Helper function to create mock comment data
global.createMockComment = (overrides = {}) => {
  return {
    text: 'Test comment text',
    author: {
      id: 'user123',
      username: 'testuser',
      name: 'Test User',
      profileUrl: 'https://facebook.com/testuser'
    },
    taggedUsers: [],
    links: [],
    timestamp: new Date().toISOString(),
    element: document.createElement('div'),
    ...overrides
  }
}

// Helper function to create mock config
global.createMockConfig = (overrides = {}) => {
  return {
    enabled: true,
    detectionPatterns: {
      investmentScams: true,
      cryptoScams: true,
      genericSpam: true,
      socialEngineering: true
    },
    blacklist: {
      users: [],
      keywords: ['spam', 'scam']
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
    },
    ...overrides
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()

  // Clear any DOM modifications
  document.body.innerHTML = ''

  // Reset chrome API mocks
  if (chrome.runtime.lastError) {
    chrome.runtime.lastError = null
  }
})
