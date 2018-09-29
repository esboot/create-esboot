import path from 'path';
import fs from 'fs';
import * as tc from 'colorette';
import {Spinner} from 'cli-spinner';
import Builder from './builder';
import {downloadStarter} from './download';
import {unZipBuffer} from "./unzip";
import {setTmpDirectory} from "./utils";

function isLocalPath(templatePath) {
    return /^[./]|(^[a-zA-Z]:)/.test(templatePath)
}

function hasSlash(s) {
    return s.indexOf('/') !== -1;
}

export async function start(argv) {
    let {template, destPath} = argv;
    if (isLocalPath(template) && fs.existsSync(template)) {
        await (new Builder(template, argv)).start()
    } else {
        template = hasSlash(template) ? template : `webpatch/${template}`;

        const localRepoPath = path.join(destPath, '.boot-templates', template.replace(/\//g, '-'));

        const loading = new Spinner(tc.bold('downloading starter'));
        loading.setSpinnerString(18);
        loading.start();

        const repoRoot = path.resolve(__dirname, localRepoPath);
        setTmpDirectory(repoRoot);

        try {
            const buffer = await downloadStarter(template);
            loading.stop(true);
            await unZipBuffer(buffer, repoRoot);
            await (new Builder(repoRoot, argv)).start()
        } catch (e) {
           // console.error(`\n${tc.red('✖')} ${e.message}\n`);
        }
    }
}
