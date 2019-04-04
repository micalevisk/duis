// https://www.npmjs.com/package/open

const open = require('open');

(async () => {
  try {
  // Opens the image in the default image viewer
  // await open('unicorn.png', {wait: true});
  // console.log('The image viewer app closed');

  // Opens the url in the default browser
  // await open('https://google.com');

  // Specify the app to open in
  // await open('https://google.com', {app: 'firefox'});

  console.log('vai abrir')

  await open('https://google.com', {
    wait: true,
    app: ['google-chrome', '--incognito'],
  });

  console.log('fechou')

  } catch (err) {
    console.log(err)
  }
})();
