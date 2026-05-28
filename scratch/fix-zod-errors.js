const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../mes-wms-beras/app/api');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(targetDir);
let count = 0;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('parsed.error.errors[0].message')) {
    const updated = content.replace(/parsed\.error\.errors\[0\]\.message/g, 'parsed.error.issues[0].message');
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`Updated: ${path.relative(targetDir, file)}`);
    count++;
  }
});

console.log(`Successfully fixed Zod error syntax in ${count} files.`);
