import {ChildProcess, spawn} from 'child_process';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import ncp from 'ncp';

const childrenProcesses: ChildProcess[] = [];
let tmpDirectory: string | null = null;

export function setTmpDirectory(dir: string | null) {
    tmpDirectory = dir;
    if (dir) {
        rimraf(dir);
        process.once('uncaughtException', cleanup);
        process.once('exit', cleanup);
        process.once('SIGINT', cleanup);
        process.once('SIGTERM', cleanup);
    }
}

export function cleanup() {
    if (tmpDirectory) {
        killChildren();
        setTimeout(() => {
            if (tmpDirectory) {
                rimraf(tmpDirectory);
                tmpDirectory = null;
            }
            process.exit();
        }, 200);
    }
}

function killChildren() {
    childrenProcesses.forEach(p => p.kill('SIGINT'));
}

export function cmdExist(executor: string) {
    return new Promise((resolve, reject) => {
        const p = spawn(executor, ['-v'], {
            shell: true,
        });
        p.stdout.once('data', (data) => {
            resolve();
        });
        p.stderr.once('data', (data) => {
            reject();
        });
        p.once('close', (code) => {
            code === 0 ? resolve() : reject();
        });
    })
}

export async function installDependences(cwd) {
    try {
        await cmdExist('yarn');
        await cmd('yarn', 'install', cwd);
    } catch (e) {
        try {
            await cmdExist('npm');
            await cmd('npm', 'install', cwd);
        } catch (e) {
            console.error(e.message)
        }
    }
}

export function cmd(executor: string, command: string, projectPath: string) {
    return new Promise((resolve, reject) => {
        const p = spawn(executor, [command], {
            stdio: 'inherit',
            cwd: projectPath
        });
        p.once('exit', () => resolve());
        p.once('error', reject);
        childrenProcesses.push(p);
    });
}


export function ensureDirSync(path) {
    if (!fs.existsSync(path)) mkdirp.sync(path);
}

export function rimraf(dir_path: string) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach((entry) => {
            const entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}


export function walk(dir_path: string, out: string[]) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach((entry) => {
            const entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                walk(entry_path, out);
            } else {
                out.push(entry_path);
            }
        });
    }
}

export function copy(from, to) {
    return new Promise((resolve, reject) => {
        ensureDirSync(path.dirname(to));
        ncp(from, to, function (err) {
            if (err) {
                return reject(err);
            }
            resolve()
        });
    })
}
