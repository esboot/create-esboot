import path from 'path';
import fs from 'fs';
import * as tc from 'colorette';
import { Spinner } from 'cli-spinner';
import Builder from './builder';
import { downloadStarter } from './download';
import { unZipBuffer } from './unzip';
import { setTmpDirectory } from './utils';

function isLocalPath(templatePath) {
  return /^[./]|(^[a-zA-Z]:)/.test(templatePath);
}

function hasSlash(s) {
  return s.indexOf('/') !== -1;
}

export async function start(argv) {
  let { template, destPath } = argv;
  if (isLocalPath(template) && fs.existsSync(template)) {
    await new Builder(template, argv).start();
  } else {
    template = hasSlash(template) ? template : `esboot/${template}-template`;

    const rootPath = path.join(destPath, '.boot-templates');
    const localRepoPath = path.resolve(rootPath, template.replace(/\//g, '-'));

    const loading = new Spinner({
      onTick: function (msg) {
        this.clearLine(this.stream);
        this.stream.write(`${tc.cyan(msg)}downloading starter`);
      },
    });
    loading.setSpinnerString(18);
    loading.start();

    setTmpDirectory(rootPath);

    try {
      const buffer = await downloadStarter(template);
      loading.stop(true);
      await unZipBuffer(buffer, localRepoPath);
      const b = new Builder(localRepoPath, argv);
      await b.start();
    } catch (e) {
      loading.stop(true);
      console.error(`\n${tc.red('✖')} ${e.message}\n`);
    }
  }
}
