# 🤖 GitLab AI Reviewer - Project Overview

## 📁 Project Structure

```
gitlab-ai-reviewer/
├── 📄 README.md                    # Main documentation
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitlab-ci.yml               # GitLab CI/CD pipeline
├── 📄 Dockerfile                   # Docker container configuration
├── 📄 docker-compose.yml           # Multi-container setup
├── 📄 nginx.conf                   # Nginx reverse proxy config
├── 📄 jest.config.js               # Test configuration
├── 📄 .eslintrc.js                 # Code linting rules
├── 📄 CHANGELOG.md                 # Version history
├── 📄 LICENSE                      # MIT license
├── 📁 src/                         # Source code
│   ├── 📄 index.js                 # Main entry point
│   ├── 📄 reviewer.js              # Core review logic
│   ├── 📁 config/
│   │   └── 📄 config.js            # Configuration management
│   ├── 📁 services/
│   │   ├── 📄 gitlab-api.js        # GitLab API integration
│   │   └── 📄 ai-service.js        # AI service integration
│   └── 📁 utils/
│       ├── 📄 logger.js            # Logging utility
│       └── 📄 diff-parser.js       # Git diff parsing
├── 📁 tests/                       # Test files
│   ├── 📄 setup.js                 # Test configuration
│   └── 📄 reviewer.test.js         # Main test suite
├── 📁 scripts/                     # Utility scripts
│   └── 📄 setup.sh                 # Setup automation script
└── 📁 examples/                    # Example configurations
    └── 📄 gitlab-ci-integration.yml # CI/CD examples
```

## 🔧 Core Components

### 1. **Main Entry Point** (`src/index.js`)
- Handles both CLI and webhook server modes
- Processes GitLab webhook events
- Manages application lifecycle and error handling

### 2. **Review Engine** (`src/reviewer.js`)
- Orchestrates the entire review process
- Manages file parsing and AI analysis
- Generates and posts review comments

### 3. **GitLab Integration** (`src/services/gitlab-api.js`)
- Handles all GitLab API interactions
- Fetches merge request data and changes
- Posts and updates review comments

### 4. **AI Service** (`src/services/ai-service.js`)
- Integrates with OpenAI GPT-4
- Processes code diffs for review
- Generates structured feedback

### 5. **Diff Parser** (`src/utils/diff-parser.js`)
- Parses Git diffs into analyzable format
- Filters files based on configuration
- Extracts meaningful code changes

## 🚀 Deployment Options

### 1. **GitLab CI/CD Integration** (Recommended)
```yaml
ai_code_review:
  stage: review
  image: node:18-alpine
  script:
    - node src/index.js cli
  only:
    - merge_requests
```

### 2. **Docker Container**
```bash
docker build -t gitlab-ai-reviewer .
docker run -d --env-file .env -p 3000:3000 gitlab-ai-reviewer
```

### 3. **Docker Compose**
```bash
docker-compose up -d
```

### 4. **Webhook Server**
```bash
npm start
# Listens on port 3000 for GitLab webhooks
```

## ⚙️ Configuration

### Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| `GITLAB_TOKEN` | GitLab API access | ✅ |
| `OPENAI_API_KEY` | AI service access | ✅ |
| `GITLAB_PROJECT_ID` | Target project | ✅ |
| `AI_MODEL` | AI model selection | ❌ |
| `LOG_LEVEL` | Logging verbosity | ❌ |

### Review Settings
- **Security Checks**: SQL injection, XSS, auth issues
- **Performance**: Algorithm efficiency, memory usage
- **Code Style**: Formatting, naming conventions
- **Best Practices**: Language-specific patterns
- **Bug Detection**: Logic errors, edge cases

## 🔄 Workflow

1. **Trigger**: Merge request created/updated
2. **Fetch**: Get MR details and file changes
3. **Parse**: Extract reviewable code diffs
4. **Analyze**: Send to AI for review
5. **Process**: Parse AI response into issues
6. **Comment**: Post structured feedback on MR

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 📊 Features

### ✅ Implemented
- Multi-language code review
- Security vulnerability detection
- Performance issue identification
- GitLab CI/CD integration
- Docker containerization
- Webhook server mode
- Comprehensive logging
- Error handling and recovery
- Test suite with coverage
- Documentation and examples

### 🔄 Planned
- Additional AI providers (Anthropic, Google)
- GitHub/Bitbucket support
- Custom review templates
- Metrics dashboard
- Slack/Teams notifications
- Advanced caching
- Plugin system

## 🔒 Security

- Secure token handling
- Input validation
- Rate limiting
- Non-root container execution
- HTTPS enforcement
- Security headers

## 📈 Performance

- Efficient diff parsing
- Configurable file filtering
- Rate limiting compliance
- Memory-optimized processing
- Async/await patterns
- Error recovery mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit merge request

## 📞 Support

- **Documentation**: README.md and inline comments
- **Examples**: `examples/` directory
- **Setup**: `scripts/setup.sh` automation
- **Testing**: Comprehensive test suite
- **Troubleshooting**: Common issues in README

## 🎯 Use Cases

### Development Teams
- Automated code quality checks
- Security vulnerability detection
- Performance optimization suggestions
- Consistent review standards

### Educational Projects
- Learning best practices
- Understanding security issues
- Code quality improvement
- Automated feedback

### Open Source Projects
- Contributor onboarding
- Maintaining code standards
- Reducing review burden
- Consistent feedback

## 🏆 Benefits

- **Time Saving**: Automated initial review
- **Consistency**: Same standards across all reviews
- **Education**: Learn from AI feedback
- **Quality**: Catch issues early
- **Security**: Identify vulnerabilities
- **Performance**: Optimize code efficiency

---

**Ready to improve your code review process? Start with the setup script:**

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```
