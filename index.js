const express = require('express');
const app = express();
const PORT = 8080 || process.env.PORT;

app.use('/src', express.static('src'))

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, function () {
	console.log('listening on localhost:' + PORT);
});