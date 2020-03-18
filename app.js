var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var port = process.env.PORT || 3000;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/default.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
// setup my socket server
var io = require('socket.io')(http);
 
// io.on('connection', function(socket) {
//     console.log('new connection');

//     socket.on('move', function(msg) {
//         console.log('Got message from client: ' + msg);     
//     });
// });

io.on('connection', function(socket) {
    console.log('new connection');

    socket.on('move', function(move) {
        socket.broadcast.emit("move",move)     
    });
});