import { getNpmConfigField } from './utils';

function downloadFromURL(url: string, isHttps: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
		const request = isHttps ? require('https') : require('http');

    request.get(url, (res) => {
      // console.log(res, '<-- res');
      if (res.statusCode === 302) {
				console.log(` ===> Redirect to ${res.headers.location}`);

        downloadFromURL(res.headers.location!, isHttps).then(resolve, reject);
      } else {
        const data: any[] = [];

        res.on('data', (chunk) => data.push(chunk));

        res.on('end', () => {
					if (res.statusCode === 404) {
						reject({ message: '404: Page not found' })
					}
          resolve(Buffer.concat(data));
        });

        res.on('error', (error) => {
					console.log(error, '<-- error');
					reject();
				});
      }
    });
  });
}

export function downloadStarter(starter) {
	const userMirror = getNpmConfigField('esboot_tpl_mirror');
	const mirror = userMirror === 'undefined' ? 'https://github.com/{template-name}/archive/master.zip' : userMirror;
	const url = mirror.replace('{template-name}', starter);

	console.log(` ===> Downloading url is ${url}`);
  return downloadFromURL(url, url.indexOf('https:') !== -1);
}
