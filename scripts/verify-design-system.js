const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const FORBIDDEN_IMPORTS = [
  "@/components/ui/button",
  "@/components/ui/card",
  "@/components/ui/badge",
  "@/components/ui/input",
  "@/components/ui/select",
];

const ALLOWED_PATH_SEGMENTS = [
  path.join('src', 'components', 'design-system'),
  path.join('src', 'components', 'ui'),
];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function isAllowed(filePath) {
  return ALLOWED_PATH_SEGMENTS.some(segment => filePath.includes(segment));
}

function main() {
  const files = walk(SRC);
  const violations = [];

  for (const file of files) {
    if (isAllowed(file)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);

    FORBIDDEN_IMPORTS.forEach(forbidden => {
      const regex = new RegExp(`from ['\"]${forbidden}['\"]`, 'g');
      if (regex.test(content)) {
        violations.push(`${rel} -> ${forbidden}`);
      }
    });
  }

  if (violations.length > 0) {
    console.error('\n[ui:check] Violaciones de estandar de Design System detectadas:\n');
    violations.forEach(v => console.error(`- ${v}`));
    console.error('\nUsa componentes de @/components/design-system en lugar de ui/* directo.\n');
    process.exit(1);
  }

  console.log('[ui:check] OK. Todas las pantallas usan el Design System como base.');
}

main();
