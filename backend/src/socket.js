const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.clinicId = decoded.clinic_id;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join clinic room
    if (socket.clinicId) {
      socket.join(`clinic-${socket.clinicId}`);
      console.log(`📍 User joined clinic-${socket.clinicId}`);
    }

    // Join user's personal room for notifications
    socket.join(`user-${socket.userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });

    // Mark notification as read
    socket.on('notification:read', async (notificationId) => {
      try {
        const db = socket.db || require('./app').knex;
        await db('notifications')
          .where({ id: notificationId, user_id: socket.userId })
          .update({ is_read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit functions
function emitToClinic(clinicId, event, data) {
  const io = getIO();
  io.to(`clinic-${clinicId}`).emit(event, data);
}

function emitToUser(userId, event, data) {
  const io = getIO();
  io.to(`user-${userId}`).emit(event, data);
}

function emitToAll(event, data) {
  const io = getIO();
  io.emit(event, data);
}

module.exports = {
  initializeSocket,
  getIO,
  emitToClinic,
  emitToUser,
  emitToAll
};