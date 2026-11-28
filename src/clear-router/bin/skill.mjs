#!/usr/bin/env node
// Agent-skill helper: prints the bundled SKILL.md, installs it into a
// skills directory agent harnesses scan, or emits the postinstall hint.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = join(packageRoot, 'skills');
const skillName = 'clear-react-router';
const skillDir = join(skillRoot, 'getting-started');

const hint = () => {
	const cwdPackage = join(process.cwd(), 'package.json');
	const isSelfInstall =
		existsSync(cwdPackage) &&
		(() => {
			try {
				return ['clear-react-router', 'router'].includes(JSON.parse(readFileSync(cwdPackage, 'utf8')).name);
			} catch {
				return false;
			}
		})();
	if (process.env.CI || process.env.CLEAR_ROUTER_NO_HINTS || isSelfInstall) return;
	console.log(
		`[clear-react-router] AI skill bundled: skills/getting-started/SKILL.md — ` +
			`run "npx ${skillName} skill" to print it or "npx ${skillName} skill install" to install it for your agent`
	);
};

const print = () => {
	process.stdout.write(readFileSync(join(skillDir, 'SKILL.md'), 'utf8'));
};

const targets = () => {
	const to = process.argv[process.argv.indexOf('--to') + 1];
	const base = to ? resolve(to) : join(process.cwd(), '.claude', 'skills');
	return join(base, skillName);
};

const install = () => {
	const target = targets();
	mkdirSync(target, { recursive: true });
	copyFileSync(join(skillDir, 'SKILL.md'), join(target, 'SKILL.md'));
	const refs = join(target, 'references');
	mkdirSync(refs, { recursive: true });
	for (const file of readdirSync(join(skillDir, 'references'))) {
		copyFileSync(join(skillDir, 'references', file), join(refs, file));
	}
	console.log(`Installed the ${skillName} skill to ${target}`);
};

const [, , command = 'print'] = process.argv;
if (command === 'print') print();
else if (command === 'install') install();
else if (command === 'hint') hint();
else {
	console.error(`Unknown command "${command}". Usage: ${skillName} [print | install | hint]`);
	process.exit(1);
}
