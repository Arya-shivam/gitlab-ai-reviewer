# 🚀 Simple Setup Guide - GitLab AI Reviewer

## What This Project Does
This AI bot automatically reviews your code when you create a merge request in GitLab. It finds bugs, security issues, and suggests improvements using **Grok-3-Beta AI** (FREE via OpenRouter!).

## 📋 What You Need Before Starting

1. **A GitLab account** (gitlab.com or your company's GitLab)
2. **A GitLab project** where you want AI code reviews
3. **Node.js installed** on your computer (version 18 or newer)
4. **Your OpenRouter API key** (already configured: `sk-or-v1-b6cb4078...`)

## 🎯 Step-by-Step Setup

### Step 1: Test the AI Connection
```bash
# Go to the project folder
cd gitlab-ai-reviewer

# Install required packages
npm install

# Test if OpenRouter/Grok AI is working
npm run test:openrouter
```

**Expected Result:** You should see "✅ OPENROUTER integration test completed successfully!"

---

### Step 2: Get Your GitLab Access Token

1. **Go to GitLab** → Click your profile picture (top right)
2. **Click "Edit Profile"**
3. **Click "Access Tokens"** (left sidebar)
4. **Create a new token:**
   - Name: `AI Reviewer Bot`
   - Expiration: Choose a date (1 year from now)
   - Scopes: Check these boxes:
     - ✅ `api`
     - ✅ `read_repository`
     - ✅ `write_repository`
5. **Click "Create personal access token"**
6. **COPY THE TOKEN** (it looks like: `glpat-xxxxxxxxxxxxxxxxxxxx`)
   - ⚠️ **IMPORTANT:** Save this token somewhere safe! You can't see it again.

---

### Step 3: Get Your GitLab Project ID

1. **Go to your GitLab project**
2. **Look at the URL** or **project homepage**
3. **Find the Project ID** (it's a number, like `12345`)
   - It's usually shown under the project name
   - Or in the URL: `gitlab.com/username/project-name/-/settings/general`

---

### Step 4: Configure GitLab CI/CD Variables

1. **Go to your GitLab project**
2. **Settings** → **CI/CD** → **Variables** → **Expand**
3. **Add these 2 variables:**

   **Variable 1:**
   - Key: `GITLAB_ACCESS_TOKEN`
   - Value: `glpat-xxxxxxxxxxxxxxxxxxxx` (your token from Step 2)
   - ✅ Check "Protected"
   - ✅ Check "Masked"
   - Click "Add variable"

   **Variable 2:**
   - Key: `OPENROUTER_API_KEY`
   - Value: `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`
   - ✅ Check "Protected"
   - ✅ Check "Masked"
   - Click "Add variable"

---

### Step 5: Add the AI Reviewer to Your Project

**Option A: If this IS your project folder:**
1. The `.gitlab-ci.yml` file is already here
2. Just commit and push it:
```bash
git add .gitlab-ci.yml
git commit -m "Add AI code reviewer"
git push
```

**Option B: If you want to add this to ANOTHER project:**
1. **Copy the `.gitlab-ci.yml` file** to your other project's root folder
2. **Edit the file** and change these lines (around line 50):
```yaml
# Change this line:
GITLAB_PROJECT_ID: $CI_PROJECT_ID

# To this (replace 12345 with your actual project ID):
GITLAB_PROJECT_ID: "12345"
```
3. **Commit and push:**
```bash
git add .gitlab-ci.yml
git commit -m "Add AI code reviewer"
git push
```

---

### Step 6: Test It!

1. **Create a new branch:**
```bash
git checkout -b test-ai-reviewer
```

2. **Make a small code change** (add a file or modify existing code):
```bash
# Create a test file
echo "function test() { console.log('hello'); }" > test.js
git add test.js
git commit -m "Add test function"
git push -u origin test-ai-reviewer
```

3. **Create a Merge Request:**
   - Go to your GitLab project
   - Click "Create merge request"
   - Source: `test-ai-reviewer`
   - Target: `main` (or `master`)
   - Click "Create merge request"

4. **Wait for the AI Review:**
   - Go to **CI/CD** → **Pipelines**
   - You should see a pipeline running
   - After 1-2 minutes, check your merge request
   - The AI bot should post a comment with code review!

---

## 🔧 Troubleshooting

### ❌ "GITLAB_TOKEN is required"
- Make sure you added `GITLAB_ACCESS_TOKEN` in Step 4
- Check the token has `api` permissions

### ❌ "OPENROUTER_API_KEY is required"
- Make sure you added `OPENROUTER_API_KEY` in Step 4
- The key should start with `sk-or-v1-`

### ❌ "Failed to get merge request"
- Check your Project ID is correct
- Make sure the GitLab token has access to your project

### ❌ Pipeline fails
- Go to **CI/CD** → **Pipelines** → Click the failed pipeline
- Check the logs to see what went wrong
- Most common issue: wrong project ID or missing variables

---

## 🎉 What Happens Next?

Once set up, the AI reviewer will:

1. **Automatically run** on every merge request
2. **Analyze your code** for:
   - 🔒 Security vulnerabilities
   - ⚡ Performance issues
   - 🐛 Potential bugs
   - 📝 Code quality improvements
3. **Post a comment** with detailed feedback
4. **Update the comment** if you make more changes

---

## 📞 Need Help?

**Common Questions:**

**Q: Where do I find my GitLab Project ID?**
A: Go to your project → Settings → General. It's shown at the top.

**Q: The AI isn't commenting on my merge request**
A: Check CI/CD → Pipelines. If the pipeline failed, click it to see the error.

**Q: Can I customize what the AI reviews?**
A: Yes! Edit the `.env` file to enable/disable different types of checks.

**Q: How much does this cost?**
A: OpenRouter with Grok-3-Beta is FREE! You get free credits to start with.

**Q: Can I use this with GitHub?**
A: This version is for GitLab only. A GitHub version would need different setup.

---

## 🎯 Quick Checklist

- [ ] Tested OpenRouter connection (`npm run test:openrouter`)
- [ ] Got GitLab access token
- [ ] Found GitLab project ID
- [ ] Added CI/CD variables (`GITLAB_ACCESS_TOKEN`, `OPENROUTER_API_KEY`)
- [ ] Added `.gitlab-ci.yml` to project
- [ ] Created test merge request
- [ ] AI bot posted review comment

**If all boxes are checked, you're done! 🎉**
