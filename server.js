import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import weather from 'weather-js';
import { Server } from 'socket.io';

// Path and app setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './FrontEnd/Templates')));
app.use(express.static(path.join(__dirname, './FrontEnd/Static')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/FrontEnd/Templates/landing.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/about.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/login.html'));
});
app.get('/currency', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/currency.html'));
});
app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/main.html'));
});
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/map.html'));
});
app.get('/maps', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/maps.html'));
});
app.get('/planning', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/planning.html'));
});
app.get('/translate', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/translate.html'));
});
app.get('/weather', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/weather.html'));
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
export default app;