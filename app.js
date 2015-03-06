var connect = require('connect');
var serveStatic = require('serve-static');

connect()
    .use('/', serveStatic('src'))
    .use('/third-party', serveStatic('bower_components'))
    .listen(process.env.PORT);