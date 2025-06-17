#!/bin/bash

# GitLab AI Reviewer Setup Script
# This script helps set up the AI reviewer in your GitLab project

set -e

echo "🤖 GitLab AI Reviewer Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git."
        exit 1
    fi
    
    print_status "All requirements met"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
}

# Setup environment file
setup_environment() {
    print_info "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file with your configuration before running the bot"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Setup GitLab CI/CD variables
setup_gitlab_variables() {
    print_info "GitLab CI/CD Variables Setup"
    echo "You need to set these variables in your GitLab project:"
    echo "Settings > CI/CD > Variables"
    echo ""
    echo "Required variables:"
    echo "- GITLAB_ACCESS_TOKEN: Your GitLab access token"
    echo "- OPENAI_API_KEY: Your OpenAI API key"
    echo ""
    echo "Optional variables:"
    echo "- AI_MODEL: AI model to use (default: gpt-4)"
    echo "- LOG_LEVEL: Logging level (default: info)"
    echo "- MAX_DIFF_SIZE: Maximum diff size to review (default: 10000)"
    echo ""
}

# Create GitLab access token instructions
create_token_instructions() {
    print_info "Creating GitLab Access Token"
    echo "1. Go to GitLab > User Settings > Access Tokens"
    echo "2. Create a new token with these scopes:"
    echo "   - api (to access GitLab API)"
    echo "   - read_repository (to read repository content)"
    echo "   - write_repository (to post comments)"
    echo "3. Copy the token and add it to your CI/CD variables as GITLAB_ACCESS_TOKEN"
    echo ""
}

# Test the setup
test_setup() {
    print_info "Testing setup..."
    
    # Run linting
    if npm run lint; then
        print_status "Linting passed"
    else
        print_error "Linting failed"
        return 1
    fi
    
    # Run tests
    if npm test; then
        print_status "Tests passed"
    else
        print_error "Tests failed"
        return 1
    fi
    
    print_status "Setup test completed successfully"
}

# Main setup function
main() {
    echo ""
    print_info "Starting setup process..."
    echo ""
    
    check_requirements
    install_dependencies
    setup_environment
    
    echo ""
    print_info "Running tests..."
    if test_setup; then
        echo ""
        print_status "Setup completed successfully!"
        echo ""
        print_info "Next steps:"
        echo "1. Edit the .env file with your configuration"
        echo "2. Set up GitLab CI/CD variables (see instructions below)"
        echo "3. Commit and push the .gitlab-ci.yml file to your repository"
        echo "4. Create a merge request to test the AI reviewer"
        echo ""
        setup_gitlab_variables
        echo ""
        create_token_instructions
    else
        print_error "Setup failed during testing phase"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "test")
        test_setup
        ;;
    "env")
        setup_environment
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no command)  Run full setup"
        echo "  test          Run tests only"
        echo "  env           Setup environment file only"
        echo "  help          Show this help"
        ;;
    *)
        main
        ;;
esac
