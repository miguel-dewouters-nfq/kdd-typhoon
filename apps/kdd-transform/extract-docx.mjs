// Quick docx text extractor using only built-in Node.js modules
import { execSync } from 'child_process';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const docxPath = process.argv[2];
if (!docxPath) { console.error('Usage: node extract-docx.mjs <file.docx>'); process.exit(1); }

const tmpDir = mkdtempSync(join(tmpdir(), 'docx-'));
try {
  // Expand-Archive only works with .zip; copy with .zip extension first
  const zipPath = docxPath.replace(/\.[^.]+$/, '.zip');
  const tmpZip = join(tmpDir, '_doc.zip');
  execSync(`powershell -Command "Copy-Item -Path '${docxPath}' -Destination '${tmpZip}'"`, { stdio: 'pipe' });
  execSync(`powershell -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${tmpDir}' -Force"`, { stdio: 'pipe' });
  const xml = readFileSync(join(tmpDir, 'word', 'document.xml'), 'utf-8');

  // Extract text preserving structure
  const text = xml
    .replace(/<w:br[^/]*/g, '\n')  // line breaks
    .replace(/<\/w:p>/g, '\n')      // paragraph ends
    .replace(/<\/w:tr>/g, '\n')     // table row ends
    .replace(/<\/w:tc>/g, '\t')     // table cell ends
    .replace(/<[^>]+>/g, '')        // remove all remaining tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x[0-9A-Fa-f]+;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) { console.error('No text extracted!'); } else { console.log(text); }
} catch(err2) {
  console.error('Inner error:', err2.message);
} finally {
  rmSync(tmpDir, { recursive: true });
}



