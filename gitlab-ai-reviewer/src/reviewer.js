/**
 * GitLab AI Reviewer - Main Review Logic
 * Orchestrates the entire code review process
 */

const GitLabAPI = require('./services/gitlab-api');
const AIService = require('./services/ai-service');
const DiffParser = require('./utils/diff-parser');
const { logger } = require('./utils/logger');
const config = require('./config/config');

class GitLabReviewer {
  constructor() {
    this.gitlabAPI = new GitLabAPI();
    this.aiService = new AIService();
  }

  /**
   * Main method to review a merge request
   */
  async reviewMergeRequest(projectId, mergeRequestIid) {
    try {
      logger.info(`Starting review for MR ${mergeRequestIid} in project ${projectId}`);

      // Validate configuration
      config.validateConfig();

      // Get merge request details
      const mergeRequest = await this.gitlabAPI.getMergeRequest(projectId, mergeRequestIid);
      logger.info(`Reviewing MR: "${mergeRequest.title}" by ${mergeRequest.author.name}`);

      // Get merge request changes
      const changes = await this.gitlabAPI.getMergeRequestChanges(projectId, mergeRequestIid);
      
      // Parse the changes
      const parsedFiles = DiffParser.parseMergeRequestChanges(changes);
      
      if (parsedFiles.length === 0) {
        logger.info('No reviewable files found in this merge request');
        await this.postNoReviewComment(projectId, mergeRequestIid);
        return;
      }

      logger.info(`Found ${parsedFiles.length} files to review`);

      // Get additional context
      const context = await this.gatherContext(projectId, mergeRequestIid, mergeRequest);

      // Review each file
      const reviews = [];
      for (const file of parsedFiles) {
        try {
          if (file.tooLarge) {
            reviews.push({
              filename: file.filename,
              skipped: true,
              reason: 'File too large',
              issues: [],
            });
            continue;
          }

          logger.info(`Reviewing file: ${file.filename}`);
          const review = await this.aiService.reviewCode(
            file.filename,
            file.language,
            file.diff,
            context
          );

          reviews.push({
            filename: file.filename,
            language: file.language,
            changeType: file.changeType,
            ...review,
          });

          // Add small delay to avoid rate limiting
          await this.delay(1000);

        } catch (error) {
          logger.error(`Failed to review file ${file.filename}:`, error);
          reviews.push({
            filename: file.filename,
            error: true,
            errorMessage: error.message,
            issues: [],
          });
        }
      }

      // Generate and post the review comment
      await this.postReviewComment(projectId, mergeRequestIid, reviews, mergeRequest, parsedFiles);

      logger.info(`Review completed for MR ${mergeRequestIid}`);

    } catch (error) {
      logger.error(`Failed to review MR ${mergeRequestIid}:`, error);
      
      // Try to post an error comment
      try {
        await this.postErrorComment(projectId, mergeRequestIid, error);
      } catch (commentError) {
        logger.error('Failed to post error comment:', commentError);
      }
      
      throw error;
    }
  }

  /**
   * Gather additional context for the review
   */
  async gatherContext(projectId, mergeRequestIid, mergeRequest) {
    const context = {
      description: mergeRequest.description,
      commitMessages: [],
    };

    try {
      // Get recent commits
      const commits = await this.gitlabAPI.getMergeRequestCommits(projectId, mergeRequestIid);
      context.commitMessages = commits.slice(0, 5).map(commit => commit.message);
    } catch (error) {
      logger.warn('Failed to get commit messages:', error);
    }

    return context;
  }

  /**
   * Post the main review comment
   */
  async postReviewComment(projectId, mergeRequestIid, reviews, mergeRequest, parsedFiles) {
    try {
      // Check if we already have a bot comment
      const existingComment = await this.gitlabAPI.findExistingBotComment(
        projectId, 
        mergeRequestIid
      );

      // Generate the comment content
      const commentContent = await this.generateReviewComment(reviews, mergeRequest, parsedFiles);

      if (existingComment) {
        // Update existing comment
        await this.gitlabAPI.updateMergeRequestComment(
          projectId,
          mergeRequestIid,
          existingComment.id,
          commentContent
        );
        logger.info('Updated existing review comment');
      } else {
        // Post new comment
        await this.gitlabAPI.postMergeRequestComment(
          projectId,
          mergeRequestIid,
          commentContent
        );
        logger.info('Posted new review comment');
      }

    } catch (error) {
      logger.error('Failed to post review comment:', error);
      throw error;
    }
  }

