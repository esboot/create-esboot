import path from 'path';
import fs from 'fs';
import chalk from 'colorette';
import minimatch from 'minimatch';
import {renderFile, render} from 'ejs';
import {prompt} from '../vendor/prompts/index';
import {cmdExist, copy, ensureDirSync, installDependences, walk} from "./utils";

const templateExt = '.ejs';


export default class Builder {
    private readonly templatePath: (p?: string) => string;
    private readonly destPath: (p?: string) => string;
    private filter: any;
    private meta: any;
    private argv: any;
    private props: any;

    constructor(repoPath, argv) {
        this.templatePath = (p = '') => path.join(repoPath, 'template', p);
        this.destPath = (p = '') => path.join(argv.destPath, p);
        this.meta = require(path.join(repoPath, 'bootstrap.js'));
        this.argv = argv;
    }

    async start() {
        try {
            const o = [
                ...this.meta.prompt,
                {
                    name: 'isInstall',
                    type: 'confirm',
                    message: 'Install all dependence right now?',
                    default: false
                }
            ];
            const answer = await prompt(o);
            const appName = path.basename(this.destPath() === "." ? process.cwd() : this.destPath());
            const p = path.relative(process.cwd(), this.destPath());
            const haveYarn = await cmdExist('yarn');
            const cmd = haveYarn ? 'yarn' : 'npm';
            this.props = Object.assign({}, answer, {appName}, {destPath: p}, {cmd});
            this.filter = this.getFilter();
            ensureDirSync(this.destPath());
            this.writing();
            await this.install(answer.isInstall);
        } catch (e) {
            // console.log(e);
        }
    }

    copy(from, to) {
        copy(from, to).catch(e => {
            console.error(e);
        });
    };

    copyTpl(from, to, opts) {
        renderFile(from, opts, {filename: from}, (err, rs) => {
            if (err) throw err;
            const destFile = to.replace(templateExt, '');
            fs.writeFileSync(destFile, rs, 'utf8');
        })
    };

    // copy file, depend on file extension
    copyFile(from, to) {
        from.endsWith(templateExt) ? this.copyTpl(from, to, this.props) : this.copy(from, to);
    }

    getFilter() {
        const l = this.meta.ignore ? this.meta.ignore.reduce((prev, next) => {
            prev[next] = '';
            return prev;
        }, {}) : {};
        const obj = {...this.meta.filter, ...l, ...{'node_modules/**/*': ''}};
        for (let key in obj) {
            const v = obj[key];
            if (this.props.hasOwnProperty(v) && this.props[v]) delete obj[key];
        }
        return Object.keys(obj)
    }

    isExclude(p) {
        for (let i of this.filter) {
            if (minimatch(p, i, {dot: true})) return true
        }
        return false;
    }

    writing() {
        try {
            const pendingCopyFiles = [];
            walk(this.templatePath(), pendingCopyFiles);
            for (let file of pendingCopyFiles) {
                const relativeFilePath = path.relative(this.templatePath(), file);
                const destPath = this.destPath(relativeFilePath);

                if (this.isExclude(relativeFilePath)) continue;
                ensureDirSync(path.dirname(destPath));
                this.copyFile(file, destPath);
            }
            console.log(chalk.green(`Success! All files created!`));
        } catch (e) {
            console.error(chalk.red(`Error! ${e.message}`));
        }
    }

    async install(isInstall) {
        if (isInstall) {
            const haveInstall = await installDependences(this.argv.destPath);
            if (haveInstall) {
                console.log(render(this.meta.completeMessage, this.props));
            } else {
                console.log(`\n\n${chalk.red('✖ Abort!')}\n`);
                console.log(render(this.meta.incompleteMessage, this.props));
            }
        } else {
            console.log(render(this.meta.incompleteMessage, this.props));
        }
    }

}
