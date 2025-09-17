import express from "express";
import twig from "twig";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

const prisma = new PrismaClient();
import nodemailer from "nodemailer";
import crypto from "crypto";

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express et serveur HTTP
const app = express();
// Trust proxy pour sécuriser les cookies derrière un proxy
app.set("trust proxy", 1);

// Config Twig
app.set("views", join(__dirname, "views"));
app.set("view engine", "twig");
app.engine("twig", twig.renderFile);

// Fichiers statiques
app.use(express.static(join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ajout pour parser le JSON envoyé par le client

// Configuration CORS
app.use(
  cors({
    origin: process.env.FRONT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Session sécurisée
import session from "express-session";
app.use(
  session({
    secret: "chatappsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.FRONT_URL ? "none" : "lax",
      domain: process.env.FRONT_URL
        ? new URL(process.env.FRONT_URL).hostname
        : undefined,
    },
  })
);

// Route principale
app.get("/", (req, res) => {
  res.render("index.twig");
});

// Route de login
app.post("/login", async (req, res) => {
  const { pseudo, password } = req.body;
  try {
    if (!pseudo || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Pseudo et mot de passe requis" });
    }
    // Recherche l'utilisateur par pseudo
    const user = await prisma.user.findFirst({ where: { pseudo } });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (req.session) {
        req.session.user = pseudo;
      }
      if (user.isActive !== 1) {
        return res
          .status(401)
          .json({ success: false, error: "Compte non activé" });
      }
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
app.get("/me", (req, res) => {
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

app.get("/register", (req, res) => {
  const success = req.session.registerSuccess;
  req.session.registerSuccess = undefined;
  res.render("register.twig", {
    success,
    message: success ? "Inscription réussie ! Consultez vos mails pour valider votre compte." : null
  });
});

app.post("/register", async (req, res) => {
  const { pseudo, email, password } = req.body;
  // Vérifie si l'email existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ success: false, error: "Cet email est déjà utilisé." });
  }
  console.log('Début inscription', { pseudo, email });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe hashé');
    // Génère un token de validation unique
    const validationToken = crypto.randomBytes(32).toString('hex');
    console.log('Token généré:', validationToken);

    // Crée l'utilisateur avec le token
    const user = await prisma.user.create({
      data: {
        pseudo: pseudo,
        email: email,
        password: hashedPassword,
        validationToken: validationToken,
        isVerified: false
      }
    });
    console.log('Utilisateur créé:', user);

    // Configure Nodemailer avec Mailtrap
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: 'cf72de10d4c51f', // Remplace par ton user Mailtrap
        pass: '85861728887303'  // Remplace par ton pass Mailtrap
      }
    });
    console.log('Transporteur Nodemailer prêt');

    // Prépare le mail de validation
    const validationUrl = `http://localhost:3000/validate/${validationToken}`;
    await transporter.sendMail({
      from: 'no-reply@chatapp.com',
      to: email,
      subject: 'Validation de votre compte',
      html: `<p>Bienvenue ${pseudo} !</p><p>Merci de valider votre compte en cliquant sur ce lien : <a href="${validationUrl}">${validationUrl}</a></p>`
    });
    console.log('Mail envoyé');

  req.session.registerSuccess = true;
  res.redirect('/register');
  } catch (err) {
    console.error('Erreur inscription:', err, JSON.stringify(err));
    res.status(500).json({ success: false, error: "Erreur lors de l'inscription" });
  }
});
// Route de validation de compte
app.get("/validate/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where: { validationToken: token },
    });
    if (!user) {
      return res.status(400).send("Lien de validation invalide ou expiré.");
    }
    if (user.isVerified) {
      return res.send("Votre compte est déjà validé.");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, validationToken: null },
    });
    res.redirect('/');
  } catch (err) {
    console.error("Erreur validation:", err);
    res.status(500).send("Erreur lors de la validation du compte.");
  }
});
export default app;
