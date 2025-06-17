/**
 * Diff Parser Utility
 * Parses Git diffs and extracts meaningful information for code review
 */

const { logger } = require('./logger');
const config = require('../config/config');

class DiffParser {
  /**
   * Parse GitLab merge request changes
   */
  static parseMergeRequestChanges(changes) {
    const parsedFiles = [];

    for (const change of changes.changes) {
      try {
        const parsedFile = this.parseFileChange(change);
        if (parsedFile) {
          parsedFiles.push(parsedFile);
        }
      } catch (error) {
        logger.error(`Failed to parse file change for ${change.new_path}:`, error);
      }
    }

    return parsedFiles;
  }

  /**
   * Parse individual file change
   */
  static parseFileChange(change) {
    const {
      old_path,
      new_path,
      new_file,
      deleted_file,
      renamed_file,
      diff,
    } = change;

    // Skip if no diff content
    if (!diff || diff.trim() === '') {
      logger.debug(`Skipping file with no diff: ${new_path}`);
      return null;
    }

    // Skip files based on configuration
    if (this.shouldSkipFile(new_path)) {
      logger.debug(`Skipping file based on configuration: ${new_path}`);
      return null;
    }

    // Check diff size
    if (diff.length > config.review.maxDiffSize) {
      logger.warn(`Diff too large for ${new_path}: ${diff.length} characters`);
      return {
        filename: new_path,
        language: this.detectLanguage(new_path),
        changeType: this.getChangeType(change),
        diff: '// Diff too large for review',
        tooLarge: true,
        size: diff.length,
      };
    }

    const language = this.detectLanguage(new_path);
    
    // Skip if language not supported
    if (!this.isLanguageSupported(language)) {
      logger.debug(`Skipping unsupported language: ${language} for ${new_path}`);
      return null;
    }

    return {
      filename: new_path,
      oldFilename: old_path,
      language,
      changeType: this.getChangeType(change),
      diff: this.cleanDiff(diff),
      additions: this.countAdditions(diff),
      deletions: this.countDeletions(diff),
      isNewFile: new_file,
      isDeletedFile: deleted_file,
      isRenamedFile: renamed_file,
      tooLarge: false,
    };
  }

  /**
   * Determine if file should be skipped
   */
  static shouldSkipFile(filename) {
    const skipPatterns = config.review.skipFiles;
    
    return skipPatterns.some(pattern => {
      // Handle glob patterns
      if (pattern.includes('*')) {
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
          'i'
        );
        return regex.test(filename);
      }
      
      // Exact match
      return filename === pattern || filename.endsWith(pattern);
    });
  }

  /**
   * Detect programming language from filename
   */
  static detectLanguage(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'cs': 'csharp',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'kt': 'kotlin',
      'swift': 'swift',
      'scala': 'scala',
      'dart': 'dart',
      'vue': 'javascript',
      'svelte': 'javascript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'ps1': 'powershell',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'dockerfile': 'dockerfile',
    };

    return languageMap[extension] || 'unknown';
  }

  /**
   * Check if language is supported for review
   */
  static isLanguageSupported(language) {
    return config.review.supportedLanguages.includes(language);
  }

  /**
   * Determine change type
   */
  static getChangeType(change) {
    if (change.new_file) return 'added';
    if (change.deleted_file) return 'deleted';
    if (change.renamed_file) return 'renamed';
    return 'modified';
  }

  /**
   * Clean diff content for better AI processing
   */
  static cleanDiff(diff) {
    // Remove binary file indicators
    if (diff.includes('Binary files differ')) {
      return '// Binary file - cannot review content';
    }

    // Split into lines and process
    const lines = diff.split('\n');
    const cleanedLines = [];

    for (const line of lines) {
      // Skip diff headers that are not useful for review
      if (line.startsWith('diff --git') || 
          line.startsWith('index ') ||
          line.startsWith('+++') ||
          line.startsWith('---')) {
        continue;
      }

      // Keep hunk headers but make them more readable
      if (line.startsWith('@@')) {
        cleanedLines.push(line);
        continue;
      }

      // Keep actual code changes
      if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
        cleanedLines.push(line);
      }
    }

    return cleanedLines.join('\n');
  }

  /**
   * Count additions in diff
   */
  static countAdditions(diff) {
    return (diff.match(/^\+(?!\+)/gm) || []).length;
  }

  /**
   * Count deletions in diff
   */
  static countDeletions(diff) {
    return (diff.match(/^-(?!-)/gm) || []).length;
  }

  /**
   * Extract added lines with line numbers
   */
  static extractAddedLines(diff) {
    const lines = diff.split('\n');
    const addedLines = [];
    let currentLineNumber = 0;
    let inHunk = false;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Parse hunk header to get starting line number
        const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
        if (match) {
          currentLineNumber = parseInt(match[1]) - 1;
          inHunk = true;
        }
        continue;
      }

      if (!inHunk) continue;

      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines.push({
          lineNumber: currentLineNumber + 1,
          content: line.substring(1), // Remove the '+' prefix
        });
      }

      // Update line number for context and additions
      if (line.startsWith(' ') || line.startsWith('+')) {
        currentLineNumber++;
      }
    }

    return addedLines;
  }

  /**
   * Get file statistics
   */
  static getFileStats(parsedFiles) {
    return {
      totalFiles: parsedFiles.length,
      newFiles: parsedFiles.filter(f => f.isNewFile).length,
      modifiedFiles: parsedFiles.filter(f => !f.isNewFile && !f.isDeletedFile).length,
      deletedFiles: parsedFiles.filter(f => f.isDeletedFile).length,
      totalAdditions: parsedFiles.reduce((sum, f) => sum + (f.additions || 0), 0),
      totalDeletions: parsedFiles.reduce((sum, f) => sum + (f.deletions || 0), 0),
      languageBreakdown: this.getLanguageBreakdown(parsedFiles),
    };
  }

  /**
   * Get language breakdown
   */
  static getLanguageBreakdown(parsedFiles) {
    const breakdown = {};
    
    for (const file of parsedFiles) {
      const lang = file.language;
      if (!breakdown[lang]) {
        breakdown[lang] = 0;
      }
      breakdown[lang]++;
    }

    return breakdown;
  }
}

module.exports = DiffParser;
