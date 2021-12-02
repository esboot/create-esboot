import { getUserConfigField } from './utils';

export async function downloadStarter(starter) {
    let downloadUrl = 'https://github.com/{template-name}/archive/master.zip';

    try {
        const userMirror = await getUserConfigField('esboot_tpl_mirror');
        downloadUrl = userMirror === 'undefined' ? downloadUrl : userMirror;
    } catch(err) {
        console.log(err);
    }

	const url = downloadUrl.replace('{template-name}', starter);

	console.log(` ===> Downloading template from ${url}`);
    return downloadFromURL(url);
}


function downloadFromURL(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const request = url.indexOf('https:') !== -1 ? require('https') : require('http');

        request.get(url, (res) => {
            if (res.statusCode === 302) {
                console.log(` ===> Redirect to ${res.headers.location}`);

                downloadFromURL(res.headers.location!).then(resolve, reject);
            } else {
                const data: any[] = [];

                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    if (res.statusCode === 404) {
						reject({ message: '404: Page not found' })
					}

                    resolve(Buffer.concat(data));
                });
                res.on('error', reject);
            }
        });
    });
}
