import { COMMAND_NAMES } from './command-names';

export function commandsCommand(): void {
  console.log('');
  console.log('  Agent commands');
  console.log('');
  for (const name of COMMAND_NAMES) {
    console.log(`  /${name}`);
  }
  console.log('');
}
