// @ts-check
const cp = require('child_process');
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
    // console.log('>>', this.terminal.killed)
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
   * Runs `php -S <addr>:<port> -t docroot router`.
   * Emits `error` signal if fail to listen.
   * @param {string} docroot
   * @returns {cp.ChildProcessWithoutNullStreams}
   */
  initServer(docroot = '.') {
    this.shutDown();

    const routerAbsPath = path.join(__dirname, 'router.php');

    this.terminal = cp.spawn(
      this.bin,
      this.argsToArray(docroot, routerAbsPath),
    );

    /*
    this.terminal.stdout.on('data', (data) => {
      console.log( data.toString() );
    });
    */

    this.terminal.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.match(/(failed)/i)) {
        this.terminal.emit('error', new Error(message.trim()));
      }
    });

    this.terminal.on('error', (err) => {
      this.terminal = undefined;
    });

    this.terminal.on('close', (code) => {
      this.shutDown();
    });

    return this.terminal;
  }

}

module.exports = PHPServer

/*
if (require.main) {
  const p = new PHPServer({
    host: 'localhost',
    bin: 'php',
    // port: 8080,
    port: 8000,
  }).initServer('/home/micael/Documentos/GitHub/duis/example/CB01/micalevisk/HTML')//.addListener('error', console.log)
}
*/
