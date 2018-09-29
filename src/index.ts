import * as tc from 'colorette';
import path from 'path';
import fs from 'fs';
import confirm from './confirm';
import {start} from './start'
import {cleanup} from "./utils";

const USAGE_DOCS = `Usage:
npm init @zboot [starter] [project-name]
`;

function getPkgVersion() {
    const pkg = require('../package.json');
    return pkg.version;
}


async function run() {
    let args = process.argv.slice(2);

    const autoRun = args.indexOf('--run') >= 0;
    const help = args.indexOf('--help') >= 0 || args.indexOf('-h') >= 0;
    const info = args.indexOf('--info') >= 0;

    args = args.filter(a => a[0] !== '-');

    if (info) {
        console.log('zboot:', getPkgVersion(), '\n');
        return 0;
    }

    if (help) {
        console.log(USAGE_DOCS);
        return 0;
    }

    try {
        const currDir = process.cwd();
        const [template, dir = '.'] = args;
        const destPath = path.join(currDir, dir);
        let msg = '';
        if (currDir === destPath) {
            msg = 'Create project under current directory?';
        } else if (fs.existsSync(destPath)) {
            msg = 'Target directory exists. Continue?'
        }
        try {
            await confirm(msg, msg === '');
            await start({template, destPath})
        } catch (e) {
            // console.error(`\n${tc.red('✖')} ${e.message}\n`);
        }
    } catch (e) {
        // console.error(`\n${tc.red('✖')} ${e.message}\n`);
    }
    cleanup();
}

run();
