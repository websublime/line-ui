/**
 * Theme build script — runs all css:* scripts from package.json sequentially.
 *
 * Replaces the inline `node -e` one-liner that was previously in the "build"
 * script. Provides clear error reporting: logs which script failed, its exit
 * code, and captures stderr output instead of swallowing it with stdio:'ignore'.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkgPath = join(import.meta.dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const cssScripts = Object.keys(pkg.scripts).filter((name: string) => name.startsWith('css:'));

if (cssScripts.length === 0) {
  console.error('No css:* scripts found in package.json');
  process.exit(1);
}

console.info(`Running ${cssScripts.length} css:* scripts...\n`);

let failed = 0;

for (const name of cssScripts) {
  process.stdout.write(`  ${name}... `);

  const proc = Bun.spawnSync(['bun', 'run', name], {
    cwd: join(import.meta.dirname, '..'),
    stderr: 'pipe',
    stdout: 'pipe'
  });

  if (proc.exitCode !== 0) {
    failed++;
    console.info('FAILED');
    const stderr = proc.stderr.toString().trim();
    if (stderr) {
      console.error(`    stderr: ${stderr}`);
    }
    console.error(`    exit code: ${proc.exitCode}`);
  } else {
    console.info('done');
  }
}

console.info(`\n${cssScripts.length - failed}/${cssScripts.length} scripts succeeded.`);

if (failed > 0) {
  console.error(`${failed} script(s) failed.`);
  process.exit(1);
}
