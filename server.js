const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Use dynamic port for Render deployment or fallback to 5000
const port = process.env.PORT || 5000;

// Middleware for CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Root route to test the server
app.get("/", (req, res) => {
  res.send("Welcome to the Mentor Video Call App!");
});

// Setup socket.io server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (change this for production security)
    methods: ["GET", "POST"],
  },
});

// Event listeners for socket connections
io.on("connection", (socket) => {
  console.log(`✅ New user connected: ${socket.id}`);

  // Emit the user's socket ID to them
  socket.emit("your-id", socket.id);

  // Handle incoming call requests
  socket.on("call-user", ({ userToCall, signalData, from }) => {
    console.log(`📞 Call from ${from} to ${userToCall}`);
    io.to(userToCall).emit("call-user", { signal: signalData, from });
  });

  // Handle accepting a call
  socket.on("accept-call", ({ to, signal }) => {
    console.log(`✔️ Call accepted by ${to}`);
    io.to(to).emit("call-accepted", signal);
  });

  // Handle ending a call
  socket.on("end-call", ({ to }) => {
    console.log(`❌ Call ended by ${socket.id}`);
    io.to(to).emit("call-ended");
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`🚪 User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❗ Server error:", err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
