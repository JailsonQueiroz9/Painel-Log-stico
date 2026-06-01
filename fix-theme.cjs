const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-slate-950/g, 'bg-slate-50 dark:bg-slate-950');
  content = content.replace(/bg-slate-900/g, 'bg-white dark:bg-slate-900');
  content = content.replace(/bg-slate-800/g, 'bg-slate-100 dark:bg-slate-800');
  
  // Borders
  content = content.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');
  content = content.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
  content = content.replace(/border-slate-800/g, 'border-slate-200 dark:border-slate-800');
  content = content.replace(/border-slate-900/g, 'border-slate-200 dark:border-slate-900');

  // Text colors (only if not inside a button or specific elements, but regex is hard. Let's just do it and fix buttons later)
  // Actually, we can replace text-white with text-slate-900 dark:text-white
  // But we should NOT replace it if it's preceded by bg-primary-600 or similar.
  // A safer approach: replace text-white with text-slate-900 dark:text-white everywhere,
  // then revert it for buttons.
  content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
  
  // Muted text
  content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
  content = content.replace(/text-slate-200/g, 'text-slate-700 dark:text-slate-200');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir('./components');
processFile('./App.tsx');
