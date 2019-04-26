const Listr = require('listr');
const input = require('listr-input');

const list = new Listr([
    {
        title: 'Retrieving data',
        task: () => input('Credentials', {
            //secret: true,
            validate: value => value.length > 0,
            done: credentials => setTimeout(() => console.log(credentials), 3000)
        })
    }
]);

list.run();
