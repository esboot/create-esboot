import { ChildProcess, spawn } from 'child_process';

const childrenProcesses: ChildProcess[] = [];

export function npm(command: string, projectPath: string, stdio: any = 'ignore') {
  return new Promise((resolve, reject) => {
    const p = spawn('npm', [command], {
      shell: true,
      stdio,
      cwd: projectPath
    });
    p.once('exit', () => resolve());
    p.once('error', reject);
    childrenProcesses.push(p);
  });
}
