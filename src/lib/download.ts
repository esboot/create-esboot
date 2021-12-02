import { getUserConfigField } from './utils';

export async function downloadStarter(starter) {
    let downloadUrl = 'https://github.com/{}/archive/master.zip';

    try {
        const userMirror = await getUserConfigField('esboot_tpl_mirror');
        downloadUrl = userMirror === 'undefined' ? downloadUrl : userMirror;
    } catch(err) {
        console.log(err);
    }

	const url = downloadUrl.replace('{}', starter);
  
    return downloadFromURL(url);
}


function downloadFromURL(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const request = url.indexOf('https:') !== -1 ? require('https') : require('http');

        request.get(url, (res) => {
            if (res.statusCode === 302) {
                // console.log(`Redirect to ${res.headers.location}`);

                downloadFromURL(res.headers.location!).then(resolve, reject);
            } else {
                const data: any[] = [];

                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    if (res.statusCode === 404) {
						reject({ message: `404: ${url} not found` })
					}

                    resolve(Buffer.concat(data));
                });
                res.on('error', (e) => reject({ message: `
                An error occurred when Downloading template from ${url}
                Error: ${e.message}
                `}));
            }
        });
    });
}
