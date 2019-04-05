// @ts-check
const { exec } = require('child_process');
const platform = require('os').platform();

// http://${host}:${port}/${fileName}
function openBrowser({ name, path, opts = '', onClose = () => {} }) {
  if (!name || !path) throw new Error(`'name' and 'path' must be defined`);
  let browserCmd = '';

  switch (name.toLowerCase()) {
    case 'firefox':
      if (platform === 'linux') {
        browserCmd = `${name} ${opts} "${path}"`;
      } else if (platform === 'win32') {
        browserCmd = `start ${name} ${opts} "${path}"`;
      } else if (platform === 'darwin') {
        browserCmd = `open -a 'Firefox' ${opts} "${path}"`;
      }
      break;

    case 'chrome':
      if (platform === 'linux') {
        browserCmd = `google-chrome ${opts} "${path}"`;
      } else if (platform === 'win32') {
        browserCmd = `start ${name} ${opts} "${path}"`;
      } else if (platform === 'darwin') {
        browserCmd = `open -a 'Google Chrome' ${opts} "${path}"`;
      }
      break;

    case 'edge':
      if (platform === 'win32') {
        browserCmd = `start microsoft-edge:"${path}"`;
      }
      break;

    case 'safari':
      if (platform === 'darwin') {
        browserCmd = `open -a 'Safari' ${opts} "${path}"`;
      }
  }

  if (browserCmd !== '') {
    // FIXME: o evento `close` do ChildProcess é disparado quando se fecha a conexão. Se já existir um processo Chrome, o `browser` fechará sua conexão, dando a impressão de ter fechado o navegador
    return exec(browserCmd).once('close', onClose).once('disconnect', onClose);
  }
}

module.exports = openBrowser;
