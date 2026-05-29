/**
 * Fix: metadata cannot be exported from 'use client' components in Next.js 16.
 *
 * This script splits each page.tsx into:
 *   page.tsx        → Server Component (exports metadata + renders client component)
 *   <Name>Client.tsx → Client Component (original content minus metadata)
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

const files: string[] = [
  './src/app/(protected)/collections/[id]/edit/page.tsx',
  './src/app/(protected)/reposts/page.tsx',
  './src/app/(public)/contact/page.tsx',
  './src/app/(public)/contacto/page.tsx',
  './src/app/(public)/help/page.tsx',
  './src/app/(public)/report/page.tsx',
  './src/app/(public)/sobre-nosotros/page.tsx',
  './src/app/admin/achievements/page.tsx',
  './src/app/admin/analytics/anomalies/page.tsx',
  './src/app/admin/announcements/page.tsx',
  './src/app/admin/audit-log/page.tsx',
  './src/app/admin/audit-logs/page.tsx',
  './src/app/admin/bans/page.tsx',
  './src/app/admin/chapters/[id]/page.tsx',
  './src/app/admin/chapters/page.tsx',
  './src/app/admin/clans/page.tsx',
  './src/app/admin/comments/page.tsx',
  './src/app/admin/crowdfunding/page.tsx',
  './src/app/admin/csp-reports/page.tsx',
  './src/app/admin/dmca/page.tsx',
  './src/app/admin/email-templates/page.tsx',
  './src/app/admin/export/page.tsx',
  './src/app/admin/forum/page.tsx',
  './src/app/admin/genres/page.tsx',
  './src/app/admin/health/page.tsx',
  './src/app/admin/impersonate/page.tsx',
  './src/app/admin/kyc/page.tsx',
  './src/app/admin/manga/[slug]/page.tsx',
  './src/app/admin/manga/page.tsx',
  './src/app/admin/news/page.tsx',
  './src/app/admin/page.tsx',
  './src/app/admin/restore/page.tsx',
  './src/app/admin/roles/page.tsx',
  './src/app/admin/search-analytics/page.tsx',
  './src/app/admin/settings/page.tsx',
  './src/app/admin/subscriptions/page.tsx',
  './src/app/admin/tags/page.tsx',
  './src/app/admin/users/[slug]/page.tsx',
  './src/app/admin/users/page.tsx',
  './src/app/analytics/page.tsx',
  './src/app/analytics/signup/page.tsx',
  './src/app/auth/error/page.tsx',
  './src/app/auth/forgot-password/page.tsx',
  './src/app/auth/login/page.tsx',
  './src/app/auth/register/page.tsx',
  './src/app/auth/reset-password/page.tsx',
  './src/app/checkout/cancel/page.tsx',
  './src/app/checkout/page.tsx',
  './src/app/checkout/success/page.tsx',
  './src/app/community/clans/create/page.tsx',
  './src/app/community/rules/page.tsx',
  './src/app/creator/community/page.tsx',
  './src/app/creator/dashboard/page.tsx',
  './src/app/creator/manga/[slug]/chapter/[chapterId]/edit/page.tsx',
  './src/app/creator/manga/[slug]/edit/page.tsx',
  './src/app/creator/manga/[slug]/page.tsx',
  './src/app/creator/manga/new/page.tsx',
  './src/app/creator/manga/page.tsx',
  './src/app/creator/settings/page.tsx',
  './src/app/creator/trash/page.tsx',
  './src/app/creator/upload/page.tsx',
  './src/app/explore/page.tsx',
  './src/app/library/page.tsx',
  './src/app/notifications/page.tsx',
  './src/app/offline/page.tsx',
  './src/app/prompts/page.tsx',
  './src/app/reader/[slug]/page.tsx',
  './src/app/search_advanced/page.tsx',
  './src/app/search_ia/page.tsx',
  './src/app/share-target/page.tsx',
];

/**
 * Find the closing `};` for a metadata export block.
 * Starts searching from the opening `{` of `export const metadata: Metadata = {`.
 */
