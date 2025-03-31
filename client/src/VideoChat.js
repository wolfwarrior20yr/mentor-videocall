// Backend (server.js) - Mentor VideoChat WebRTC Signaling Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
});

app.use(cors());

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send user's own ID
  socket.emit('me', socket.id);

  socket.on('callUser', ({ userToCall, signalData, from }) => {
    io.to(userToCall).emit('callIncoming', { signal: signalData, from });
  });

  socket.on('answerCall', ({ to, signal }) => {
    io.to(to).emit('callAccepted', signal);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('callEnded');
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Mentor VideoChat server running on port ${PORT}`));
