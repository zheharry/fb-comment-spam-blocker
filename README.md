# Facebook Comment Spam Blocker

A sophisticated browser extension powered by Playwright framework to detect and block Facebook comment spam, with specialized focus on investment scam promotions and fraudulent financial advice.

## 🛡️ Features

### Advanced Spam Detection
- **Investment Scam Detection**: Identifies "股海策略師" style promotions and fake financial advisor scams
- **Cryptocurrency Scam Detection**: Catches Bitcoin/crypto investment fraud and get-rich-quick schemes  
- **Generic Spam Detection**: Blocks repetitive content, excessive emojis, and suspicious link patterns
- **Social Engineering Detection**: Prevents spam spread through user tagging tactics

### Smart Blacklist Management
- **Automatic User Blocking**: Blacklists spam commenters and tagged users
- **Keyword Filtering**: Customizable keyword blacklist with multi-language support
- **Whitelist Protection**: Trusted users and domains bypass all filters

### Multi-Browser Support
- **Chrome**: Full Manifest V3 support with all features
- **Edge**: Complete compatibility using Chromium base
- **Safari**: Basic functionality (lower priority)

### User Experience
- **Real-time Monitoring**: Scans comments as they load on Facebook
- **Non-intrusive Blocking**: Hides spam with option to view/report false positives
- **Configurable Settings**: Adjust detection sensitivity and notification preferences
- **Detailed Statistics**: Track blocked content and detection accuracy

## 🚀 Installation

### From Browser Store (Coming Soon)
1. Visit Chrome Web Store / Edge Add-ons
2. Search for "Facebook Comment Spam Blocker"
3. Click "Add to Browser"

### Manual Installation (Development)
1. Clone this repository
2. Install dependencies: `npm install`
3. Build extension: `npm run build`
4. Load unpacked extension from `dist/chrome` folder

## 🔧 Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Playwright for testing

### Setup
```bash
# Clone repository
git clone https://github.com/zheharry/fb-comment-spam-blocker.git

# Install dependencies
npm install

# Run development build
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

### Build Commands
```bash
npm run build        # Build all browser versions
npm run build:chrome # Chrome/Chromium build
npm run build:edge   # Microsoft Edge build  
npm run build:safari # Safari build (limited features)
```

### Testing
```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests with Playwright
npm run lint            # Code linting
```

## 📋 Architecture

### Core Components
- **SpamDetector**: Main detection engine coordinating specialized detectors
- **InvestmentScamDetector**: Targets financial fraud promotions
- **CryptoScamDetector**: Identifies cryptocurrency scams
- **GenericSpamDetector**: Catches general spam patterns
- **SocialEngineeringDetector**: Detects user manipulation tactics
- **FacebookParser**: Handles Facebook DOM parsing and comment extraction
- **ContentScript**: Monitors Facebook pages and applies blocking
- **BackgroundService**: Manages configuration and cross-tab communication
- **PopupInterface**: User configuration and statistics dashboard

### Detection Patterns
The extension uses multi-layered pattern matching:
- **Keyword Analysis**: Matches against known scam terminology
- **Sentiment Analysis**: Identifies promotional and manipulative language
- **User Behavior**: Analyzes tagging patterns and account characteristics
- **Link Analysis**: Checks for suspicious domains and shortened URLs
- **Pattern Scoring**: Weighted confidence system with configurable thresholds

## 🛠️ Configuration

### Detection Settings
- **Investment Scams**: Toggle detection of financial advisor promotions
- **Crypto Scams**: Enable/disable cryptocurrency fraud detection
- **Generic Spam**: Control general spam pattern matching
- **Social Engineering**: Manage user tagging spam detection
- **Aggressive Mode**: Lower detection threshold for higher sensitivity

### Blacklist Management
- Add/remove users by ID or username
- Manage keyword blacklist with custom terms
- Import/export settings for backup and sharing

### Statistics & Monitoring
- Track blocked comments and users
- Monitor detection accuracy and false positives
- View detailed analytics and trends

## 🔒 Privacy & Security

- **No Data Collection**: Extension processes data locally only
- **No External Servers**: All detection happens in browser
- **Minimal Permissions**: Only accesses Facebook domains
- **Open Source**: Full transparency of detection algorithms
- **User Control**: Complete control over blocking decisions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork repository
2. Create feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit pull request

### Reporting Issues
- Use GitHub Issues for bug reports
- Include browser version and extension version
- Provide steps to reproduce
- Attach screenshots if relevant

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Playwright team for the excellent testing framework
- Facebook users who helped identify spam patterns
- Open source community for tools and libraries used

## ⚠️ Disclaimer

This extension is provided as-is for educational and protective purposes. Users are responsible for complying with Facebook's Terms of Service. The extension aims to improve user experience by reducing spam exposure while respecting platform guidelines.
