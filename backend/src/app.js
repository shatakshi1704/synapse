import 'dotenv/config'; 
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

// Initialize Socket.io with production-ready CORS
const io = connectToSocket(server);

// --- PRODUCTION SECURITY: RESTRICTED CORS ---
app.use(cors({
    origin: process.env.FRONTEND_URL || "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// Root health check for deployment monitoring
app.get("/", (req, res) => {
    res.status(200).send("Synapse Backend is running smoothly.");
});

// ==========================================
// TRANSCRIPT API (Cleaned)
// ==========================================
const meetingHistorySchema = new mongoose.Schema({
    meetingUrl: { type: String, required: true },
    transcriptData: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const MeetingHistory = mongoose.models.MeetingHistory || mongoose.model('MeetingHistory', meetingHistorySchema);

app.post('/api/save-transcript', async (req, res) => {
    try {
        const { meetingUrl, transcriptData, date } = req.body;
        if (!meetingUrl || !transcriptData) return res.status(400).json({ error: "Missing data" });

        await MeetingHistory.create({ meetingUrl, transcriptData, date });
        res.status(200).json({ message: "Saved perfectly!" });
    } catch (error) {
        console.error("Error saving transcript:", error);
        res.status(500).json({ error: "Failed to save transcript" });
    }
});

const start = async () => {
    const dbURI = process.env.MONGO_URI;
    const PORT = process.env.PORT || 8000;

    if (!dbURI) {
        console.error("FATAL ERROR: MONGO_URI is not defined in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(dbURI);
        console.log(`Connected to MongoDB`);
        
        server.listen(PORT, () => {
            console.log(`SERVER LISTENING ON PORT ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

start();