import fs from 'fs';
const content = fs.readFileSync('components/RegistrationsView.tsx', 'utf8');
const lines = content.split('\n');
// Truncate at line 804 (0-indexed is 804)
const cleanLines = lines.slice(0, 804);
fs.writeFileSync('components/RegistrationsView.tsx', cleanLines.join('\n'));
