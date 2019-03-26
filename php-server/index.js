// @ts-check
const { exec, spawn } = require('child_process');
const { platform } = require('os');

class Server {

  constructor(host, port, paths = {}, phpPath = 'php') {
    this.host = host;
    this.port = port;
    this.phpPath = phpPath;
    this.extensionPath = paths.extension;
    this.relativePath = paths.relative;
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

    if (platform() === 'win32') {
      args.push(`${this.extensionPath}\\src\\logger.php`);
      process.env.PHP_SERVER_RELATIVE_PATH = this.relativePath;
    }

    return args;
  }

  execBrowser(browser, fullFileName) {
    const host = this.host;
    const port = this.port;
    const fileName = fullFileName; // this.fullToRelativeFileName(fullFileName);

    switch (browser.toLowerCase()) {
      case "firefox":
        if (platform() === 'linux') {
          browser = `${browser} http://${host}:${port}/${fileName}`;
        } else if (platform() === "win32") {
          browser = `start ${browser} http://${host}:${port}/${fileName}`;
        } else if (platform() === 'darwin') {
          browser = `open -a "Firefox" http://${host}:${port}/${fileName}`;
        } else {
          browser = '';
        }
        break;
      case "chrome":
        if (platform() === 'linux') {
          browser = `google-chrome http://${host}:${port}/${fileName}`;
        } else if (platform() === "win32") {
          browser = `start ${browser} http://${host}:${port}/${fileName}`;
        } else if (platform() === 'darwin') {
          browser = `open -a "Google Chrome" http://${host}:${port}/${fileName}`;
        } else {
          browser = '';
        }
        break;
      case "edge":
        if (platform() === 'win32') {
          browser = `start microsoft-edge:http://${host}:${port}/${fileName}`;
        } else {
          browser = '';
        }
        break;
      case "safari":
        if (platform() === 'darwin') {
          browser = `open -a "Safari" http://${host}:${port}/${fileName}`;
        } else {
          browser = '';
        }
    }
    if (browser !== "") {
      exec(browser);
    }

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

    this.terminal.on('close', code => {
      this.shutDown();
      console.error('Server Stopped');
    });

    return this;
  }

}

const port = process.env.PORT || 3000
const hostname = 'localhost'
const browser = 'chrome'

/* Example
new Server(hostname, port, {relative: './'})
  .createServer('/home/micael/Documentos/GitHub/duis/example/CB01/micalevisk/PHP1')
  .then(server => server.execBrowser(browser, 'index'))
*/
