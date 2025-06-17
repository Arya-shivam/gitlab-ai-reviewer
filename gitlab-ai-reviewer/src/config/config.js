/**
 * Configuration module for GitLab AI Reviewer
 * Centralizes all configuration settings and environment variables
 */

const config = {
  // GitLab Configuration
  gitlab: {
    url: process.env.GITLAB_URL || 'https://gitlab.com',
    token: process.env.GITLAB_TOKEN,
    projectId: process.env.GITLAB_PROJECT_ID,
  },

  // AI Service Configuration
  ai: {
    provider: process.env.AI_PROVIDER || 'openrouter',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.AI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'x-ai/grok-3-beta',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1500,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
      siteUrl: process.env.OPENROUTER_SITE_URL || 'https://gitlab-ai-reviewer.com',
      siteName: process.env.OPENROUTER_SITE_NAME || 'GitLab AI Reviewer',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-coder',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 4000,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-sonnet-20240229',
    },
    google: {
      apiKey: process.env.GOOGLE_AI_KEY,
      model: 'gemini-pro',
    },
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_KEY,
      model: process.env.AZURE_MODEL || 'gpt-4',
    },
  },

  // Application Configuration
  app: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Review Configuration
  review: {
    maxDiffSize: parseInt(process.env.MAX_DIFF_SIZE) || 10000,
    supportedLanguages: (process.env.REVIEW_LANGUAGES || 
      'javascript,typescript,python,java,go,rust,php,ruby,csharp,cpp,c,kotlin,swift,scala,dart')
      .split(',').map(lang => lang.trim()),
    skipFiles: (process.env.SKIP_FILES || 
      'package-lock.json,yarn.lock,*.min.js,*.bundle.js,*.map,*.lock,dist/*,build/*,node_modules/*')
      .split(',').map(pattern => pattern.trim()),
    
    // Review criteria flags
    enableSecurityChecks: process.env.ENABLE_SECURITY_CHECKS !== 'false',
    enablePerformanceChecks: process.env.ENABLE_PERFORMANCE_CHECKS !== 'false',
    enableCodeStyleChecks: process.env.ENABLE_CODE_STYLE_CHECKS !== 'false',
    enableBestPracticesChecks: process.env.ENABLE_BEST_PRACTICES_CHECKS !== 'false',
    enableBugDetection: process.env.ENABLE_BUG_DETECTION !== 'false',
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },

  // Notification Configuration
  notifications: {
    notifyOnCritical: process.env.NOTIFY_ON_CRITICAL_ISSUES !== 'false',
    notifyOnSecurity: process.env.NOTIFY_ON_SECURITY_ISSUES !== 'false',
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  },

  // Review prompts and templates
  prompts: {
    systemPrompt: `You are an expert code reviewer with deep knowledge of software engineering best practices, security, and performance optimization. 

Your task is to review code changes and provide constructive feedback. Focus on:

1. **Security Issues**: Identify potential vulnerabilities, injection attacks, authentication/authorization issues
2. **Performance Problems**: Spot inefficient algorithms, memory leaks, unnecessary computations
3. **Code Quality**: Check for readability, maintainability, proper naming conventions
4. **Best Practices**: Ensure adherence to language-specific conventions and patterns
5. **Potential Bugs**: Identify logic errors, edge cases, null pointer issues

Provide feedback in this format:
- **Issue Type**: [SECURITY|PERFORMANCE|STYLE|BUG|BEST_PRACTICE]
- **Severity**: [CRITICAL|HIGH|MEDIUM|LOW]
- **Line**: [line number if applicable]
- **Description**: Clear explanation of the issue
- **Suggestion**: Specific recommendation for improvement
- **Example**: Code example if helpful

Be constructive and educational. Focus on the most important issues first.`,

    reviewPrompt: `Please review the following code changes and provide feedback:

**File**: {filename}
**Language**: {language}
**Changes**:
\`\`\`diff
{diff}
\`\`\`

Focus on security, performance, code quality, and potential bugs. Provide specific, actionable feedback.`,
  },
};

// Validation
function validateConfig() {
  const required = [
    'GITLAB_TOKEN',
  ];

  // Add AI provider specific requirements
  if (config.ai.provider === 'openai') {
    required.push('OPENAI_API_KEY');
  } else if (config.ai.provider === 'openrouter') {
    required.push('OPENROUTER_API_KEY');
  } else if (config.ai.provider === 'deepseek') {
    required.push('DEEPSEEK_API_KEY');
  } else if (config.ai.provider === 'anthropic') {
    required.push('ANTHROPIC_API_KEY');
  }

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate AI provider configuration
  if (config.ai.provider === 'openai' && !config.ai.openai.apiKey) {
    throw new Error('OpenAI API key is required when using OpenAI provider');
  }

  if (config.ai.provider === 'openrouter' && !config.ai.openrouter.apiKey) {
    throw new Error('OpenRouter API key is required when using OpenRouter provider');
  }

  if (config.ai.provider === 'deepseek' && !config.ai.deepseek.apiKey) {
    throw new Error('DeepSeek API key is required when using DeepSeek provider');
  }

  if (config.ai.provider === 'anthropic' && !config.ai.anthropic.apiKey) {
    throw new Error('Anthropic API key is required when using Anthropic provider');
  }
}

// Export individual config sections for convenience
module.exports = {
  ...config.app,
  gitlab: config.gitlab,
  ai: config.ai,
  review: config.review,
  webhook: config.webhook,
  notifications: config.notifications,
  prompts: config.prompts,
  validateConfig,
};
