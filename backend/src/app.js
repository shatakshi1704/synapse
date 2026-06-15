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

// 1. CORS Configuration (Ye sabse important hai)
const corsOptions = {
    origin: ["https://synapse-1-8bee.onrender.com", "https://synapse-frontend.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// 2. Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: ["https://synapse-1-8bee.onrender.com", "https://synapse-frontend.onrender.com"],
        methods: ["GET", "POST"]
    }
});
connectToSocket(io); // Socket logic yahan handle hoga

// 3. Routes
app.use("/api/v1/users", userRoutes);

// 4. Transcript API
const meetingHistorySchema = new mongoose.Schema({
    meetingUrl: { type: String, required: true },
    transcriptData: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const MeetingHistory = mongoose.models.MeetingHistory || mongoose.model('MeetingHistory', meetingHistorySchema);

app.post('/api/save-transcript', async (req, res) => {
    try {
        const { meetingUrl, transcriptData } = req.body;
        if (!meetingUrl || !transcriptData) return res.status(400).json({ error: "Missing data" });

        await MeetingHistory.create({ meetingUrl, transcriptData });
        res.status(200).json({ message: "Saved perfectly!" });
    } catch (error) {
        console.error("Error saving transcript:", error);
        res.status(500).json({ error: "Failed to save transcript" });
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Synapse Backend is running.");
});

// 5. Database & Server Start
const start = async () => {
    const dbURI = process.env.MONGO_URI;
    const PORT = process.env.PORT || 8000;

    if (!dbURI) {
        console.error("FATAL ERROR: MONGO_URI missing");
        process.exit(1);
    }

    try {
        await mongoose.connect(dbURI);
        console.log(`Connected to MongoDB`);
        server.listen(PORT, () => {
            console.log(`SERVER LISTENING ON PORT ${PORT}`);
        });
    } catch (error) {
        console.error("Database error:", error);
        process.exit(1);
    }
}

start();