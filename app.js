import express from 'express';
import twig from 'twig';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express et serveur HTTP
const app = express();
// Trust proxy pour sécuriser les cookies derrière un proxy (ex: Heroku)
app.set('trust proxy', 1);

// Config Twig
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'twig');
app.engine('twig', twig.renderFile);

// Fichiers statiques
app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ajout pour parser le JSON envoyé par le client

// Configuration CORS
app.use(cors({
  origin: process.env.FRONT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session sécurisée
import session from 'express-session';
app.use(
  session({
    secret: "chatappsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.FRONT_URL ? 'none' : 'lax',
      domain: process.env.FRONT_URL ? new URL(process.env.FRONT_URL).hostname : undefined,
    },
  })
);

// Route principale
app.get('/', (req, res) => {
  res.render('index.twig');
});

// Route de login
app.post("/login", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ success: false, error: "Aucune donnée reçue" });
  }
  const { pseudo, password } = req.body;
  try {
    // Vérifiez que les champs existent
    if (!pseudo || !password) {
      return res.status(400).json({ success: false, error: "Pseudo et mot de passe requis" });
    }
    // Recherchez l'utilisateur avec pseudo et password
    const user = await prisma.user.findFirst({
      where: {
        pseudo: pseudo,
        password: password, // Assurez-vous que le mot de passe est stocké en clair ou hashé selon votre DB
      },
    });
    console.log("User trouvé:", user);
    if (user) {
      // Assurez-vous que le middleware de session est configuré dans votre app.js
      if (req.session) {
        req.session.user = pseudo;
      }
      console.log("Utilisateur", pseudo, "connecté");
      res.json({ success: true, pseudo });
    } else {
      res.status(401).json({ success: false, error: "Identifiants invalides" });
    }
  } catch (err) {
    console.error("Erreur connexion utilisateur:", err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Route pour récupérer l'utilisateur connecté
app.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ pseudo: req.session.user });
  } else {
    res.status(401).json({ pseudo: null });
  }
});

// Route de déconnexion
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    res.redirect("/");
  });
});

export default app;