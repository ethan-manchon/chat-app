import express from 'express';
import path from 'path';
import {dirname} from 'path';

import http from 'http';
import { Server } from "socket.io";
import twig from 'twig';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { renderFile } = twig;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Fonction pour récupérer tous les messages
async function getAllMessages() {
    return await prisma.message.findMany({
        orderBy: {
            createdAt: 'asc'
        }
    });
}


app.set('view engine', 'twig');
app.set('views', './views');
app.set('chat', './chat');

app.engine('twig', renderFile);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    // On peut passer le pseudo en paramètre si besoin
    res.render('index.twig', { pseudo: req.query.pseudo || '' });
});

io.on('connection', (socket) => {
    console.log('la connexion est établie');
    // Envoie les anciens messages au client lors de la connexion
    getAllMessages().then(messages => {
        socket.emit('old messages', messages);
    });
    socket.on('chat message', (data) => {
        // Validation basique côté serveur
        const pseudo = typeof data.pseudo === 'string' ? data.pseudo.trim() : '';
        const message = typeof data.message === 'string' ? data.message.trim() : '';
        if (pseudo && message) {
            io.emit('chat message', {
                pseudo,
                message
            });
            (async () => {
                try {
                    await prisma.message.create({
                        data: {
                            author: pseudo,
                            message: message
                        }
                    });
                } catch (error) {
                    console.error('Error creating message:', error);
                }
            })();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});