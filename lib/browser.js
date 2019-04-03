// TODO: migrar para https://www.npmjs.com/package/open
// @ts-check
const { exec } = require('child_process');
const platform = require('os').platform();

// http://${host}:${port}/${fileName}
function openBrowser(browserName, URL, browserOpts = '') {
  if (!browserName || !URL) throw new Error(`'browserName' and 'URL' must be defined`);
  let browserCmd = '';

  switch (browserName.toLowerCase()) {
    case 'firefox':
      if (platform === 'linux') {
        browserCmd = `${browserName} ${browserOpts} "${URL}"`;
      } else if (platform === 'win32') {
        browserCmd = `start ${browserName} ${browserOpts} "${URL}"`;
      } else if (platform === 'darwin') {
        browserCmd = `open -a 'Firefox' ${browserOpts} "${URL}"`;
      }
      break;

    case 'chrome':
      if (platform === 'linux') {
        browserCmd = `google-chrome ${browserOpts} "${URL}"`;
      } else if (platform === 'win32') {
        browserCmd = `start ${browserName} ${browserOpts} "${URL}"`;
      } else if (platform === 'darwin') {
        browserCmd = `open -a 'Google Chrome' ${browserOpts} "${URL}"`;
      }
      break;

    case 'edge':
      if (platform === 'win32') {
        browserCmd = `start microsoft-edge:"${URL}"`;
      }
      break;

    case 'safari':
      if (platform === 'darwin') {
        browserCmd = `open -a 'Safari' ${browserOpts} "${URL}"`;
      }
  }

  if (browserCmd !== '') {
    return exec(browserCmd);
  }
}

module.exports = openBrowser;
