const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/AttendanceTracker.jsx',
  'src/pages/CertificatesDashboard.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/FormBuilderDashboard.jsx',
  'src/pages/FormResponses.jsx',
  'src/pages/InvoiceHistory.jsx'
];

filesToUpdate.forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Find <input type="text" placeholder="Search..." className="..."
  // We want to replace the `className="..."` string for inputs that have placeholders containing "Search"
  
  // Regex to match the input element with a placeholder starting with "Search"
  const regex = /(<input[^>]*placeholder="Search[^"]*"[^>]*className=")([^"]*)("[^>]*>)/g;
  
  content = content.replace(regex, (match, p1, oldClasses, p3) => {
    // If it already uses search-input, skip
    if (oldClasses.includes('search-input')) return match;
    
    // Replace the old tailwind classes with our new dedicated class
    return `${p1}search-input${p3}`;
  });
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated: ${relativePath}`);
});
