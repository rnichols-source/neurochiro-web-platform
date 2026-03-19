const fs = require('fs');
const path = require('path');

// Target directory to scan
const appDir = path.join(__dirname, '../src/app');

// Regex patterns to find links and buttons
const linkRegex = /<Link[^>]*href=["']([^"']+)["'][^>]*>/g;
const buttonRegex = /<button[^>]*onClick=\{([^}]+)\}[^>]*>/g;
const formRegex = /<form[^>]*action=\{([^}]+)\}[^>]*>/g;
const onClickRegex = /onClick=\{([^}]+)\}/g;
const aTagRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/g;

// To store all found routes
const validRoutes = new Set();
const routeAliases = new Map();

// Helper to recursively walk directories
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// 1. Build the Route Map
console.log("🗺️  Mapping valid routes...");
walkDir(appDir, (filePath) => {
  if (path.basename(filePath) === 'page.tsx') {
    // Extract route from path
    let route = filePath.replace(appDir, '').replace(/\/page\.tsx$/, '');
    
    // Handle dynamic routes and route groups
    route = route.replace(/\/\([^)]+\)/g, ''); // Remove (group) folders
    if (route === '') route = '/';
    
    // Store exact static route
    if (!route.includes('[')) {
      validRoutes.add(route);
    }
    
    // Store generic pattern for dynamic routes
    if (route.includes('[')) {
      const genericRoute = route.replace(/\[[^\]]+\]/g, ':param');
      validRoutes.add(genericRoute);
    }
  }
});

// Add some known external/special routes
validRoutes.add('#');
validRoutes.add('mailto:');
validRoutes.add('tel:');
validRoutes.add('http');
validRoutes.add('https');

// Helper to check if a route is valid
function isValidRoute(href) {
  if (!href) return false;
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return true;
  
  // Remove query params and hashes for checking
  const baseHref = href.split('?')[0].split('#')[0];
  
  if (validRoutes.has(baseHref)) return true;
  
  // Check if it matches a dynamic route
  const parts = baseHref.split('/');
  for (let valid of validRoutes) {
    const validParts = valid.split('/');
    if (parts.length === validParts.length) {
      let match = true;
      for (let i = 0; i < parts.length; i++) {
        if (validParts[i] !== ':param' && validParts[i] !== parts[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }
  return false;
}

// 2. Scan for Issues
console.log("🔍 Scanning for dead links and unhandled interactions...\n");
let totalFiles = 0;
let issues = [];

walkDir(appDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  totalFiles++;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(path.join(__dirname, '../'), '');

  // Check <Link> components
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    // Ignore variables or template literals for static analysis
    if (!href.includes('$') && !href.startsWith('{') && !isValidRoute(href)) {
      issues.push({ file: relativePath, type: 'Broken <Link>', details: `href="${href}" points to non-existent route.` });
    }
  }

  // Check standard <a> tags (which should usually be <Link> in Next.js)
  while ((match = aTagRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('/') && !href.startsWith('/api')) {
       issues.push({ file: relativePath, type: 'Warning: <a> tag used for internal link', details: `Consider using <Link> for href="${href}" for SPA routing.` });
    }
  }

  // Check buttons without handlers or types
  const buttonMatches = content.match(/<button[^>]*>/g) || [];
  buttonMatches.forEach(btn => {
    // Buttons should have either an onClick or be type="submit" inside a form
    if (!btn.includes('onClick') && !btn.includes('type="submit"')) {
      // Exclude specific UI library buttons that might use different prop names
      if (!btn.includes('asChild') && !btn.includes('value=')) {
         issues.push({ file: relativePath, type: 'Dead Button', details: `Found <button> with no onClick handler and no type="submit". It might do nothing.` });
      }
    }
  });

  // Check for empty or console.log only onClick handlers (placeholder actions)
  while ((match = onClickRegex.exec(content)) !== null) {
    const handler = match[1].trim();
    if (handler === '() => {}' || handler.includes('console.log(')) {
      issues.push({ file: relativePath, type: 'Placeholder Action', details: `Found onClick={${handler}}. Action is not implemented.` });
    }
  }
});

// 3. Report Results
if (issues.length > 0) {
  console.log(`❌ Found ${issues.length} potential issues across ${totalFiles} files:\n`);
  
  // Group by file
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([file, fileIssues]) => {
    console.log(`📄 ${file}`);
    fileIssues.forEach(i => {
      console.log(`   - [${i.type}] ${i.details}`);
    });
    console.log('');
  });
} else {
  console.log(`✅ Scanned ${totalFiles} files. No static dead links or placeholder buttons found.`);
}
