import fs from 'fs';
import path from 'path';
import { ensureDir } from '../utils';

interface SnapshotOptions {
  list?: boolean;
}

const SPEC_FILES = ['1-requirements.md', '2-plan.md', '3-tasks.md'];

function fsTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function snapshotsDir(cwd: string, feature: string): string {
  return path.join(cwd, '.sdd', 'snapshots', feature);
}

function listSnapshots(cwd: string, feature: string): void {
  const dir = snapshotsDir(cwd, feature);
  if (!fs.existsSync(dir)) {
    console.log(`\n  no snapshots for ${feature}\n`);
    return;
  }
  const stamps = fs.readdirSync(dir)
    .filter(name => fs.statSync(path.join(dir, name)).isDirectory())
    .sort();
  console.log('');
  if (stamps.length === 0) {
    console.log(`  no snapshots for ${feature}`);
  } else {
    console.log(`  snapshots for ${feature}:`);
    for (const stamp of stamps) {
      const files = fs.readdirSync(path.join(dir, stamp));
      console.log(`    ${stamp}  (${files.length} files)`);
    }
  }
  console.log('');
}

export function snapshotCommand(feature: string, options: SnapshotOptions): void {
  const cwd = process.cwd();

  if (options.list) {
    listSnapshots(cwd, feature);
    return;
  }

  const specDir = path.join(cwd, 'specs', feature);
  if (!fs.existsSync(specDir)) {
    console.error(`\n  error    specs/${feature}/ not found\n`);
    process.exit(1);
  }

  const stamp = fsTimestamp();
  const targetDir = path.join(snapshotsDir(cwd, feature), stamp);
  ensureDir(targetDir);

  console.log('');
  let copied = 0;
  for (const file of SPEC_FILES) {
    const src = path.join(specDir, file);
    if (!fs.existsSync(src)) {
      console.log(`  skip     ${file} (missing in specs/${feature}/)`);
      continue;
    }
    fs.copyFileSync(src, path.join(targetDir, file));
    console.log(`  copy     ${file}`);
    copied++;
  }

  if (copied === 0) {
    fs.rmdirSync(targetDir);
    console.error(`\n  error    no spec files found to snapshot in specs/${feature}/\n`);
    process.exit(1);
  }

  console.log('');
  console.log(`  snapshot at .sdd/snapshots/${feature}/${stamp}/`);
  console.log('');
}
