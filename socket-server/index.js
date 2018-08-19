const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const SOCKET_PORT = process.env.SOCKET_PORT || 3000;

io.on('connection', function (socket) {
	console.log('a user connected');

	socket.on('message', message => {
		socket.broadcast.emit('message', message);
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

http.listen(SOCKET_PORT, function () {
	console.log('listening on localhost:' + SOCKET_PORT);
});