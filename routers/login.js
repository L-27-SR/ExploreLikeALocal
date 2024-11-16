import express from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import user from "../models/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

mongoose.connect("mongodb://localhost/seasavvy")
    .then(()=> console.log("Connected to database"))
    .catch((err)=> console.log(`Error : ${err}`));

router.get("/", (req, res) => {
    console.log("New login request");
    res.sendFile(path.resolve(__dirname, "../../Frontend/public/login.html"));
})

router.post("/", async (req, res) => {
    const { email, password } = req.body;
    try {
        const findEmail = await user.findOne({email : email});
        const logUser = await user.findOne({email : email, password : password});
        if(logUser) {
            req.session.userId = logUser._id;
            console.log("Login successfull. User has been redirected to /main");
            res.redirect("/home");
        }
        else if (!logUser && findEmail) {
            res.status(401).send('Invalid login');
        }
        else {
            res.status(401).send("Email does not exist");
        }
    }
    catch(err) {
        res.status(500).send("Server error. Try again later");
    }
});

export default router;