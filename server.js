import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import weather from 'weather-js';
import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

// Path and app setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './FrontEnd/Templates')));
app.use(express.static(path.join(__dirname, './FrontEnd/Static')));
app.use('/js', express.static(path.join(__dirname, './FrontEnd/Static/js')));
const API_KEY = process.env.NEWS_API_KEY;

// Page Routes
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
app.get('/news', (req, res) => {
  res.sendFile(path.join(__dirname, './FrontEnd/Templates/news.html'));
});

// API Routes
// Weather API
app.get('/api/weather/:location', (req, res) => {
  weather.find({ search: req.params.location, degreeType: 'C' }, (err, result) => {
    if (err) {
      console.error('Weather API Error:', err);
      return res.status(500).json({ error: 'Error fetching weather data' });
    }
    res.json(result);
  });
});

// AI Travel Recommendations
app.post('/api/recommendations', async (req, res) => {
  const { location, preferences } = req.body;
  
  if (!location || !preferences) {
    return res.status(400).json({ error: 'Location and preferences are required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: "You are Bluebot, a friendly assistant for ExploreLikeALocal. Help users discover amazing places and provide detailed information about locations, culture, and travel tips."
    });
    
    const prompt = `Suggest 5 must-visit places in ${location} for someone interested in ${preferences.join(', ')}. Include brief descriptions and why they would appeal to someone with these interests.`;
    const result = await model.generateContent(prompt);
    res.json({ recommendations: result.response.text() });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ error: 'Error generating recommendations' });
  }
});

// Virtual Tour Guide
app.post('/api/guide', async (req, res) => {
  const { location } = req.body;
  if (!location) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: "You are Bluebot, a friendly assistant for ExploreLikeALocal. Act as a knowledgeable local tour guide."
    });
    
    const prompt = `Act as a tour guide and tell me about ${location}. Include:
    1. Brief historical background
    2. Cultural highlights
    3. Local customs and etiquette
    4. Best time to visit
    5. Local transportation tips`;
    
    const result = await model.generateContent(prompt);
    res.json({ guide: result.response.text() });
  } catch (error) {
    console.error('Virtual Guide Error:', error);
    res.status(500).json({ error: 'Error generating tour guide content' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Handle 404
const categoryQueries = {
  karnataka: 'Karnataka OR Bengaluru OR Mysuru news',
  india: 'India news -Karnataka',
  international: 'world news -India',
  sports: 'India sports cricket',
  tourism: 'India tourism travel'
};

// API endpoint to fetch news - Move this BEFORE error handling middleware
app.get('/api/news/:category', async (req, res) => {
  const { category } = req.params;
  
  if (!categoryQueries[category]) {
      return res.status(400).json({ error: 'Invalid category' });
  }

  try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
              apiKey: API_KEY,
              q: categoryQueries[category],
              language: 'en',
              sortBy: 'publishedAt',
              pageSize: 12
          }
      });

      res.json(response.data);
  } catch (error) {
      console.error('News API Error:', error.response?.data || error.message);
      res.status(500).json({ 
          error: 'Failed to fetch news',
          details: error.response?.data || error.message
      });
  }
});

// Placeholder image endpoint - Move this BEFORE error handling middleware
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.redirect(`https://via.placeholder.com/${width}x${height}`);
});

// THEN have your error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3005;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Export for Vercel
export default app;