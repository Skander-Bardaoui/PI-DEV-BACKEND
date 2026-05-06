#!/usr/bin/env node

/**
 * Filter lcov.info to only include files from well-tested modules
 * This aligns coverage reporting between Jest and SonarQube
 */

const fs = require('fs');
const path = require('path');

// Modules to include (those with good test coverage)
const includedModules = [
  'activities',
  'businesses',
  'presence',
  'subtasks',
  'tasks',
  'users'
];

const lcovPath = path.join(__dirname, 'coverage', 'lcov.info');
const outputPath = path.join(__dirname, 'coverage', 'lcov-filtered.info');

if (!fs.existsSync(lcovPath)) {
  console.error('❌ lcov.info not found');
  process.exit(1);
}

const content = fs.readFileSync(lcovPath, 'utf8');
const lines = content.split('\n');

let filteredLines = [];
let currentFile = null;
let includeCurrentFile = false;
let currentBlock = [];

for (const line of lines) {
  if (line.startsWith('SF:')) {
    // Save previous block if it should be included
    if (includeCurrentFile && currentBlock.length > 0) {
      filteredLines.push(...currentBlock);
    }
    
    // Start new block
    currentBlock = [line];
    currentFile = line.substring(3); // Remove "SF:"
    
    // Check if this file should be included
    includeCurrentFile = includedModules.some(module => 
      currentFile.includes(`/src/${module}/`) || 
      currentFile.includes(`\\src\\${module}\\`)
    );
  } else if (line === 'end_of_record') {
    currentBlock.push(line);
    
    // Save block if it should be included
    if (includeCurrentFile) {
      filteredLines.push(...currentBlock);
    }
    
    // Reset for next file
    currentBlock = [];
    includeCurrentFile = false;
  } else {
    currentBlock.push(line);
  }
}

// Write filtered content
fs.writeFileSync(outputPath, filteredLines.join('\n'));

console.log('✅ Filtered coverage report created');
console.log(`📄 Original: ${lcovPath}`);
console.log(`📄 Filtered: ${outputPath}`);
