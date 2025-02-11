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

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exploreLocal')
    .then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// User Schema remains the same
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

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', userSchema);

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './FrontEnd/Templates')));
app.use(express.static(path.join(__dirname, './FrontEnd/Static')));
app.use('/js', express.static(path.join(__dirname, './FrontEnd/Static/js')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const API_KEY = process.env.NEWS_API_KEY;

// Modified authentication middleware to be optional
const checkAuth = (req, res, next) => {
    if (req.session.userId) {
        req.isAuthenticated = true;
    } else {
        req.isAuthenticated = false;
    }
    next();
};

// Authentication Routes (unchanged)
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        const user = new User({ username, email, password });
        await user.save();
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
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
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
        res.json({ message: 'Logout successful', redirect: '/' });
    });
});

// Modified page routes to use checkAuth instead of requireAuth
app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '/FrontEnd/Templates/landing.html'));
});

app.get('/about', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/about.html'));
});

app.get('/login', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/login.html'));
});

// Routes that can benefit from authentication but don't require it
app.get('/currency', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/currency.html'));
});

app.get('/main', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/main.html'));
});

app.get('/map', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/map.html'));
});

app.get('/maps', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/maps.html'));
});

app.get('/planning', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/planning.html'));
});

app.get('/translate', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/translate.html'));
});

app.get('/weather', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/weather.html'));
});

app.get('/news', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, './FrontEnd/Templates/news.html'));
});

// Modified news API route to use checkAuth
app.get('/api/news/:category', checkAuth, async (req, res) => {
    const categoryQueries = {
        karnataka: 'Karnataka OR Bengaluru OR Mysuru news',
        india: 'India news -Karnataka',
        international: 'world news -India',
        sports: 'India sports cricket',
        tourism: 'India tourism travel'
    };

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

// Other routes remain the same
app.get('/api/placeholder/:width/:height', (req, res) => {
    res.redirect(`https://via.placeholder.com/${width}x${height}`);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

export default app;