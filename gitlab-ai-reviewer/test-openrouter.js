#!/usr/bin/env node

/**
 * Test script to verify OpenRouter API integration
 * Run this to test if your OpenRouter API key is working correctly
 */

require('dotenv').config();
const AIService = require('./src/services/ai-service');
const { logger } = require('./src/utils/logger');

async function testOpenRouterIntegration() {
  try {
    const provider = process.env.AI_PROVIDER || 'openrouter';
    console.log(`🤖 Testing ${provider.toUpperCase()} API Integration...\n`);
    
    // Check if API key is configured based on provider
    let apiKeyEnvVar, apiKey, model, baseUrl;
    
    if (provider === 'openrouter') {
      apiKeyEnvVar = 'OPENROUTER_API_KEY';
      apiKey = process.env.OPENROUTER_API_KEY;
      model = process.env.OPENROUTER_MODEL || 'x-ai/grok-3-beta';
      baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    } else if (provider === 'deepseek') {
      apiKeyEnvVar = 'DEEPSEEK_API_KEY';
      apiKey = process.env.DEEPSEEK_API_KEY;
      model = process.env.DEEPSEEK_MODEL || 'deepseek-coder';
      baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    } else {
      apiKeyEnvVar = 'OPENAI_API_KEY';
      apiKey = process.env.OPENAI_API_KEY;
      model = process.env.AI_MODEL || 'gpt-4';
      baseUrl = 'https://api.openai.com/v1';
    }
    
    if (!apiKey) {
      console.error(`❌ ${apiKeyEnvVar} not found in environment variables`);
      console.log(`Please set ${apiKeyEnvVar} in your .env file`);
      process.exit(1);
    }
    
    console.log(`✅ ${provider.toUpperCase()} API key found`);
    console.log(`🔧 Provider: ${provider}`);
    console.log(`🎯 Model: ${model}`);
    console.log(`🌐 Base URL: ${baseUrl}`);
    
    if (provider === 'openrouter') {
      console.log(`🏷️ Site Name: ${process.env.OPENROUTER_SITE_NAME || 'GitLab AI Reviewer'}`);
      console.log(`🔗 Site URL: ${process.env.OPENROUTER_SITE_URL || 'https://gitlab-ai-reviewer.com'}`);
    }
    console.log('');
    
    // Initialize AI service
    const aiService = new AIService();
    console.log('✅ AI Service initialized\n');
    
    // Test with a simple code review
    const testCode = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
`;
    
    const testDiff = `@@ -1,7 +1,7 @@
 function calculateTotal(items) {
-  var total = 0;
+  let total = 0;
   for (var i = 0; i < items.length; i++) {
     total += items[i].price;
   }
   return total;
 }`;
    
    console.log('🔍 Testing code review with sample JavaScript code...');
    console.log('📝 Sample diff:');
    console.log(testDiff);
    console.log(`\n⏳ Sending request to ${provider.toUpperCase()} API (${model})...\n`);
    
    const startTime = Date.now();
    
    const review = await aiService.reviewCode(
      'test.js',
      'javascript',
      testDiff,
      { description: 'Test code review with OpenRouter/Grok' }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`🎉 Success! ${provider.toUpperCase()} API responded in ${duration}ms\n`);
    
    console.log('📋 Review Results:');
    console.log('================');
    console.log('Summary:', review.summary);
    console.log('Issues found:', review.issues.length);
    
    if (review.issues.length > 0) {
      console.log('\n🔍 Issues:');
      review.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type} (${issue.severity})`);
        console.log(`   Description: ${issue.description}`);
        if (issue.suggestion) {
          console.log(`   Suggestion: ${issue.suggestion}`);
        }
        if (issue.line) {
          console.log(`   Line: ${issue.line}`);
        }
      });
    }
    
    console.log(`\n✅ ${provider.toUpperCase()} integration test completed successfully!`);
    if (provider === 'openrouter') {
      console.log('🚀 Your AI reviewer is now powered by Grok-3-Beta via OpenRouter (FREE!)');
      console.log('💡 Grok is great for code review with its reasoning capabilities');
    } else {
      console.log(`🚀 Your AI reviewer is ready to use with ${model}.`);
    }
    
  } catch (error) {
    console.error(`\n❌ ${process.env.AI_PROVIDER?.toUpperCase() || 'AI'} integration test failed:`);
    console.error('Error:', error.message);
    
    if (error.message.includes('401')) {
      console.error('\n🔑 This looks like an authentication error.');
      console.error('Please check your API key is correct.');
    } else if (error.message.includes('429')) {
      console.error('\n⏰ Rate limit exceeded. Please try again later.');
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      console.error('\n🌐 Network error. Please check your internet connection.');
    } else if (error.message.includes('model')) {
      console.error('\n🎯 Model error. The specified model might not be available.');
      console.error('Try using a different model or check OpenRouter model availability.');
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify your API key is correct');
    console.error('2. Check your internet connection');
    console.error('3. Ensure the API service is available');
    console.error('4. Check if you have sufficient API credits');
    if (process.env.AI_PROVIDER === 'openrouter') {
      console.error('5. Verify the model "x-ai/grok-3-beta" is available on OpenRouter');
      console.error('6. Check OpenRouter status at: https://openrouter.ai/status');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testOpenRouterIntegration();
}

module.exports = testOpenRouterIntegration;
