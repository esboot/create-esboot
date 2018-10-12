import {get} from 'https';

export function downloadStarter(starter) {
    return downloadFromURL(`https://github.com/${starter}/archive/master.zip`);
}

function downloadFromURL(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            if (res.statusCode === 302) {
                downloadFromURL(res.headers.location!).then(resolve, reject);
            } else {
                const data: any[] = [];

                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    resolve(Buffer.concat(data));
                });
                res.on('error', reject);
            }
        });
    });
}
