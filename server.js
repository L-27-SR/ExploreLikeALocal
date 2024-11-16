import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import signupRouter from './routes/signUp.js';
import loginRouter from "./routes/login.js";
import homeRouter from "./routes/home.js";
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const router = express.Router();
const port = 3005;
const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
  uri : "mongodb://localhost:27017/tourism",
  collection : "sessions",
});
store.on('error', function(error) {
  console.error(error);
});

const logDirectory = path.join(__dirname, './log');
const logFile = path.join(logDirectory, 'access.log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const accessLogStream = fs.createWriteStream(logFile, { flags: 'a' });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: "You are Bluebot a friendly assistant for an ocean education through gamification website that teaches people from diverse backgrounds about the ocean. You must help people navigate through the website and also must respond to their questions about the ocean. You must also provide small snippet facts about the ocean and weather. \nThe name of the website is Sea Savvy. It currently does not have any social pages. The user must sign up for accessing content. It builds user engagement and has 3 main sections. The first is Sea Quest which is a fun ocean game that is personalised according to the user's role provided by the user at signup. The user navigates the oceans of the world interacting with different elements and weather conditions. The user may lose or gain points depending on his/her role chosen and their interaction. The user must try to  maximise their points and compete on the global leaderboards. The user would play the game with the role they have chosen during signup and cannot be changed in the SeaQuest section.\nSeaqeust gathers data from INCOIS API and simulates weather conditions in precise locations around the global waters. The user may interact with these simulations.\nFor an example. If a user is a fisherman, he may lose points by venturing far into the global waters beynd the territorial waters of his country. He could gain points by moving towards regions of high tide along the coast as it benefits him in catching fish washed up to the shores. A fisherman may select his country inside the SeaQuest game.\nSimilarly if a person has chosen a tourism operator as his role, he may lose points if he navigates himself towards regions of high gales and storms. However he might gain points if he navigates towards regions of high biodiversity.\nAll the information regarding a users points, level, weekly streak, leaderboard ranking, reward redeeming, badges etc are available in the Points and rewards section. There would be additions of various seasons and ranking systems that the user can compete in.\nUsers can also gain points by accessing and going through articles or magazines that have been put up in the Sea Scholar section. Reading articles helps add to points and build up weekly streaks that increase the points by a multiplier.\nThere are articles in a variety of languages and topics including tides, survival at the sea, biodiversity, corals, sea terrains and topography, identifying zones and territorial demarkations etc. \nMarine monitor is another section that displays realtime information about weather at the ocean. There are news articles that are pushed through the feed. Live alerts about warnings and advisories by the meteorological departments are accessible conveniently in this section\nA user can edit their role, username, name, password etc by heading to the profile section. The user can also delete their account this way. Points and rewards are displayed in the points and rewards section. The user may also redeem their points by getting vouchers from third party trip planning applications. This functionality has not been added yet. \n\nYou must answer the users questions in a friendly and informative manner trying to be helpful. If you do not have an answer to a question you may direct the user to the support section where they can contact the support team.  \nNever reveal other users information to users. Keep data private and dont reveal information that is not meant for the user. \nOcean related queries may be answered in a crisp manner sticking to what the user has asked. Add extra one liner facts about the ocean and weather and terrain and other information occasionally in responses.\n\n",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 100,
    responseMimeType: "text/plain",
  };

  async function run(res, qur) {
    const chatSession = model.startChat({
      generationConfig,
   // safetySettings: Adjust safety settings
   // See https://ai.google.dev/gemini-api/docs/safety-settings
      history: [
        {
          role: "user",
          parts: [
            {text: "hey\n"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "Ahoy there, matey! Welcome to Sea Savvy. What can I help you with today? 😊 \n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "how to play seagame\n"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "Aye, let me guide ye on how to navigate the thrilling Sea Quest! \n\n1. **Sign Up:** Create your free account on Sea Savvy. You'll choose a role – like a fisherman, tourism operator, or marine biologist – each with unique advantages and challenges! \n\n2. **Set Sail:** Once you're in Sea Quest, you'll find yourself on the vast ocean. Use your map and compass to navigate! \n\n3. **Weather Watch:** Sea Quest uses real-time weather data, so pay attention to the conditions! Storms and high tides might affect your points differently based on your role.\n\n4. **Make Waves:**  As you navigate, you'll encounter challenges and opportunities.  Make decisions based on your role. For example, a fisherman might want to head towards areas with abundant marine life!\n\n5. **Score High:** Earn points by making smart decisions and completing challenges.  Compete on the global leaderboard and become a true Sea Savvy legend! \n\nRemember: Each role interacts with the ocean differently.  What helps a fisherman might hurt a tourism operator! Choose wisely! \n\nGood luck, and may the tides be in your favor! 🌊 \n"},
          ],
        },
      ],
    });
  
    const result = await chatSession.sendMessage(qur);
    res.json({response : result.response.text()});
    console.log(result.response.text());
  }
  
app.use(session({
  secret : "s3cUr3$K3y@123!",
  saveUninitialized : false,
  resave : false,
  cookie : {
    maxAge: 182 * 24 * 60 * 60 * 1000,
  },
  store: store,
}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname));

app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());



app.get("/", (req, res) => {
    const sessionUserId = req.session.userId;
    console.log("Session User ID:", sessionUserId);  // Debugging log
    if(sessionUserId) {
        res.redirect("/home");
        return;
    }
    res.sendFile(path.join(__dirname, "./landing.html"));
});


app.use("/signup", signupRouter);
app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/home", homeRouter);
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          return res.status(500).send('Error logging out');
      }
      res.redirect("/");
  });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
