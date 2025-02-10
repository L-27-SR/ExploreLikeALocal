import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import path from "path";
import axios from "axios";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import MongoStore from 'connect-mongo';

dotenv.config();

// Path and app setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exploreLocal', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// User Schema Definition
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './FrontEnd/Templates')));
app.use(express.static(path.join(__dirname, './FrontEnd/Static')));
app.use('/js', express.static(path.join(__dirname, './FrontEnd/Static/js')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/exploreLocal',
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

const API_KEY = process.env.NEWS_API_KEY;

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Create new user
        const user = new User({ username, email, password });
        await user.save();
        
        // Set session
        req.session.userId = user._id;
        res.json({ message: 'Registration successful', redirect: '/main' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Set session
        req.session.userId = user._id;
        res.json({ message: 'Login successful', redirect: '/main' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful', redirect: '/login' });
    });
});
app.get('/api/guest-login', async (req, res) => {
    try {
        // Create a temporary guest user or use a predefined guest account
        const guestUser = await User.findOne({ username: 'guest' });
        
        if (!guestUser) {
            return res.status(400).json({ error: 'Guest account not configured' });
        }
        
        // Set session for guest user
        req.session.userId = guestUser._id;
        res.json({ message: 'Guest login successful', redirect: '/main' });
    } catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ error: 'Guest login failed' });
    }
});
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

app.get('/currency', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/currency.html'));
});

app.get('/main', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/main.html'));
});

app.get('/map', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/map.html'));
});

app.get('/maps', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/maps.html'));
});

app.get('/planning', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/planning.html'));
});

app.get('/translate', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/translate.html'));
});

app.get('/weather', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/weather.html'));
});

app.get('/news', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/news.html'));
});

// News API Route
const categoryQueries = {
    karnataka: 'Karnataka OR Bengaluru OR Mysuru news',
    india: 'India news -Karnataka',
    international: 'world news -India',
    sports: 'India sports cricket',
    tourism: 'India tourism travel'
};

app.get('/api/news/:category', requireAuth, async (req, res) => {
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

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    res.redirect(`https://via.placeholder.com/${width}x${height}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Server startup
const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

export default app;