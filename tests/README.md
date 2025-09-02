# Verification System Tests

This directory contains comprehensive tests for the consolidated verification system in the Facepet application.

## Test Structure

### 1. Core System Tests (`verification-system-integration.test.ts`)
Tests the fundamental verification utilities:
- Code generation and validation
- Password hashing and updates
- Password reset token management
- Access control functions
- Database operations

### 2. Complete Workflow Tests (`verification-workflows.test.ts`)
Tests complete user journeys:
- **Signup with Email Confirmation**: Full user registration with email verification
- **Password Change Workflow**: Authenticated user changing password with email confirmation
- **Password Reset Workflow**: Forgotten password reset with secure token

### 3. Comprehensive Test Suite (`run-all-verification-tests.ts`)
Master test runner that includes:
- All core system tests
- All workflow tests
- Error handling and edge cases
- Rate limiting validation
- Security validations
- Cleanup function tests

## Running Tests

### Prerequisites
1. Ensure your database is set up and accessible
2. Make sure environment variables are configured (`.env` file)
3. Install dependencies: `npm install`

### Run All Tests
```bash
npm run test:verification
```

### Run Specific Test Suites
```bash
# Core verification system tests only
npm run test:verification:core

# Complete workflow tests only
npm run test:verification:workflows
```

### Run Individual Test Files
```bash
# Core system integration tests
npx ts-node tests/verification-system-integration.test.ts

# Complete workflow tests
npx ts-node tests/verification-workflows.test.ts

# Comprehensive test suite
npx ts-node tests/run-all-verification-tests.ts
```

## Test Coverage

### ✅ Tested Verification Features

#### Core Utilities
- [x] Verification code generation (6-digit codes)
- [x] Verification code validation and expiration
- [x] Code marking as used (prevent reuse)
- [x] Password hashing with bcrypt
- [x] Password updates in database
- [x] Password reset token generation (64-char hex)
- [x] Reset token validation and expiration
- [x] Temporary password change storage
- [x] Access control checks

#### Complete Workflows
- [x] **Signup Flow**: User registration → Email verification → Account activation
- [x] **Password Change Flow**: Current password verification → Email confirmation → Password update → Notification
- [x] **Password Reset Flow**: Reset request → Email with token → New password → Confirmation

#### Security & Error Handling
- [x] Invalid email rejection
- [x] Invalid verification code handling
- [x] Expired code/token handling
- [x] Password hashing security (salted, unique)
- [x] Reset token security (unique, proper length)
- [x] Rate limiting protection
- [x] Automatic cleanup of expired tokens

## Test Data Management

### Database Safety
- Tests create temporary test users with unique email addresses
- All test data is automatically cleaned up after test completion
- Tests use the format: `test-{timestamp}@example.com` for email addresses

### Mock Services
- Email sending is mocked to avoid sending real emails during tests
- Mock services log email details to console for verification
- Database operations use real database connections for integration testing

## Expected Test Results

When all tests pass, you should see:
```
🎉 ALL TESTS PASSED! The verification system is ready for production!

✨ Key Features Verified:
  • Email verification for signup
  • Password change with email confirmation
  • Password reset with secure tokens
  • Rate limiting protection
  • Secure password hashing
  • Proper error handling
  • Automatic cleanup of expired tokens
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure your database is running
   - Check environment variables in `.env`
   - Verify database credentials

2. **Import Errors**
   - Make sure all dependencies are installed
   - Check that the verification system files exist
   - Verify TypeScript compilation

3. **Test Failures**
   - Check console output for specific error messages
   - Ensure database has proper permissions
   - Verify that required tables exist (run migrations)

### Environment Variables Required
```env
DATABASE_URL=your_database_connection_string
# Other required environment variables...
```

## Test Maintenance

### Adding New Tests
1. Create test functions in the appropriate test file
2. Follow the existing naming convention
3. Include proper cleanup in `finally` blocks
4. Add test results to the comprehensive test runner

### Updating Tests
When modifying verification system functionality:
1. Update corresponding tests
2. Run full test suite to ensure no regressions
3. Update this README if test coverage changes

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:
```yaml
# Example GitHub Actions step
- name: Run Verification Tests
  run: npm run test:verification
```

For production deployment, ensure all tests pass before deploying changes to the verification system.
