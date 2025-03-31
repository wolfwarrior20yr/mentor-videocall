const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);
  socket.emit("your-id", socket.id);

  socket.on("call-user", ({ userToCall, signalData, from }) => {
    io.to(userToCall).emit("call-user", { signal: signalData, from });
  });

  socket.on("accept-call", ({ to, signal }) => {
    io.to(to).emit("call-accepted", signal);
  });

  socket.on("end-call", ({ to }) => {
    io.to(to).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
