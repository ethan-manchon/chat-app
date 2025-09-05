const express = require('express');
const path = require('path');

const http = require('http');
const { Server } = require("socket.io");
const { renderFile } = require('twig');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'twig');
app.set('views', './views');
app.engine('twig', renderFile);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index.twig');
});

io.on('connection', (socket) => {
    console.log('a user connected');
      socket.on('chat message', (data) => {
          io.emit('chat message', {
            pseudo: data.pseudo,
            message: data.message
      });
      });
   });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});