import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
import { body, validationResult } from 'express-validator';
import fs from "fs";
import path from "path";
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";
import cookieParser from "cookie-parser";
import user from './models/user.js';
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
mongoose.connect("mongodb://localhost:27017/tourism", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Path and app setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3005;
const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
  uri : "mongodb+srv://sreeharshat27:fzvoEddUb4ntakmJ@cluster0.tpluz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/tourism",
  collection : "sessions",
});

// MongoDB Session store error handling
store.on('error', function(error) {
  console.error("Session Store Error: ", error);
});

// Logger setup
const logDirectory = path.join(__dirname, './log');
const logFile = path.join(logDirectory, 'access.log');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);
const accessLogStream = fs.createWriteStream(logFile, { flags: 'a' });

// Generative AI Setup
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: "You are Bluebot, a friendly assistant for Sea Savvy. Help users with ocean education through gamification, answering questions about the ocean, weather, and guiding them through the Sea Quest game. Don't reveal private information. Respond in a friendly and informative manner."
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 100,
  responseMimeType: "text/plain",
};

// AI function to process user queries
async function runAI(res, query) {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      { role: "user", parts: [{ text: query }] },
    ],
  });

  const result = await chatSession.sendMessage(query);
  res.json({ response: result.response.text() });
}

// Middleware setup
app.use(session({
  secret: "s3cUr3$K3y@123!",
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 182 * 24 * 60 * 60 * 1000 },
  store: store,
}));

// Body parser for handling request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files setup (landing page, etc.)
app.use(express.static(__dirname));

// Log all incoming requests
app.use(morgan('combined', { stream: accessLogStream }));

// Main route (landing page)
app.get("/", (req, res) => {
  const sessionUserId = req.session.userId;
  if (sessionUserId) {
    res.redirect("/main");
    return;
  }
  res.sendFile(path.join(__dirname, "./landing.html"));
});

app.get("/main", (req, res) => {
    const sessionUserId = req.session.userId;
    if(sessionUserId) {
        console.log(sessionUserId);
        console.log("user is found ans was redirected to main");
    }
    res.sendFile(path.join(__dirname, "./main.html"));
});

app.post(
    "/signup",
    body("password")
      .notEmpty().withMessage("Password cannot be empty")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    
    body("name")
      .notEmpty().withMessage("Name is required"),
  
    body("email")
      .isEmail().withMessage("Please enter a valid email")
      .normalizeEmail()
      .notEmpty().withMessage("Email cannot be empty"),
    
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { name, email, password } = req.body;
  
      try {
        const findName = await user.findOne({ name });
        const findEmail = await user.findOne({ email });
  
        if (findName) return res.status(400).json({ message: "Name already exists" });
        if (findEmail) return res.status(400).json({ message: "Account with this email already exists" });
  
        const newUser = new user({ name, email, password });
        await newUser.save();
  
        req.session.userId = newUser._id;
  
        res.redirect("/main");
      } catch (err) {
        return res.status(500).send("Server error. Please try again later.");
      }
    }
  );
app.post("/login", async (req, res) => {
    console.log("Reached login route");
  
    // Check if user is already logged in (session exists)
    if (req.session.userId) {
      return res.redirect("/main"); // Redirect to /main if session already exists
    }
  
    const { email, password } = req.body;
  
    try {
      // Find user by email and password
      const logUser = await user.findOne({ email, password });
  
      if (logUser) {
        req.session.userId = logUser._id;  // Store user ID in session
        console.log("Login successful");
        return res.redirect("/main"); // Redirect to /main after successful login
      } else {
        console.log("Invalid credentials");
        return res.status(401).send("Invalid email or password");
      }
    } catch (err) {
      console.error("Server error:", err);
      return res.status(500).send("Server error. Please try again later.");
    }
  });

  app.post("/map", async (req, res) => {
    console.log("Entering map");
    const data = req.body;
    console.log(data);
    res.json({data});
});

  

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect("/");
  });
});

// AI Query route (for handling user queries)
app.post('/query', (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  runAI(res, query);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
