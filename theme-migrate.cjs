const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Background Hexes
  { regex: /bg-\[\#0B0F19\]/g, replace: 'bg-black' },
  { regex: /#0B0F19/g, replace: '#000000' },
  { regex: /#131726/g, replace: '#111111' },
  { regex: /#1E243D/g, replace: '#1A1A1A' },
  { regex: /#2D334A/g, replace: '#222222' },
  { regex: /#1A1F36/g, replace: '#1A1A1A' },
  { regex: /#161B2E/g, replace: '#161616' },

  // Gradients and Accents
  { regex: /from-violet-600/g, replace: 'from-yellow-400' },
  { regex: /to-blue-600/g, replace: 'to-yellow-500' },
  { regex: /from-violet-400/g, replace: 'from-yellow-300' },
  { regex: /to-blue-400/g, replace: 'to-yellow-400' },
  { regex: /hover:from-violet-500/g, replace: 'hover:from-yellow-300' },
  { regex: /hover:to-blue-500/g, replace: 'hover:to-yellow-400' },

  // Slate to Gray
  { regex: /slate-/g, replace: 'gray-' },

  // Primary colors to Yellow
  { regex: /violet-600/g, replace: 'yellow-500' },
  { regex: /violet-500/g, replace: 'yellow-500' },
  { regex: /violet-400/g, replace: 'yellow-400' },
  { regex: /violet-300/g, replace: 'yellow-300' },
  { regex: /blue-600/g, replace: 'yellow-500' },
  { regex: /blue-500/g, replace: 'yellow-500' },
  { regex: /blue-400/g, replace: 'yellow-400' },
  { regex: /blue-300/g, replace: 'yellow-300' },
  { regex: /emerald-600/g, replace: 'yellow-500' },
  { regex: /emerald-500/g, replace: 'yellow-500' },
  { regex: /emerald-400/g, replace: 'yellow-400' },
  { regex: /emerald-300/g, replace: 'yellow-300' },
  { regex: /amber-600/g, replace: 'yellow-500' },
  { regex: /amber-500/g, replace: 'yellow-500' },
  { regex: /amber-400/g, replace: 'yellow-400' },
  { regex: /amber-300/g, replace: 'yellow-300' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && /\.(jsx|js)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replace } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Theme migration complete.');
