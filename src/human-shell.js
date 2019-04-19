const fs = require('fs')
const sh = require('shelljs')

// sh.config.silent = true
sh.config.verbose = false
// sh.set('-v')

function throwingError(method, ...args) {
  const evalReturn = sh[method](...args)
  if (evalReturn.code) throw new Error(evalReturn.stderr)
  return evalReturn
}

const humanShell = {

  /** @param {string} programName */
  hasProgram(programName) {
    return !!sh.which(programName)
  },

  /** @param {string} path */
  enterOnDir(path) {
    return !throwingError('cd',
      path,
    ).code
  },

  /** @param {string} path */
  isReadableFile(path) {
    try {
      const canAcess = !fs.accessSync(path, fs.constants.R_OK)
      if (canAcess) return fs.statSync(path).isFile()
    } catch (err) {
      return false
    }
  },

  /** @param {string} path */
  isDirectory(path) {
    return sh.test('-d', path)
  },

  /** @param {string} path */
  createDirIfNotExists(path) {
    return !throwingError('mkdir',
      '-p',
      path,
    ).code
  },

  /** @param {string} path */
  createFileIfNotExists(path) {
    return !throwingError('touch',
      path,
    ).code
  },

  /** @param {string} path */
  listDirectoriesFrom(path) {
    const [...dirs] = throwingError('ls',
      '-d',
      path,
    )

    return dirs
  },

  /** @param {string} command */
  runSafe(command) {
    if (typeof command !== 'string') return ''
    return throwingError('exec', command).stdout.trim()
  }
}


module.exports = Object.assign(sh, humanShell)
