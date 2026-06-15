import 'dotenv/config'; // Yeh line sabse top par honi chahiye
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// ==========================================
// 1. DATABASE MODEL FOR TRANSCRIPT
// ==========================================
const meetingHistorySchema = new mongoose.Schema({
    meetingUrl: { type: String, required: true },
    transcriptData: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Avoid OverwriteModelError in case of hot-reloads
const MeetingHistory = mongoose.models.MeetingHistory || mongoose.model('MeetingHistory', meetingHistorySchema);

// ==========================================
// 2. API ROUTE TO SAVE TRANSCRIPT
// ==========================================
app.post('/api/save-transcript', async (req, res) => {
    try {
        const { meetingUrl, transcriptData, date } = req.body;

        const newHistory = new MeetingHistory({
            meetingUrl,
            transcriptData,
            date
        });

        await newHistory.save();

        console.log("Success: Transcript saved to Database!");
        res.status(200).json({ message: "Saved perfectly!" });
    } catch (error) {
        console.error("Error saving transcript:", error);
        res.status(500).json({ error: "Failed to save transcript" });
    }
});
// ==========================================

const start = async () => {
    // Database connection string from .env file
    const dbURI = process.env.MONGO_URI;

    try {
        const connectionDb = await mongoose.connect(dbURI);
        
        console.log(`Successfully connected to MongoDB: ${connectionDb.connection.name}`);
        console.log(`Host: ${connectionDb.connection.host}`);
        
        server.listen(app.get("port"), () => {
            console.log("SERVER LISTENING ON PORT 8000");
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); // Exit process if DB connection fails
    }
}

start();