import express from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import user from "../models/user.js";
import {validationResult, body} from "express-validator";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

mongoose.connect("mongodb://localhost/tourism")
    .then(()=> console.log("Connected to database"))
    .catch((err)=> console.log(`Error : ${err}`));

router.post("/", 
body("name")
.notEmpty()
.withMessage("Name cannot be empty"),

body("email")
.notEmpty()
.withMessage("Email cannot be empty")
.isEmail()
.withMessage("Please provide a valid email address"),

body("password")
.notEmpty()
.withMessage("Password cannot be empty")
.isLength({ min: 8 })
.withMessage("Password must be at least 8 characters long")
.matches(/\d/)
.withMessage("Password must contain at least one number")
/*.matches(/[A-Z]/)
.withMessage("Password must contain at least one uppercase letter")
.matches(/[a-z]/)
.withMessage("Password must contain at least one lowercase letter")
.matches(/[@$!%*?&#]/)
.withMessage("Password must contain at least one special character (@, $, !, %, *, ?, &, #)")*/,

async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {body} = req;
    const {name, email} = req.body;    
    try {
        const findUsername = await user.findOne({name : name});
        const findEmail = await user.findOne({email : email});
        if(findUsername) {
            return res.status(400).json({message : "Username already exists"});
        }
        if(findEmail) {
            return res.status(400).json({message : "Account already exists"});
        }
        const newUser = new user(body);
        await newUser.save();
        req.session.userId = newUser._id;
        res.redirect("/home");
        console.log("User has been signed in and redirected to /home");
    }
    catch(err) {
        console.log(`Error : ${err}`);
    }
});

export default router;
