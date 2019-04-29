// @ts-check
const open = require('open')
const platform = require('os').platform()

const browsersAppByPlataform = {
  linux: {
    chrome: 'google-chrome',
    firefox: 'linux',
  },

  win32: {
    chrome: 'start chrome',
    firefox: 'start firefox',
  },

  darwin: {
    chrome: 'google chrome',
    firefox: 'firefox',
    safari: 'safari',
  },
}

/**
 *
 * @param {string} name
 * @param {Object} options
 * @param {string} [options.path = '']
 * @param {string} [options.opts = '']
 * @param {boolean} [options.isFile = false]
 */
async function openBrowser(name, { path = '', opts = '', isFile = false } = {}) {
  if (isFile) {
    path = 'file:///' + path
  }

  if (name && name.trim()) {
    const appName = browsersAppByPlataform[platform][name]
    const appOptions = opts.split(' ')

    return open(path, { app: [appName, appOptions] })
  }

  return open(path)
}

module.exports = openBrowser
