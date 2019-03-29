//#region utils
String.prototype.isEmpty = function () { return !this.trim(); }
String.prototype.toJSON  = function () { return this.isEmpty() ? '' : JSON.parse(this.replace(/'/g, '"')); }
const clearModuleFromCache = moduleName => delete require.cache[require.resolve(moduleName)];
const loadJSON = filename => clearModuleFromCache(filename) && require(filename);
//#endregion
