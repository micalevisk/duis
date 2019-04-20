// @ts-check
const { spawn } = require('child_process');
const path = require('path');
const platform = require('os').platform();

class PHPServer {

  constructor({ host, port, relativePath = '', bin = 'php' }) {
    this.hostaddress = `${host}:${port}`;
    this.bin = bin;
    this.relativePath = relativePath;
  }

  shutDown() {
    if (!this.terminal) return
    this.terminal.kill();
    this.terminal = undefined;
  }

  argsToArray(docroot, router) {
    const args = [
      '-S', this.hostaddress,
      '-t', docroot,
      router,
    ];

    if (platform === 'win32') {
      process.env.PHP_SERVER_RELATIVE_PATH = this.relativePath;
    }

    return args;
  }

  /**
   * run `php -S <addr>:<port> -t docroot router`
   * @param {string} docroot
   */
  initServer(docroot = '.') {
    this.shutDown();

    this.terminal = spawn(
      this.bin,
      this.argsToArray(docroot, path.join(__dirname, 'router.php')),
    );

    /*
    this.terminal.stdout.on('data', (data) => {
      console.log( data.toString() );
    });

    this.terminal.stderr.on('data', (data) => {
      console.error( data.toString() );
    });
    */

    this.terminal.on('error', (err) => {
      this.terminal = undefined;
      console.error(`Server error: ${err.stack}`);
    });

    this.terminal.on('close', (code) => {
      this.shutDown();
    });

    return this;
  }

}

/*
if (require.main) {
  const p = new PHPServer({
    host: 'localhost',
    port: 8080,
    onProcessClose: console.log,
  }).initServer('/home/micael/Documentos/GitHub/duis/example/CB01/micalevisk/HTML')
}
*/

module.exports = PHPServer

/*
function create({
  relativePath = '',
  bin = 'php',
  host,
  port,
  docroot = '.',
  pathToRouterFile = path.join(__dirname, 'router.php'),
  onCloseOrDisconnect = (...args) => {},
}) {
  if (!host || !port) throw new Error(`'host' and 'port' must be defined`);

  if (platform === 'win32') {
    process.env.PHP_SERVER_RELATIVE_PATH = relativePath;
  }

  const args = [
    '-S', `${host}:${port}`,
    '-t', docroot,
    pathToRouterFile,
  ];

  const serverProcess = spawn(bin, args);

  serverProcess.on('error', err => console.error(`Server error:`, err));
  serverProcess.once('close', onCloseOrDisconnect);
  serverProcess.once('disconnect', onCloseOrDisconnect);

  return serverProcess;
}

function shutDown(serverProcess) {
  return serverProcess.kill();
}


module.exports = {
  create,
  shutDown,
}
*/

/*
if (require.main) {
  // const p = create({
  //   host: 'localhost',
  //   port: 8080,
  //   onCloseOrDisconnect: console.log,
  //   docroot: '/home/micael/Documentos/GitHub/duis/example/CB01/micalevisk/HTML',
  // });

  const p = new PHPServer({
    host: 'localhost',
    port: 8080,
  });

  p.initServer('/home/micael/Documentos/GitHub/duis/example/CB01/micalevisk/HTML')
  p.terminal.on('data', data => console.log( data.toString() ));
  p.terminal.on('data', data => console.error( data.toString() )); // requests log

  setTimeout(() => {
    p.shutDown()
  }, 5000);
}
*/
