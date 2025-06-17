/**
 * Tests for GitLab AI Reviewer
 */

const GitLabReviewer = require('../src/reviewer');
const GitLabAPI = require('../src/services/gitlab-api');
const AIService = require('../src/services/ai-service');

// Mock the dependencies
jest.mock('../src/services/gitlab-api');
jest.mock('../src/services/ai-service');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('GitLabReviewer', () => {
  let reviewer;
  let mockGitLabAPI;
  let mockAIService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockGitLabAPI = {
      getMergeRequest: jest.fn(),
      getMergeRequestChanges: jest.fn(),
      getMergeRequestCommits: jest.fn(),
      postMergeRequestComment: jest.fn(),
      findExistingBotComment: jest.fn(),
      updateMergeRequestComment: jest.fn(),
    };
    
    mockAIService = {
      reviewCode: jest.fn(),
      generateSummaryComment: jest.fn(),
    };

    // Mock the constructors
    GitLabAPI.mockImplementation(() => mockGitLabAPI);
    AIService.mockImplementation(() => mockAIService);

    reviewer = new GitLabReviewer();
  });

  describe('reviewMergeRequest', () => {
    const projectId = '123';
    const mergeRequestIid = '456';

    it('should successfully review a merge request with issues', async () => {
      // Mock data
      const mockMergeRequest = {
        title: 'Test MR',
        author: { name: 'Test User' },
        description: 'Test description',
      };

      const mockChanges = {
        changes: [
          {
            new_path: 'src/test.js',
            old_path: 'src/test.js',
            new_file: false,
            deleted_file: false,
            renamed_file: false,
            diff: '@@ -1,3 +1,4 @@\n function test() {\n+  console.log("test");\n   return true;\n }',
          },
        ],
      };

      const mockCommits = [
        { message: 'Add test function' },
      ];

      const mockReview = {
        summary: 'Code looks good with minor issues',
        issues: [
          {
            type: 'STYLE',
            severity: 'LOW',
            line: 2,
            description: 'Consider using a logger instead of console.log',
            suggestion: 'Use a proper logging library',
          },
        ],
      };

      // Setup mocks
      mockGitLabAPI.getMergeRequest.mockResolvedValue(mockMergeRequest);
      mockGitLabAPI.getMergeRequestChanges.mockResolvedValue(mockChanges);
      mockGitLabAPI.getMergeRequestCommits.mockResolvedValue(mockCommits);
      mockGitLabAPI.findExistingBotComment.mockResolvedValue(null);
      mockGitLabAPI.postMergeRequestComment.mockResolvedValue({ id: 789 });
      mockAIService.reviewCode.mockResolvedValue(mockReview);

      // Execute
      await reviewer.reviewMergeRequest(projectId, mergeRequestIid);

      // Verify
      expect(mockGitLabAPI.getMergeRequest).toHaveBeenCalledWith(projectId, mergeRequestIid);
      expect(mockGitLabAPI.getMergeRequestChanges).toHaveBeenCalledWith(projectId, mergeRequestIid);
      expect(mockAIService.reviewCode).toHaveBeenCalledWith(
        'src/test.js',
        'javascript',
        expect.stringContaining('console.log'),
        expect.objectContaining({
          description: 'Test description',
          commitMessages: ['Add test function'],
        })
      );
      expect(mockGitLabAPI.postMergeRequestComment).toHaveBeenCalledWith(
        projectId,
        mergeRequestIid,
        expect.stringContaining('AI Code Review')
      );
    });

    it('should handle merge request with no reviewable files', async () => {
      const mockMergeRequest = {
        title: 'Test MR',
        author: { name: 'Test User' },
        description: 'Test description',
      };

      const mockChanges = {
        changes: [
          {
            new_path: 'package-lock.json',
            diff: 'some diff content',
          },
        ],
      };

      mockGitLabAPI.getMergeRequest.mockResolvedValue(mockMergeRequest);
      mockGitLabAPI.getMergeRequestChanges.mockResolvedValue(mockChanges);
      mockGitLabAPI.postMergeRequestComment.mockResolvedValue({ id: 789 });

      await reviewer.reviewMergeRequest(projectId, mergeRequestIid);

      expect(mockGitLabAPI.postMergeRequestComment).toHaveBeenCalledWith(
        projectId,
        mergeRequestIid,
        expect.stringContaining('No reviewable code changes found')
      );
    });

    it('should update existing bot comment', async () => {
      const mockMergeRequest = {
        title: 'Test MR',
        author: { name: 'Test User' },
        description: 'Test description',
      };

      const mockChanges = {
        changes: [
          {
            new_path: 'src/test.js',
            diff: '@@ -1,3 +1,4 @@\n function test() {\n+  return true;\n }',
          },
        ],
      };

      const mockExistingComment = {
        id: 999,
        body: 'Previous AI review',
      };

      const mockReview = {
        summary: 'Code looks good',
        issues: [],
      };

      mockGitLabAPI.getMergeRequest.mockResolvedValue(mockMergeRequest);
      mockGitLabAPI.getMergeRequestChanges.mockResolvedValue(mockChanges);
      mockGitLabAPI.getMergeRequestCommits.mockResolvedValue([]);
      mockGitLabAPI.findExistingBotComment.mockResolvedValue(mockExistingComment);
      mockGitLabAPI.updateMergeRequestComment.mockResolvedValue({ id: 999 });
      mockAIService.reviewCode.mockResolvedValue(mockReview);

      await reviewer.reviewMergeRequest(projectId, mergeRequestIid);

      expect(mockGitLabAPI.updateMergeRequestComment).toHaveBeenCalledWith(
        projectId,
        mergeRequestIid,
        999,
        expect.stringContaining('AI Code Review')
      );
    });

    it('should handle AI service errors gracefully', async () => {
      const mockMergeRequest = {
        title: 'Test MR',
        author: { name: 'Test User' },
        description: 'Test description',
      };

      const mockChanges = {
        changes: [
          {
            new_path: 'src/test.js',
            diff: '@@ -1,3 +1,4 @@\n function test() {\n+  return true;\n }',
          },
        ],
      };

      mockGitLabAPI.getMergeRequest.mockResolvedValue(mockMergeRequest);
      mockGitLabAPI.getMergeRequestChanges.mockResolvedValue(mockChanges);
      mockGitLabAPI.getMergeRequestCommits.mockResolvedValue([]);
      mockGitLabAPI.findExistingBotComment.mockResolvedValue(null);
      mockGitLabAPI.postMergeRequestComment.mockResolvedValue({ id: 789 });
      mockAIService.reviewCode.mockRejectedValue(new Error('AI service unavailable'));

      await reviewer.reviewMergeRequest(projectId, mergeRequestIid);

      // Should still post a comment with error information
      expect(mockGitLabAPI.postMergeRequestComment).toHaveBeenCalledWith(
        projectId,
        mergeRequestIid,
        expect.stringContaining('Error during review')
      );
    });
  });

  describe('generateReviewComment', () => {
    it('should generate comment with no issues', async () => {
      const reviews = [
        {
          filename: 'src/test.js',
          issues: [],
        },
      ];

      const mergeRequest = {
        title: 'Test MR',
      };

      const parsedFiles = [
        {
          filename: 'src/test.js',
          language: 'javascript',
        },
      ];

      const comment = await reviewer.generateReviewComment(reviews, mergeRequest, parsedFiles);

      expect(comment).toContain('Great work!');
      expect(comment).toContain('No issues found');
      expect(comment).toContain('AI Code Review');
    });

    it('should generate comment with issues grouped by severity', async () => {
      const reviews = [
        {
          filename: 'src/test.js',
          issues: [
            {
              type: 'SECURITY',
              severity: 'CRITICAL',
              line: 10,
              description: 'SQL injection vulnerability',
              suggestion: 'Use parameterized queries',
            },
            {
              type: 'STYLE',
              severity: 'LOW',
              description: 'Missing semicolon',
              suggestion: 'Add semicolon',
            },
          ],
        },
      ];

      const mergeRequest = {
        title: 'Test MR',
      };

      const parsedFiles = [
        {
          filename: 'src/test.js',
          language: 'javascript',
        },
      ];

      const comment = await reviewer.generateReviewComment(reviews, mergeRequest, parsedFiles);

      expect(comment).toContain('🚨 CRITICAL Issues');
      expect(comment).toContain('💡 LOW Issues');
      expect(comment).toContain('SQL injection vulnerability');
      expect(comment).toContain('Missing semicolon');
      expect(comment).toContain('Security Issues: 🔒 1');
    });
  });
});
