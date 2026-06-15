import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide both username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }
    } catch (e) {
        console.error("Login Error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        const savedUser = await newUser.save();
        console.log("User registered successfully:", savedUser._id);

        res.status(httpStatus.CREATED).json({ message: "User Registered Successfully" });
    } catch (e) {
        console.error("Registration Error:", e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Token" });
        
        // 1. Fetch metadata meetings
        const meetings = await Meeting.find({ user_id: user.username }).lean();
        
        // 2. Fetch raw transcript collection
        const transcripts = await mongoose.connection.db.collection('meetinghistories').find({}).toArray();

        // 3. Debugger log for terminal inspection
        console.log(`\n--- DEBUGGER: Found ${meetings.length} meetings and ${transcripts.length} transcripts ---`);

        // 4. Enhanced Stitching Logic
        const enrichedMeetings = meetings.map(meeting => {
            const matchingTranscript = transcripts.find(t => {
                if (!t.meetingUrl) return false;
                
                // Sanitize and normalize for matching
                const urlRoomCode = decodeURIComponent(t.meetingUrl.split('/').pop()).trim().toLowerCase();
                const currentMeetingCode = String(meeting.meetingCode || '').trim().toLowerCase();
                
                return urlRoomCode === currentMeetingCode;
            });

            return {
                ...meeting,
                transcriptData: matchingTranscript ? matchingTranscript.transcriptData : ""
            };
        });

        res.status(httpStatus.OK).json(enrichedMeetings);
    } catch (e) {
        console.error("History Fetch Error:", e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Token" });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        console.error("Add History Error:", e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { login, register, getUserHistory, addToHistory };