# Testing Guide

This project uses **Jest** as the test runner and **Supertest** for HTTP endpoint testing.

## Test Setup

### Dependencies

- `jest`: Test runner and assertion library
- `supertest`: HTTP testing library
- `@babel/preset-env`: ES6+ support for tests
- `babel-jest`: Babel integration with Jest

### Configuration Files

- `jest.config.js`: Jest configuration
- `babel.config.js`: Babel configuration for ES modules
- `.env.test`: Test environment variables
- `tests/setup.js`: Global test setup

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Advanced Commands

```bash
# Run specific test file
npx jest tests/user.routes.test.js

# Run tests matching a pattern
npx jest --testNamePattern="registration"

# Run tests for specific file changes
npx jest --onlyChanged

# Update snapshots
npx jest --updateSnapshot
```

## Test Structure

### Test Files

- `tests/app.test.js`: Basic app functionality, CORS, JSON parsing
- `tests/user.routes.test.js`: User registration, login, authentication
- `tests/hospital.routes.test.js`: Hospital routes and functionality
- `tests/integration.test.js`: End-to-end workflow tests
- `tests/utils.test.js`: Utility function tests

### Test Database

Tests use a separate MongoDB database (`doctors_test`) to avoid affecting development data.

## Test Categories

### 1. Unit Tests

Test individual functions and utilities:

- API utilities (`ApiError`, `ApiResponse`, `asyncHandler`)
- Helper functions
- Validation logic

### 2. Route Tests

Test API endpoints:

- Request/response validation
- Authentication requirements
- Error handling
- Status codes

### 3. Integration Tests

Test complete workflows:

- User registration → login → protected routes
- Hospital registration → login → management
- File upload processes
- Error scenarios

## Environment Variables

Test environment variables are defined in `.env.test`:

- `NODE_ENV=test`
- `MONGODB_URI=mongodb://localhost:27017/doctors_test`
- Test JWT secrets
- Disabled file uploads for testing

## Best Practices

### Writing Tests

1. **Arrange, Act, Assert**: Structure tests clearly
2. **Descriptive names**: Use clear test descriptions
3. **Independent tests**: Each test should work in isolation
4. **Clean up**: Database is cleared between tests
5. **Mock external services**: Use mocks for Cloudinary, email, etc.

### Test Organization

```javascript
describe("Feature Group", () => {
  beforeAll(async () => {
    // Setup before all tests in this group
    await setupTestDB();
  });

  afterAll(async () => {
    // Cleanup after all tests in this group
    await teardownTestDB();
  });

  beforeEach(async () => {
    // Setup before each test
    await clearTestDB();
  });

  describe("Specific functionality", () => {
    it("should do something specific", async () => {
      // Test implementation
    });
  });
});
```

## Debugging Tests

### Common Issues

1. **Database connection**: Ensure MongoDB is running
2. **Environment variables**: Check `.env.test` file
3. **Port conflicts**: Tests use port 3001 by default
4. **Async/await**: Always await async operations

### Debug Mode

```bash
# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand --no-cache

# Verbose logging
DEBUG=* npm test
```

## Coverage Reports

Coverage reports show which parts of your code are tested:

- `coverage/lcov-report/index.html`: HTML coverage report
- `coverage/lcov.info`: LCOV format for CI/CD

### Coverage Targets

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v1
```

## Mock Services

For external services, create mocks in `tests/mocks/`:

- Cloudinary uploads
- Email services
- Payment gateways
- External APIs

## Performance Testing

For load testing, consider adding:

- Artillery.js for load testing
- Clinic.js for performance profiling
- Memory leak detection

## Security Testing

Test security aspects:

- Input validation
- SQL injection prevention
- Authentication bypass attempts
- Rate limiting
- CORS configuration
