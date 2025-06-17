/**
 * Jest setup file
 * Runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GITLAB_TOKEN = 'test-token';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GITLAB_URL = 'https://gitlab.example.com';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to silence console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  createMockMergeRequest: (overrides = {}) => ({
    id: 123,
    iid: 1,
    title: 'Test Merge Request',
    description: 'Test description',
    author: {
      id: 1,
      name: 'Test User',
      username: 'testuser',
    },
    source_branch: 'feature/test',
    target_branch: 'main',
    state: 'opened',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides,
  }),

  createMockFileChange: (overrides = {}) => ({
    old_path: 'src/test.js',
    new_path: 'src/test.js',
    new_file: false,
    deleted_file: false,
    renamed_file: false,
    diff: '@@ -1,3 +1,4 @@\n function test() {\n+  console.log("test");\n   return true;\n }',
    ...overrides,
  }),

  createMockAIReview: (overrides = {}) => ({
    summary: 'Code review completed',
    issues: [],
    rawReview: 'No issues found',
    ...overrides,
  }),

  createMockIssue: (overrides = {}) => ({
    type: 'STYLE',
    severity: 'MEDIUM',
    line: 1,
    description: 'Test issue',
    suggestion: 'Test suggestion',
    example: '',
    ...overrides,
  }),
};

// Increase timeout for integration tests
jest.setTimeout(30000);
