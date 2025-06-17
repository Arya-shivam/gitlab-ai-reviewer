#!/usr/bin/env node

/**
 * GitLab AI Reviewer - Main Entry Point
 * 
 * This is the main entry point for the GitLab AI code review bot.
 * It can run in two modes:
 * 1. CI/CD Pipeline Mode - Triggered by GitLab CI/CD
 * 2. Webhook Server Mode - Listens for GitLab webhooks
 */

require('dotenv').config();
const express = require('express');
const { logger } = require('./utils/logger');
const GitLabReviewer = require('./reviewer');
const config = require('./config/config');

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: require('../package.json').version
  });
});

// Webhook endpoint for GitLab events
app.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    const eventType = req.headers['x-gitlab-event'];
    
    logger.info(`Received GitLab event: ${eventType}`, {
      projectId: event.project?.id,
      mergeRequestId: event.object_attributes?.iid
    });

    // Only process merge request events
    if (eventType === 'Merge Request Hook') {
      const action = event.object_attributes?.action;
      
      // Trigger review on opened or updated merge requests
      if (action === 'open' || action === 'update') {
        const reviewer = new GitLabReviewer();
        await reviewer.reviewMergeRequest(
          event.project.id,
          event.object_attributes.iid
        );
      }
    }

    res.status(200).json({ message: 'Event processed successfully' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CLI Mode - for running in GitLab CI/CD
async function runCLIMode() {
  try {
    const projectId = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID;
    const mergeRequestId = process.env.CI_MERGE_REQUEST_IID;
    
    if (!projectId || !mergeRequestId) {
      logger.error('Missing required environment variables for CLI mode');
      logger.info('Required: CI_PROJECT_ID (or GITLAB_PROJECT_ID) and CI_MERGE_REQUEST_IID');
      process.exit(1);
    }

    logger.info(`Starting AI review for MR ${mergeRequestId} in project ${projectId}`);
    
    const reviewer = new GitLabReviewer();
    await reviewer.reviewMergeRequest(projectId, mergeRequestId);
    
    logger.info('AI review completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error in CLI mode:', error);
    process.exit(1);
  }
}

// Server Mode - for webhook listening
function runServerMode() {
  const port = config.port;
  
  app.listen(port, () => {
    logger.info(`GitLab AI Reviewer server running on port ${port}`);
    logger.info('Webhook endpoint: POST /webhook');
    logger.info('Health check: GET /health');
  });
}

// Determine run mode
const runMode = process.argv[2] || process.env.RUN_MODE || 'auto';

if (runMode === 'cli' || (runMode === 'auto' && process.env.CI_MERGE_REQUEST_IID)) {
  // CLI mode - typically used in GitLab CI/CD
  runCLIMode();
} else {
  // Server mode - for webhook listening
  runServerMode();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
