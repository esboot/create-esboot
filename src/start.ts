import path from 'path';
import fs from 'fs-extra';
import * as tc from 'colorette';
import {Spinner} from 'cli-spinner';
import Builder from './builder';
import {downloadStarter} from './download';
import {unZipBuffer} from "./unzip";

function isLocalPath(templatePath) {
    return /^[./]|(^[a-zA-Z]:)/.test(templatePath)
}

function hasSlash(s) {
    return s.indexOf('/') !== -1;
}

export async function start(argv) {
    let {template, destPath} = argv;
    if (isLocalPath(template)) {
        if (fs.pathExistsSync(template)) {
            new Builder(template, argv);
        }
    } else {
        template = hasSlash(template) ? template : `webpatch/${template}`;

        const localRepoPath = path.join(destPath, '.boot-templates', template.replace(/\//g, '-'));

        const loading = new Spinner(tc.bold('downloading starter'));
        loading.setSpinnerString(18);
        loading.start();

        const repoRoot = path.resolve(__dirname, localRepoPath);
        fs.removeSync(repoRoot);

        try {
            const buffer = await downloadStarter(template);
            await unZipBuffer(buffer, repoRoot);
        } catch (e) {
            console.log('Download error!');
        } finally {
            loading.stop(true);
        }
    }
}
