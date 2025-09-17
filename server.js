import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import app from './app.js';

import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const httpServer = createServer(app);
const io = new Server(httpServer);

// Socket.IO
io.on('connection', async (socket) => {
  console.log('Un utilisateur connecté');

  // Récupérer les derniers messages (par exemple, les 50 plus récents)
  try {
    const lastMessages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    // Adapter le format pour le front
    const formattedMessages = lastMessages.map(msg => ({
      author: msg.author,
      message: msg.message
    }));
    socket.emit('chat history', formattedMessages);
  } catch (err) {
    console.error('Erreur récupération historique:', err);
  }

  socket.on('chat message', async (data) => {
    try {
      await prisma.message.create({
        data: {
          author: data.author,
          message: data.message,
        },
      });
      console.log('Message sauvegardé dans la base de données', data);
    } catch (err) {
      console.error('Erreur sauvegarde message:', err);
    }
    io.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur déconnecté');
  });
});

export { httpServer, io };