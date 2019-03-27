//const child_process = require('child_process')
//child_process.execFileSync('npm', ['init'], {stdio: 'inherit'});

const shell = require('shelljs');
/* 
if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}
*/

//const x  = shell.exec('git rev-parse --short master', {silent:true});
//const x  = shell.exec('cat .git/refs/heads/master', {silent:true});

// git --git-dir './foo/.git'  rev-parse --short master
//const x  = shell.exec('git --git-dir "./.git" rev-parse --short master', {silent:true});

// git --git-dir './foo/.git'  git rev-list -1 --before="2019-03-27T00:59:59" --abbrev-commit master
const x  = shell.exec('git --git-dir "./.git" rev-list -1 --until="2019-03-27" --abbrev-commit master', {silent:true}); // HASH do ultimo commit antes do dia 28/03
console.log('[stdout]', x.stdout)
console.log('[stderr]', x.stderr)
console.log('[code]', x.code)
