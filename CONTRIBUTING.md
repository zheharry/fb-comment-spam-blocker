# Contributing to Facebook Comment Spam Blocker

Thank you for your interest in contributing to the Facebook Comment Spam Blocker! This document provides guidelines and instructions for contributing to the project.

## 🎯 How to Contribute

### Reporting Bugs
1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Include detailed information**:
   - Browser version and OS
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features
1. **Check existing feature requests** first
2. **Use the feature request template**
3. **Provide clear rationale** for the feature
4. **Consider implementation complexity** and user impact

### Contributing Code

#### Prerequisites
- Node.js 16+ installed
- Git knowledge
- Basic understanding of browser extensions
- Familiarity with JavaScript/ES6+

#### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/fb-comment-spam-blocker.git
cd fb-comment-spam-blocker

# Install dependencies
npm install

# Run development build
npm run dev

# Run tests
npm test
```

#### Code Standards
- **ESLint**: Follow the configured ESLint rules
- **Testing**: Write tests for new functionality
- **Documentation**: Update documentation for new features
- **Commit Messages**: Use clear, descriptive commit messages

#### Pull Request Process
1. **Create a feature branch** from `main`
2. **Make your changes** with appropriate tests
3. **Run the full test suite**: `npm test`
4. **Lint your code**: `npm run lint`
5. **Update documentation** if necessary
6. **Submit a pull request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots for UI changes

## 🧪 Testing Guidelines

### Running Tests
```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests
npm run lint            # Code linting
```

### Writing Tests
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows (careful with Facebook interaction)
- **Coverage**: Aim for >80% code coverage

### Test Data
- Use mock data for testing spam patterns
- Avoid real Facebook content in tests
- Include diverse test cases (different languages, edge cases)

## 🔍 Detection Pattern Development

### Adding New Spam Patterns
1. **Research the spam type** thoroughly
2. **Create test cases** first (TDD approach)
3. **Implement detection logic** in appropriate detector
4. **Test with real-world examples** (anonymized)
5. **Consider false positive rates**

### Pattern Categories
- **Investment Scams**: Financial advisor promotions
- **Crypto Scams**: Cryptocurrency fraud
- **Generic Spam**: Repetitive/promotional content
- **Social Engineering**: User manipulation tactics

### Pattern Quality Guidelines
- **Specificity**: Avoid overly broad patterns
- **Language Support**: Consider multilingual patterns
- **Performance**: Efficient pattern matching
- **Accuracy**: Balance detection vs false positives

## 🌐 Internationalization

### Adding Language Support
1. **Identify spam patterns** in the target language
2. **Add detection keywords** to appropriate detectors
3. **Include test cases** with the new language
4. **Update documentation** if needed

### Supported Languages
- **Chinese (Traditional/Simplified)**: Primary focus
- **English**: Secondary support
- **Other languages**: Community contributions welcome

## 🔒 Security Considerations

### Privacy Guidelines
- **No data collection** without explicit user consent
- **Local processing** - avoid external API calls
- **Minimal permissions** - request only necessary permissions
- **User control** - always allow users to override decisions

### Security Practices
- **Input validation** for all user inputs
- **XSS prevention** in DOM manipulation
- **Content Security Policy** compliance
- **Secure coding** practices

## 📝 Documentation

### Code Documentation
- **JSDoc comments** for functions and classes
- **Inline comments** for complex logic
- **README updates** for new features
- **API documentation** for public interfaces

### User Documentation
- **Clear instructions** for installation and usage
- **Feature explanations** with examples
- **Troubleshooting guides** for common issues
- **Privacy policy** updates if needed

## 🚀 Release Process

### Versioning
- Follow **Semantic Versioning** (semver)
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version bumped appropriately
- [ ] Changelog updated
- [ ] Cross-browser testing completed
- [ ] Performance impact assessed

## 🤝 Community Guidelines

### Code of Conduct
- **Be respectful** and inclusive
- **Welcome newcomers** and help them contribute
- **Provide constructive feedback** in reviews
- **Focus on the code**, not the person

### Communication
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions and discussions
- **Discussions**: General questions and ideas

## 📋 Development Workflow

### Branch Strategy
- `main`: Stable release branch
- `develop`: Integration branch for features
- `feature/xyz`: Individual feature branches
- `hotfix/xyz`: Critical bug fixes

### Commit Guidelines
```
type(scope): description

Examples:
feat(detector): add crypto scam detection
fix(parser): handle missing comment author
docs(readme): update installation instructions
test(unit): add investment scam detector tests
```

### Review Process
1. **Automated checks** must pass (tests, linting)
2. **Code review** by maintainers
3. **Testing** on different browsers if applicable
4. **Documentation review** for user-facing changes

## 🛠️ Technical Architecture

### Core Components
- **Detectors**: Pattern matching engines
- **Parser**: Facebook DOM interaction
- **Content Script**: Page monitoring
- **Background**: Configuration management
- **Popup**: User interface

### Adding New Components
1. **Follow existing patterns** and structure
2. **Include comprehensive tests**
3. **Document public interfaces**
4. **Consider performance impact**

## ❓ Getting Help

### Resources
- **GitHub Issues**: Technical questions
- **Code Comments**: Implementation details
- **Tests**: Usage examples
- **Documentation**: Feature explanations

### Contact
- Create an issue for bugs or features
- Start a discussion for general questions
- Check existing issues before creating new ones

Thank you for contributing to making Facebook a safer place for everyone! 🛡️