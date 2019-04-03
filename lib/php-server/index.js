// TODO: desacoplar o browser

// @ts-check
const { exec, spawn } = require('child_process');
const platform = require('os').platform();

class PHPServer {

  constructor(host, port, opts = {}, phpPath = 'php') {
    this.host = host;
    this.port = port;
    this.phpPath = phpPath;
    this.extensionPath = opts.extension;
    this.relativePath = opts.relative;
    this.browserOpts = opts.browserOpts;
  }

  shutDown() {
    if (this.running && this.terminal !== undefined) {
      this.terminal.kill();
      this.terminal = undefined;
      this.running = false;
    }
  }

  argsToArray() {
    const args = [
      '-S', `${this.host}:${this.port}`,
      '-t', this.relativePath,
    ];

    if (platform === 'win32') {
      process.env.PHP_SERVER_RELATIVE_PATH = this.relativePath;
    }

    return args;
  }

  async createServer(rootPath) {
    this.terminal = spawn(this.phpPath, this.argsToArray(), {
      cwd: rootPath
    });

    this.terminal.stdout.on('data', (data) => {
      console.log( data.toString() );
    });

    this.terminal.stderr.on('data', (data) => {
      console.error( data.toString() );
    });

    this.terminal.on('error', (err) => {
      this.running = false;
      console.error(`Server error: ${err.stack}`);
    });

    this.terminal.on('close', (code) => {
      this.shutDown();
      console.error('Server Stopped');
    });

    return this;
  }

}

/*
if (require.main) {
  const port = process.env.PORT || 8080
  const hostname = 'localhost'
  const browser = 'chrome'

  new PHPServer(hostname, port, {relative: './', browserOpts: '-incognito'})
    .createServer('/home/micael/Documentos/GitHub/duis/example/CB01/micalevisk/PHP1')
}
*/


module.exports = PHPServer
