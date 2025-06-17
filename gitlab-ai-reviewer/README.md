# 🤖 GitLab AI Code Reviewer

An intelligent, automated code review bot that uses AI to analyze merge requests and provide constructive feedback. Perfect for teams looking to catch issues early and maintain code quality standards.

## ✨ Features

- **🔍 Intelligent Code Analysis**: Uses GPT-4 to review code changes for security, performance, and best practices
- **🚀 Automatic Trigger**: Integrates with GitLab CI/CD to automatically review merge requests
- **💬 Smart Comments**: Posts detailed, actionable feedback directly on merge requests
- **🔒 Security Focus**: Identifies potential security vulnerabilities and injection attacks
- **⚡ Performance Optimization**: Spots inefficient algorithms and performance bottlenecks
- **📝 Code Quality**: Checks for readability, maintainability, and coding standards
- **🌐 Multi-language Support**: Works with JavaScript, TypeScript, Python, Java, Go, Rust, and more
- **🔄 Update Support**: Updates existing review comments instead of creating duplicates
- **📊 Detailed Reports**: Provides comprehensive review summaries with issue categorization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitLab MR     │───▶│  AI Reviewer    │───▶│   AI Service    │
│                 │    │                 │    │   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └──────────────│  GitLab API     │◀─────────────┘
                        │                 │
                        └─────────────────┘
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd gitlab-ai-reviewer
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
GITLAB_TOKEN=your_gitlab_access_token
DEEPSEEK_API_KEY=your_deepseek_api_key
GITLAB_PROJECT_ID=your_project_id
AI_PROVIDER=deepseek
```

### 3. Test Locally

```bash
# Run tests
npm test

# Test the reviewer (requires MR ID)
CI_MERGE_REQUEST_IID=123 npm start cli
```

### 4. Deploy to GitLab CI/CD

Add the `.gitlab-ci.yml` to your project and configure these GitLab CI/CD variables:

- `GITLAB_ACCESS_TOKEN`: GitLab access token with API permissions
- `DEEPSEEK_API_KEY`: DeepSeek API key for code review access

## 📋 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GITLAB_TOKEN` | GitLab access token | - | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API key | - | ✅ |
| `AI_PROVIDER` | AI provider to use | `deepseek` | ❌ |
| `GITLAB_URL` | GitLab instance URL | `https://gitlab.com` | ❌ |
| `DEEPSEEK_MODEL` | DeepSeek model to use | `deepseek-coder` | ❌ |
| `MAX_DIFF_SIZE` | Max diff size to review | `10000` | ❌ |
| `LOG_LEVEL` | Logging level | `info` | ❌ |

### Review Configuration

```env
# Enable/disable specific checks
ENABLE_SECURITY_CHECKS=true
ENABLE_PERFORMANCE_CHECKS=true
ENABLE_CODE_STYLE_CHECKS=true
ENABLE_BEST_PRACTICES_CHECKS=true
ENABLE_BUG_DETECTION=true

# File filtering
SKIP_FILES=package-lock.json,yarn.lock,*.min.js,dist/*
REVIEW_LANGUAGES=javascript,typescript,python,java,go,rust
```

## 🔧 Usage Modes

### 1. GitLab CI/CD Mode (Recommended)

The bot automatically triggers on merge request events:

```yaml
# .gitlab-ci.yml
ai_code_review:
  stage: review
  image: node:18-alpine
  script:
    - node src/index.js cli
  only:
    - merge_requests
```

### 2. Webhook Server Mode

Run as a persistent service to handle GitLab webhooks:

```bash
npm start
# Server runs on port 3000
# Webhook endpoint: POST /webhook
```

### 3. Manual CLI Mode

Review specific merge requests manually:

```bash
GITLAB_PROJECT_ID=123 CI_MERGE_REQUEST_IID=456 npm start cli
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
docker build -t gitlab-ai-reviewer .

# Run container
docker run -d \
  --name ai-reviewer \
  --env-file .env \
  -p 3000:3000 \
  gitlab-ai-reviewer
```

### Docker Compose

```yaml
version: '3.8'
services:
  ai-reviewer:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

## 📊 Review Output Example

The bot posts comprehensive reviews like this:

```markdown
## 🤖 AI Code Review

📊 **Review Summary:**
- **Files Reviewed:** 3
- **Total Issues:** 5
- **Critical Issues:** ⚠️ 1
- **Security Issues:** 🔒 1

### 📝 src/auth.js
*2 issue(s) found*

#### 🚨 CRITICAL Issues

**SECURITY** (Line 15)
SQL injection vulnerability detected in user authentication query.

*Suggestion:* Use parameterized queries or an ORM to prevent SQL injection.

#### ⚡ MEDIUM Issues

**PERFORMANCE** (Line 23)
Inefficient database query in loop may cause performance issues.

*Suggestion:* Consider using batch queries or pagination.
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔒 Security Considerations

- **Token Security**: Store GitLab and OpenAI tokens securely in CI/CD variables
- **Permissions**: Use minimal required permissions for GitLab tokens
- **Network**: Run in secure networks, use HTTPS for webhooks
- **Logging**: Avoid logging sensitive information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a merge request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Ensure all required environment variables are set
- Check `.env` file or CI/CD variables

**"Failed to get merge request"**
- Verify GitLab token has correct permissions
- Check project ID and merge request IID

**"AI service unavailable"**
- Verify OpenAI API key is valid
- Check API rate limits and quotas

**"No reviewable files found"**
- Check file type filters in configuration
- Verify diff size limits

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
```

### Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitLab Issues](https://gitlab.com/your-username/gitlab-ai-reviewer/-/issues)
- 📖 Documentation: [Wiki](https://gitlab.com/your-username/gitlab-ai-reviewer/-/wikis/home)

---

**Made with ❤️ for better code reviews**
