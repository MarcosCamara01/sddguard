import { Command } from 'commander';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { updateCommand } from './commands/update';
import { statusCommand } from './commands/status';
import { createRequire } from 'module';

const pkg = createRequire(__filename)('../package.json') as { version: string };

const program = new Command();

program
  .name('sddx-workflow')
  .description('Spec-Driven Development CLI')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize SDD protocol in the current project')
  .option('--force', 'Overwrite files that already exist')
  .option('--existing', 'Brownfield mode: prints next-steps that start with /scan and /bootstrap --scan')
  .action(initCommand);

program
  .command('add <type> <name>')
  .description('Add an SDD component to an existing installation')
  .addHelpText('after', '\nExamples:\n  $ sddx-workflow add domain auth\n  $ sddx-workflow add domain payments')
  .action(addCommand);

program
  .command('update')
  .description('Update protocol files to the latest version')
  .action(updateCommand);

program
  .command('status')
  .description('Show bootstrap status and open specs progress')
  .action(statusCommand);

program.parseAsync();
