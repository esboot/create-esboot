import path from 'path';
import fs from 'fs';
import chalk from 'colorette';
import minimatch from 'minimatch';
import {render} from 'ejs';
import {prompt} from './vendor/prompts'
import confirm from './confirm'
import {copy, ensureDirSync, installDependences, walk} from "./utils";

const templateExt = '.ejs';


export default class Builder {
    private readonly templatePath: (p?: string) => string;
    private readonly destPath: (p?: string) => string;
    private readonly filter: any;
    private meta: any;
    private argv: any;
    private props: any;

    constructor(repoPath, argv) {
        this.templatePath = (p = '') => path.join(repoPath, 'template', p);
        this.destPath = (p = '') => path.join(argv.destPath, p);
        this.meta = require(path.join(repoPath, 'bootstrap.js'));
        this.argv = argv;
        this.filter = this.getFilter();
    }

    async start() {
        try {
            const answer = await prompt(this.meta.prompt, {
                onCancel: function () {
                    throw new Error('abort');
                }
            });
            const appName = path.basename(this.destPath() === "." ? process.cwd() : this.destPath());
            this.props = Object.assign({}, answer, {appName});
            ensureDirSync(this.destPath());
            this.writing();
            await confirm('Install all dependence right now?');
            await this.install();
        } catch (e) {
            // console.log(e);
        }
    }

    copy(from, to = from) {
        copy(this.templatePath(from), this.destPath(to)).catch(e => {
            console.error(e);
        });
    };

    copyTpl(opts, from, to = from) {
        fs.readFile(this.templatePath(from), 'utf8', (err, data) => {
            if (err) throw err;
            const rs = render(data, opts, {filename: this.templatePath()});
            const destFile = this.destPath(to.replace(templateExt, ''));
            ensureDirSync(path.dirname(destFile));
            fs.writeFileSync(destFile, rs, 'utf8');
        });
    };

    // copy file ,denpend on file extension
    copyFile(filePath) {
        filePath.endsWith(templateExt) ? this.copyTpl(this.props, filePath) : this.copy(filePath);
    }

    getFilter() {
        let ignoreMap = {};
        if (this.meta.hasOwnProperty('ignore')) {
            ignoreMap = this.meta.ignore.reduce((pre, curr) => {
                pre[curr] = '';
                return pre;
            }, {});
        }
        return Object.assign({}, ignoreMap, this.meta.filter);
    }

    writing() {
        try {
            const globs = Object.keys(this.filter);

            const isPathMatch = p => {
                for (let g of globs) {
                    if (minimatch(p, g, {dot: true})) {
                        return this.filter[g].split('|');
                    }
                }
            };

            // is file match module
            const isMatchOneModule = (mods) => {
                for (let i of mods) {
                    // if props have this module and the value is true
                    if (this.props[i]) {
                        return true;
                    }
                }
                return false;
            };

            const pendingCopyFiles = [];
            walk(this.templatePath(), pendingCopyFiles);
            for (let file of pendingCopyFiles) {
                const relativeFilePath = path.relative(this.templatePath(), file);
                const m = isPathMatch(relativeFilePath);
                if (m) {
                    isMatchOneModule(m) && this.copyFile(relativeFilePath);
                } else {
                    this.copyFile(relativeFilePath)
                }
            }

            console.log(`\n${chalk.green('[success]')} All files created!`);
        } catch (e) {
            console.error(`\n${chalk.red('[error]')} ${e.message}`);
        }
    }

    async install() {
        await installDependences(this.argv.destPath);
    }

}
