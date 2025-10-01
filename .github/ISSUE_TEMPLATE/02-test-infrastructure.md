---
name: 🚨 CRITICAL - Fix Test Infrastructure
about: Resolve failing unit tests and set up proper testing framework
title: '[TASK-002] Fix Test Infrastructure and Failing Tests'
labels: ['priority: high', 'phase: foundation', 'type: bug', 'area: testing']
assignees: ''
---

## 🚨 Critical Issue - TASK-002

### Description
Fix failing unit tests and establish proper testing infrastructure to enable test-driven development.

### Current Problems
- 4 out of 12 unit tests failing
- Jest configuration conflicts (moduleNameMapping typo)
- Mock setup for Chrome APIs incomplete
- Test assertions not matching actual implementation
- SpamDetector implementation gaps causing test failures

### Failing Tests
1. `should detect investment scam comment` - Pattern format mismatch
2. `should detect crypto scam comment` - Pattern format mismatch  
3. `should detect social engineering with tagged users` - Logic not implemented
4. `should combine multiple detector results correctly` - Combination logic missing

### Acceptance Criteria
- [ ] All existing tests pass (12/12 success rate)
- [ ] Test coverage measurement working correctly
- [ ] Mock setup for Chrome APIs functioning
- [ ] Integration test framework operational  
- [ ] Jest configuration properly set up (no warnings)
- [ ] Test data and mock patterns properly structured

### Files Requiring Fixes
- `tests/unit/spamDetector.test.js` - Update test expectations
- `tests/setup.js` - Fix Chrome API mocks
- `jest.config.js` - Fix moduleNameMapping typo
- `src/detectors/spamDetector.js` - Implement missing methods
- `package.json` - Remove duplicate Jest config

### Root Cause Analysis
1. **Test-Implementation Gap**: Tests expect object patterns but implementation returns strings
2. **Missing Logic**: Social engineering detection and result combination not implemented
3. **Configuration Issues**: Jest setup conflicts and typos
4. **Mock Inadequacy**: Chrome API mocks not comprehensive enough

### Technical Requirements
- Update test expectations to match actual implementation OR update implementation to match tests
- Implement missing SpamDetector methods (combineResults, social engineering detection)
- Fix Jest configuration issues
- Improve Chrome API mocks

### Success Metrics
- All unit tests pass: `npm run test:unit` exits with code 0
- Test coverage reports generate correctly
- No Jest configuration warnings
- Tests run in under 10 seconds

### Estimated Time
2 days

### Phase
Foundation (Week 1-2)

### Dependencies
- Depends on TASK-001 (Build System Fix) for clean linting

### Related Issues
- Blocks TASK-003 (Complete SpamDetector Implementation)
- Enables TASK-012 (Comprehensive Testing Suite)