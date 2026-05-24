import fs from 'node:fs';
import path from 'node:path';

export type VerifyResult = 'PASS' | 'FAIL' | 'MALFORMED';

export interface TaskProgress {
  done: number;
  total: number;
}

export function stripComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

export function readIfExists(file: string): string | null {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

export function hasBlockingClarifications(content: string): boolean {
  return /^\s*- \[ \]\s*\u26d4\ufe0f?\s*BLOCKING\b/imu.test(stripComments(content));
}

export function hasApprovedPlanMarker(content: string): boolean {
  return /^- \[x\]\s+\*\*Approved\*\*/im.test(stripComments(content));
}

export function hasPlanApprovedLine(content: string): boolean {
  const match = content.match(/^Plan approved:\s*(.+)$/im);
  return Boolean(match?.[1].trim() && !match[1].includes('<!--'));
}

export function readVerifyResult(content: string): VerifyResult {
  const result = content.match(/^Result:\s*(PASS|FAIL)\s*$/m)?.[1];
  return result === 'PASS' || result === 'FAIL' ? result : 'MALFORMED';
}

export function taskProgress(content: string): TaskProgress {
  const taskMatches = [...content.matchAll(/^- \[(x| )\]\s+\*\*(?:T\d+|Task\b)/gim)];
  return {
    done: taskMatches.filter((match) => match[1].toLowerCase() === 'x').length,
    total: taskMatches.length,
  };
}

export function countPendingCrs(specDir: string): number {
  const content = readIfExists(path.join(specDir, 'amendments.md'));
  if (!content) return 0;
  return (stripComments(content).match(/\*\*Status:\*\*\s*Pending approval/gi) ?? []).length;
}

export function countUnresolvedGaps(specDir: string): number {
  const content = readIfExists(path.join(specDir, 'impl-gaps.md'));
  if (!content) return 0;
  const entries = stripComments(content)
    .split(/^##\s+GAP-\d+/gim)
    .slice(1);
  return entries.filter((entry) => {
    const resolution = entry.match(/\*\*Resolution:\*\*\s*(.*)/i);
    return (
      !resolution || resolution[1].trim().length === 0 || /filled|pending|tbd/i.test(resolution[1])
    );
  }).length;
}
