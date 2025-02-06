import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
import weather from 'weather-js';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';

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
const server = http.createServer(app);
const io = new Server(server);
const port = 3005;

const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
  uri: "mongodb+srv://sreeharshat27:fzvoEddUb4ntakmJ@cluster0.tpluz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/tourism",
  collection: "sessions",
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
  systemInstruction: "You are Bluebot, a friendly assistant for ExploreLikeALocal. Help users discover amazing places and provide detailed information about locations, culture, and travel tips."
});

// Middleware setup
app.use(session({
  secret: "s3cUr3$K3y@123!",
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 182 * 24 * 60 * 60 * 1000 },
  store: store,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(morgan('combined', { stream: accessLogStream }));

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle real-time location sharing
  socket.on('shareLocation', (data) => {
    socket.broadcast.emit('newLocation', data);
  });

  // Handle virtual tour guide requests
  socket.on('requestGuide', async (location) => {
    try {
      const result = await model.generateContent(`Tell me about ${location} as a tour guide`);
      socket.emit('guideResponse', result.response.text());
    } catch (error) {
      console.error('Error generating guide content:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Weather API Route
app.get('/api/weather/:location', (req, res) => {
  weather.find({ search: req.params.location, degreeType: 'C' }, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching weather data' });
    res.json(result);
  });
});

// AI Travel Recommendations
app.post('/api/recommendations', async (req, res) => {
  const { location, preferences } = req.body;
  try {
    const prompt = `Suggest 5 must-visit places in ${location} for someone interested in ${preferences.join(', ')}`;
    const result = await model.generateContent(prompt);
    res.json({ recommendations: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: 'Error generating recommendations' });
  }
});

// Existing routes...
app.get("/", (req, res) => {
  const sessionUserId = req.session.userId;
  if (sessionUserId) {
    res.redirect("/main");
    return;
  }
  res.sendFile(path.join(__dirname, "./landing.html"));
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});