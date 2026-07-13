const { Server } = require('socket.io');

function setupSocket(httpServer) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:4173'];

  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('send-message', (data) => {
      io.to(`conv:${data.conversation_id}`).emit('new-message', data);
    });
  });

  return io;
}

module.exports = { setupSocket };
