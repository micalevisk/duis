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

  hasProgram(programName) {
    return !!sh.which(programName)
  },

  enterOnDir(dirPath) {
    return !throwingError('cd',
      dirPath,
    ).code
  },

  isReadableFile(path) {
    try {
      const canAcess = !fs.accessSync(path, fs.constants.R_OK)
      if (canAcess) return fs.statSync(path).isFile()
    } catch (err) {
      return false
    }
  },

  isDirectory(path) {
    return sh.test('-d', path)
  },

  createDirIfNotExists(dirPath) {
    return !throwingError('mkdir',
      '-p',
      dirPath,
    ).code
  },

  listDirectoriesFrom(path) {
    const [...dirs] = throwingError('ls',
      '-d',
      path,
    )

    return dirs
  },

  runSafe(command) {
    return throwingError('exec', command).stdout.trim()
  }
}


module.exports = Object.assign(sh, humanShell)