function findMetadataBlock(content: string): { start: number; end: number; text: string } | null {
  const pattern = /export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{/;
  const match = pattern.exec(content);
  if (!match) return null;

  const blockStart = match.index;
  // The opening brace is at the end of the match
  const bracePos = match.index + match[0].length - 1; // position of '{'
  
  let depth = 0;
  let pos = bracePos;
  while (pos < content.length) {
    const ch = content[pos];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0 && ch === '}') {
      // Check for trailing semicolon
      let end = pos + 1;
      while (end < content.length && /\s/.test(content[end])) end++;
      if (content[end] === ';') end++;
      return {
        start: blockStart,
        end,
        text: content.slice(blockStart, end),
      };
    }
    pos++;
  }
  return null;
}

/**
 * Remove the `import type { Metadata } from 'next';` line from content.
 * Handles variations with optional trailing semicolons and whitespace.
 */
function removeMetadataImport(content: string): string {
  // Remove standalone import line
  let result = content.replace(
    /import\s+type\s*\{\s*Metadata\s*\}\s*from\s*['"]next['"]\s*;?\s*\n/g,
    ''
  );
  // Also handle case where it's not a type import
  result = result.replace(
    /import\s*\{\s*Metadata\s*\}\s*from\s*['"]next['"]\s*;?\s*\n/g,
    ''
  );
  return result;
}

/**
 * Extract the default export function name.
 */
function getDefaultExportName(content: string): string | null {
  const match = content.match(/export\s+default\s+function\s+(\w+)/);
  return match ? match[1] : null;
}

function fixFile(filePath: string): boolean {
  const fullPath = path.resolve(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  const metadataBlock = findMetadataBlock(content);
  if (!metadataBlock) {
    console.log(`⚠️  No metadata block found in: ${filePath}`);
    return false;
  }

  const fnName = getDefaultExportName(content);
  if (!fnName) {
    console.log(`⚠️  No default export found in: ${filePath}`);
    return false;
  }

  const dir = path.dirname(fullPath);
  const clientFnName = fnName.replace(/Page$/, '') + 'Client';
  const clientFileName = `${clientFnName}.tsx`;
  const clientFilePath = path.join(dir, clientFileName);

  // Build client content: remove metadata block and import
  let clientContent = content;
  clientContent = clientContent.slice(0, metadataBlock.start) + clientContent.slice(metadataBlock.end);
  clientContent = removeMetadataImport(clientContent);
  
  // Clean up: collapse multiple blank lines
  clientContent = clientContent.replace(/\n{3,}/g, '\n\n');
  
  // Clean up: remove trailing whitespace lines
  clientContent = clientContent.trimEnd() + '\n';

  // Rename the default export function in client content
  clientContent = clientContent.replace(
    new RegExp(`export\\s+default\\s+function\\s+${fnName}\\b`),
    `export default function ${clientFnName}`
  );

  // Build new page.tsx content (Server Component)
  const clientImportFile = clientFileName.replace(/\.tsx$/, '');
  const newPageContent = `import type { Metadata } from 'next';
import ${clientFnName} from './${clientImportFile}';

${metadataBlock.text}

export default function ${fnName}(props: any) {
  return <${clientFnName} {...props} />;
}
`;

  // Write the files
  fs.writeFileSync(clientFilePath, clientContent);
  fs.writeFileSync(fullPath, newPageContent);

  console.log(`✅ ${filePath} → ${clientFileName}`);
  return true;
}

// Main
let fixed = 0;
let skipped = 0;
for (const file of files) {
  if (fixFile(file)) {
    fixed++;
  } else {
    skipped++;
  }
}

console.log(`\n🎉 Done! Fixed: ${fixed}, Skipped: ${skipped}`);
