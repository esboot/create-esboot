import * as tc from 'colorette';
import path from 'path';
import fs from 'fs';
import confirm from './confirm';
import {start} from './start'
import {cleanup} from "./utils";

const USAGE_DOCS = `Usage:
npm init esboot [starter] [project-name]

Options:
  -h  Show help
  -v  Show version
`;

function getPkgVersion() {
    const pkg = require('../package.json');
    return pkg.version;
}

async function run() {
    let args = process.argv.slice(2);

    const help = args.indexOf('--help') >= 0 || args.indexOf('-h') >= 0;
    const info = args.indexOf('--version') >= 0 || args.indexOf('-v') >= 0;

    args = args.filter(a => a[0] !== '-');

    if (info) {
        console.log(`esboot v${getPkgVersion()} \n`);
        return 0;
    }

    if (help) {
        console.log(USAGE_DOCS);
        return 0;
    }

    const currDir = process.cwd();
    const [template = 'react', dir = '.'] = args;
    const destPath = path.join(currDir, dir);
    let msg = '';
    if (currDir === destPath) {
        msg = 'Create project under current directory?';
    } else if (fs.existsSync(destPath)) {
        msg = 'Target directory exists. Overwrite?'
    }
    try {
        await confirm(msg, false, msg === '');
        await start({template, destPath})
    } catch (e) {
        if (e && e.hasOwnProperty('message')) {
            console.error(tc.red(`Error ${e.message}`));
        }
    }
    cleanup();
}

run();
