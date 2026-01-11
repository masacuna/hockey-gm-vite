import fs from 'fs';
import path from 'path';

console.log('🏒 Starting Hockey GM migration to Vite...\n');

// Try to find the HTML file
let htmlContent;
let foundFile = false;

// Check if temp/index-standalone.html exists
if (fs.existsSync('temp/index-standalone.html')) {
    const stats = fs.statSync('temp/index-standalone.html');
    if (stats.isFile()) {
        console.log('📂 Found: temp/index-standalone.html');
        htmlContent = fs.readFileSync('temp/index-standalone.html', 'utf-8');
        foundFile = true;
    }
}

if (!foundFile) {
    console.log('❌ Could not find HTML file!');
    console.log('\n🔍 Please check that temp/index-standalone.html exists');
    console.log('Current directory:', process.cwd());
    process.exit(1);
}

// Extract CSS
console.log('📝 Step 1: Extracting CSS...');
const cssMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
    fs.writeFileSync('src/App.css', cssMatch[1]);
    console.log('✅ CSS extracted to src/App.css');
}

// Extract JavaScript
console.log('📝 Step 2: Extracting JavaScript...');
const jsMatch = htmlContent.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (jsMatch) {
    let js = jsMatch[1];
    
    // Remove React rendering lines at the end
    const lines = js.split('\n');
    const filteredLines = [];
    let skipRemaining = false;
    
    for (let line of lines) {
        if (line.includes('const root = ReactDOM.createRoot') || 
            line.includes('root.render') ||
            (line.includes('requestIdleCallback') && line.includes('initializeGame')) ||
            line.includes('updateLoadingText') ||
            line.includes('hideLoadingScreen')) {
            skipRemaining = true;
        }
        if (!skipRemaining) {
            filteredLines.push(line);
        }
    }
    
    js = filteredLines.join('\n');
    
    // Add imports and export
    const finalJs = `import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';

${js}

export default HockeyGM;`;
    
    fs.writeFileSync('src/App.jsx', finalJs);
    console.log('✅ JavaScript extracted to src/App.jsx');
}

// Update index.html
console.log('📝 Step 3: Updating index.html...');
const newIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>North American Hockey League - GM Simulator</title>
    
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-C8YX6ERT5J"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-C8YX6ERT5J');
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

fs.writeFileSync('index.html', newIndexHtml);
console.log('✅ index.html updated');

// Update vite.config.js
console.log('📝 Step 4: Updating vite.config.js...');
const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hockey-gm/',
})
`;

fs.writeFileSync('vite.config.js', viteConfig);
console.log('✅ vite.config.js updated');

console.log('\n🎉 Migration complete!');
console.log('Check http://localhost:5173/ in your browser\n');