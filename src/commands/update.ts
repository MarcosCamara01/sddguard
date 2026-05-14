import fs from 'fs';
import path from 'path';
import { copyTemplate } from '../utils';

const COMMAND_NAMES = [
  'bootstrap',
  'ask',
  'assume',
  'bugfix',
  'refactor',
  'spec-new',
  'spec-plan',
  'spec-tasks',
  'review',
  'finish',
  'spec-amend',
  'impl-gap',
  'spec-restore',
  'research',
  'verify',
  'scan',
  'conventions-sync',
  'spec-status',
  'spec-conflicts',
  'spec-clarify',
  'spec-analyze',
] as const;

const claudeCommands = COMMAND_NAMES.map(name => ({
  src: `claude-commands/${name}.md`,
  dest: `.claude/commands/${name}.md`,
}));

const copilotPrompts = COMMAND_NAMES.map(name => ({
  src: `copilot-prompts/${name}.prompt.md`,
  dest: `.github/prompts/${name}.prompt.md`,
}));

const codexSkills = COMMAND_NAMES.map(name => ({
  src: `codex-skills/${name}/SKILL.md`,
  dest: `.agents/skills/${name}/SKILL.md`,
}));

const WORKFLOW_FILES: Array<{ src: string; dest: string }> = [
  { src: 'workflow.md', dest: '.sdd/workflow.md' },
  ...claudeCommands,
  { src: 'cursor-rules/sddx-workflow.mdc', dest: '.cursor/rules/sddx-workflow.mdc' },
  { src: 'windsurf-rules/sddx-workflow.md', dest: '.windsurf/rules/sddx-workflow.md' },
  ...copilotPrompts,
  { src: 'copilot-instructions.md', dest: '.github/copilot-instructions.md' },
  ...codexSkills,
  { src: 'zed-rules/sddx-workflow.md', dest: '.rules' },
];

function ensureSkillDir(dest: string): void {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function updateCommand(): void {
  const cwd = process.cwd();

  if (!fs.existsSync(path.join(cwd, '.sdd'))) {
    console.error('\n  error    .sdd/ not found. Run `npx sddx-workflow init` first.\n');
    process.exit(1);
  }

  console.log('');
  console.log('  SDD Workflow — updating workflow files');
  console.log('  (project-overview.md, conventions.md, CLAUDE.md, config.json, and domains are yours — untouched)');
  console.log('');

  let updated = 0;
  for (const file of WORKFLOW_FILES) {
    const dest = path.join(cwd, file.dest);

    if (file.dest.startsWith('.agents/skills/')) {
      if (!fs.existsSync(path.join(cwd, '.agents/skills'))) continue;
      ensureSkillDir(dest);
    }

    const parentDirExists = fs.existsSync(path.dirname(dest));
    const fileExists = fs.existsSync(dest);

    if (!fileExists && !parentDirExists) continue;

    copyTemplate(file.src, dest, true);
    updated++;
  }

  console.log('');
  console.log(`  Done. ${updated} file${updated !== 1 ? 's' : ''} updated.\n`);
}