  /**
   * Generate the review comment content
   */
  async generateReviewComment(reviews, mergeRequest, parsedFiles) {
    const stats = DiffParser.getFileStats(parsedFiles);
    const totalIssues = reviews.reduce((sum, review) => sum + (review.issues?.length || 0), 0);
    const criticalIssues = reviews.reduce((sum, review) => 
      sum + (review.issues?.filter(issue => issue.severity === 'CRITICAL').length || 0), 0);
    const securityIssues = reviews.reduce((sum, review) => 
      sum + (review.issues?.filter(issue => issue.type === 'SECURITY').length || 0), 0);

    let comment = `## 🤖 AI Code Review\n\n`;
    
    // Add summary
    if (totalIssues === 0) {
      comment += `✅ **Great work!** No issues found in this merge request.\n\n`;
    } else {
      comment += `📊 **Review Summary:**\n`;
      comment += `- **Files Reviewed:** ${reviews.length}\n`;
      comment += `- **Total Issues:** ${totalIssues}\n`;
      if (criticalIssues > 0) {
        comment += `- **Critical Issues:** ⚠️ ${criticalIssues}\n`;
      }
      if (securityIssues > 0) {
        comment += `- **Security Issues:** 🔒 ${securityIssues}\n`;
      }
      comment += `\n`;
    }

    // Add file-by-file reviews
    for (const review of reviews) {
      if (review.error) {
        comment += `### ❌ ${review.filename}\n`;
        comment += `*Error during review: ${review.errorMessage}*\n\n`;
        continue;
      }

      if (review.skipped) {
        comment += `### ⏭️ ${review.filename}\n`;
        comment += `*Skipped: ${review.reason}*\n\n`;
        continue;
      }

      if (!review.issues || review.issues.length === 0) {
        comment += `### ✅ ${review.filename}\n`;
        comment += `*No issues found*\n\n`;
        continue;
      }

      comment += `### 📝 ${review.filename}\n`;
      comment += `*${review.issues.length} issue(s) found*\n\n`;

      // Group issues by severity
      const issuesBySeverity = {
        CRITICAL: review.issues.filter(i => i.severity === 'CRITICAL'),
        HIGH: review.issues.filter(i => i.severity === 'HIGH'),
        MEDIUM: review.issues.filter(i => i.severity === 'MEDIUM'),
        LOW: review.issues.filter(i => i.severity === 'LOW'),
      };

      for (const [severity, issues] of Object.entries(issuesBySeverity)) {
        if (issues.length === 0) continue;

        const severityIcon = {
          CRITICAL: '🚨',
          HIGH: '⚠️',
          MEDIUM: '⚡',
          LOW: '💡',
        }[severity];

        comment += `#### ${severityIcon} ${severity} Issues\n\n`;

        for (const issue of issues) {
          comment += `**${issue.type}**`;
          if (issue.line) {
            comment += ` (Line ${issue.line})`;
          }
          comment += `\n`;
          comment += `${issue.description}\n\n`;
          
          if (issue.suggestion) {
            comment += `*Suggestion:* ${issue.suggestion}\n\n`;
          }
          
          if (issue.example) {
            comment += `*Example:*\n\`\`\`\n${issue.example}\n\`\`\`\n\n`;
          }
        }
      }
    }

    // Add footer
    comment += `---\n`;
    comment += `*Review generated by GitLab AI Reviewer at ${new Date().toISOString()}*\n`;
    comment += `*Powered by ${config.ai.provider.toUpperCase()} ${config.ai.openai.model}*`;

    return comment;
  }

  /**
   * Post comment when no reviewable files are found
   */
  async postNoReviewComment(projectId, mergeRequestIid) {
    const comment = `## 🤖 AI Code Review\n\n` +
      `ℹ️ No reviewable code changes found in this merge request.\n\n` +
      `This might be because:\n` +
      `- Only configuration files or documentation were changed\n` +
      `- Files are too large to review\n` +
      `- File types are not supported for review\n\n` +
      `---\n` +
      `*Review generated by GitLab AI Reviewer at ${new Date().toISOString()}*`;

    await this.gitlabAPI.postMergeRequestComment(projectId, mergeRequestIid, comment);
  }

  /**
   * Post error comment when review fails
   */
  async postErrorComment(projectId, mergeRequestIid, error) {
    const comment = `## 🤖 AI Code Review\n\n` +
      `❌ **Review Failed**\n\n` +
      `An error occurred while reviewing this merge request:\n` +
      `\`${error.message}\`\n\n` +
      `Please check the configuration and try again.\n\n` +
      `---\n` +
      `*Error reported by GitLab AI Reviewer at ${new Date().toISOString()}*`;

    await this.gitlabAPI.postMergeRequestComment(projectId, mergeRequestIid, comment);
  }

  /**
   * Utility method to add delays
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GitLabReviewer;
