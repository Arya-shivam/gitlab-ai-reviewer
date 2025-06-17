/**
 * GitLab API Service
 * Handles all interactions with GitLab API including fetching MR data and posting comments
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config/config');

class GitLabAPI {
  constructor() {
    this.baseURL = config.gitlab.url;
    this.token = config.gitlab.token;
    
    if (!this.token) {
      throw new Error('GitLab token is required');
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v4`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`GitLab API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('GitLab API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`GitLab API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('GitLab API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get merge request details
   */
  async getMergeRequest(projectId, mergeRequestIid) {
    try {
      const response = await this.client.get(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}`
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get merge request ${mergeRequestIid}:`, error);
      throw error;
    }
  }

  /**
   * Get merge request changes (diff)
   */
  async getMergeRequestChanges(projectId, mergeRequestIid) {
    try {
      const response = await this.client.get(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/changes`
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get merge request changes ${mergeRequestIid}:`, error);
      throw error;
    }
  }

  /**
   * Get merge request commits
   */
  async getMergeRequestCommits(projectId, mergeRequestIid) {
    try {
      const response = await this.client.get(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/commits`
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get merge request commits ${mergeRequestIid}:`, error);
      throw error;
    }
  }

  /**
   * Post a comment on merge request
   */
  async postMergeRequestComment(projectId, mergeRequestIid, comment) {
    try {
      const response = await this.client.post(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`,
        { body: comment }
      );
      logger.info(`Posted comment on MR ${mergeRequestIid}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to post comment on MR ${mergeRequestIid}:`, error);
      throw error;
    }
  }

  /**
   * Get existing comments on merge request
   */
  async getMergeRequestComments(projectId, mergeRequestIid) {
    try {
      const response = await this.client.get(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get comments for MR ${mergeRequestIid}:`, error);
      throw error;
    }
  }

  /**
   * Update merge request comment
   */
  async updateMergeRequestComment(projectId, mergeRequestIid, noteId, comment) {
    try {
      const response = await this.client.put(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes/${noteId}`,
        { body: comment }
      );
      logger.info(`Updated comment ${noteId} on MR ${mergeRequestIid}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update comment ${noteId} on MR ${mergeRequestIid}:`, error);
      throw error;
    }
  }

  /**
   * Get project details
   */
  async getProject(projectId) {
    try {
      const response = await this.client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(projectId, filePath, ref = 'main') {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await this.client.get(
        `/projects/${projectId}/repository/files/${encodedPath}?ref=${ref}`
      );
      
      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;
    } catch (error) {
      if (error.response?.status === 404) {
        logger.debug(`File not found: ${filePath}`);
        return null;
      }
      logger.error(`Failed to get file content for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if bot has already commented on this MR
   */
  async findExistingBotComment(projectId, mergeRequestIid, botIdentifier = '🤖 AI Code Review') {
    try {
      const comments = await this.getMergeRequestComments(projectId, mergeRequestIid);
      return comments.find(comment => 
        comment.body.includes(botIdentifier) && 
        comment.system === false
      );
    } catch (error) {
      logger.error('Failed to find existing bot comment:', error);
      return null;
    }
  }
}

module.exports = GitLabAPI;
