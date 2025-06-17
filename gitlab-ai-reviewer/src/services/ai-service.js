/**
 * AI Service
 * Handles interactions with various AI providers for code review
 */

const OpenAI = require('openai');
const { logger } = require('../utils/logger');
const config = require('../config/config');

class AIService {
  constructor() {
    this.provider = config.ai.provider;
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'openai':
        this.client = new OpenAI({
          apiKey: config.ai.openai.apiKey,
        });
        break;

      case 'deepseek':
        // DeepSeek uses OpenAI-compatible API
        this.client = new OpenAI({
          apiKey: config.ai.deepseek.apiKey,
          baseURL: config.ai.deepseek.baseURL || 'https://api.deepseek.com/v1',
        });
        break;

      case 'anthropic':
        // Note: You would need to install @anthropic-ai/sdk
        // this.client = new Anthropic({
        //   apiKey: config.ai.anthropic.apiKey,
        // });
        throw new Error('Anthropic provider not implemented yet');

      case 'google':
        // Note: You would need to install @google-ai/generativelanguage
        throw new Error('Google AI provider not implemented yet');

      case 'azure':
        this.client = new OpenAI({
          apiKey: config.ai.azure.apiKey,
          baseURL: config.ai.azure.endpoint,
        });
        break;

      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * Review code changes using AI
   */
  async reviewCode(filename, language, diff, context = {}) {
    try {
      const prompt = this.buildReviewPrompt(filename, language, diff, context);

      logger.debug(`Sending code review request for ${filename} using ${this.provider}`);

      // Get model and parameters based on provider
      const modelConfig = this.getModelConfig();

      const response = await this.client.chat.completions.create({
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: config.prompts.systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      });

      const review = response.choices[0]?.message?.content;

      if (!review) {
        throw new Error('No review content received from AI');
      }

      logger.debug(`Received AI review for ${filename}`);
      return this.parseReview(review);

    } catch (error) {
      logger.error(`Failed to get AI review for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Get model configuration based on provider
   */
  getModelConfig() {
    switch (this.provider) {
      case 'openai':
        return {
          model: config.ai.openai.model,
          maxTokens: config.ai.openai.maxTokens,
          temperature: config.ai.openai.temperature,
        };
      case 'deepseek':
        return {
          model: config.ai.deepseek.model,
          maxTokens: config.ai.deepseek.maxTokens,
          temperature: config.ai.deepseek.temperature,
        };
      case 'azure':
        return {
          model: config.ai.azure.model,
          maxTokens: config.ai.openai.maxTokens,
          temperature: config.ai.openai.temperature,
        };
      default:
        return {
          model: config.ai.openai.model,
          maxTokens: config.ai.openai.maxTokens,
          temperature: config.ai.openai.temperature,
        };
    }
  }

  /**
   * Build the review prompt
   */
  buildReviewPrompt(filename, language, diff, context) {
    let prompt = config.prompts.reviewPrompt
      .replace('{filename}', filename)
      .replace('{language}', language)
      .replace('{diff}', diff);

    // Add context if available
    if (context.description) {
      prompt += `\n\n**Merge Request Description**:\n${context.description}`;
    }

    if (context.commitMessages && context.commitMessages.length > 0) {
      prompt += `\n\n**Recent Commit Messages**:\n${context.commitMessages.join('\n')}`;
    }

    // Add review criteria based on configuration
    const criteria = [];
    if (config.review.enableSecurityChecks) criteria.push('security vulnerabilities');
    if (config.review.enablePerformanceChecks) criteria.push('performance issues');
    if (config.review.enableCodeStyleChecks) criteria.push('code style and formatting');
    if (config.review.enableBestPracticesChecks) criteria.push('best practices');
    if (config.review.enableBugDetection) criteria.push('potential bugs');

    if (criteria.length > 0) {
      prompt += `\n\n**Focus Areas**: ${criteria.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Parse AI review response into structured format
   */
  parseReview(reviewText) {
    const issues = [];
    const lines = reviewText.split('\n');
    let currentIssue = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for issue markers
      if (trimmedLine.startsWith('- **Issue Type**:')) {
        if (currentIssue) {
          issues.push(currentIssue);
        }
        currentIssue = {
          type: this.extractValue(trimmedLine),
          severity: 'MEDIUM',
          line: null,
          description: '',
          suggestion: '',
          example: '',
        };
      } else if (currentIssue) {
        if (trimmedLine.startsWith('- **Severity**:')) {
          currentIssue.severity = this.extractValue(trimmedLine);
        } else if (trimmedLine.startsWith('- **Line**:')) {
          const lineValue = this.extractValue(trimmedLine);
          currentIssue.line = lineValue !== 'N/A' ? parseInt(lineValue) : null;
        } else if (trimmedLine.startsWith('- **Description**:')) {
          currentIssue.description = this.extractValue(trimmedLine);
        } else if (trimmedLine.startsWith('- **Suggestion**:')) {
          currentIssue.suggestion = this.extractValue(trimmedLine);
        } else if (trimmedLine.startsWith('- **Example**:')) {
          currentIssue.example = this.extractValue(trimmedLine);
        }
      }
    }

    // Add the last issue
    if (currentIssue) {
      issues.push(currentIssue);
    }

    return {
      summary: this.extractSummary(reviewText),
      issues,
      rawReview: reviewText,
    };
  }

  /**
   * Extract value from formatted line
   */
  extractValue(line) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return '';
    return line.substring(colonIndex + 1).trim();
  }

  /**
   * Extract summary from review text
   */
  extractSummary(reviewText) {
    const lines = reviewText.split('\n');
    const summaryLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('- **')) {
        summaryLines.push(trimmedLine);
      } else if (trimmedLine.startsWith('- **')) {
        break;
      }
    }
    
    return summaryLines.join(' ').trim() || 'Code review completed.';
  }

  /**
   * Generate a summary comment for multiple file reviews
   */
  async generateSummaryComment(reviews, mergeRequestInfo) {
    try {
      const totalIssues = reviews.reduce((sum, review) => sum + review.issues.length, 0);
      const criticalIssues = reviews.reduce((sum, review) =>
        sum + review.issues.filter(issue => issue.severity === 'CRITICAL').length, 0);
      const securityIssues = reviews.reduce((sum, review) =>
        sum + review.issues.filter(issue => issue.type === 'SECURITY').length, 0);

      const summaryPrompt = `
Generate a concise summary for this merge request code review:

**Merge Request**: ${mergeRequestInfo.title}
**Files Reviewed**: ${reviews.length}
**Total Issues Found**: ${totalIssues}
**Critical Issues**: ${criticalIssues}
**Security Issues**: ${securityIssues}

**Individual File Reviews**:
${reviews.map(review => `- ${review.filename}: ${review.issues.length} issues`).join('\n')}

Provide a brief, professional summary highlighting the most important findings and overall code quality assessment.
`;

      const modelConfig = this.getModelConfig();

      const response = await this.client.chat.completions.create({
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a senior code reviewer providing executive summaries of code reviews.',
          },
          {
            role: 'user',
            content: summaryPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || 'Code review summary generated.';

    } catch (error) {
      logger.error('Failed to generate summary comment:', error);
      return 'Code review completed. Please see individual file reviews below.';
    }
  }
}

module.exports = AIService;
