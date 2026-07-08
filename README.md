
<p align="center">
  <img src="frontend/public/together logo.png" alt="Synapse Logo" width="100%">
</p>

<br>

# Synapse — Real-Time Video Conferencing & Live Transcription Platform

A scalable real-time video collaboration and live transcription ecosystem built for seamless global conversations.

[![Live Demo](https://img.shields.io/badge/Live-Demo-deepmaroon?style=flat-square)](https://synapse-1-bee.onrender.com)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-blue?style=flat-square)](https://webrtc.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.x-orange?style=flat-square)](https://socket.io)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green?style=flat-square)](https://nodejs.org)

[View Live Demo](https://synapse-1-bee.onrender.com) · [Report Bug](#) · [Request Feature](#)

---

## Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Signaling Flow](#architecture--signaling-flow)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Routes](#api-routes)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [License](#license)
- [Author](#author)

---

## About the Project

**Synapse** is a modern, high-definition video conferencing platform designed to solve the friction of taking manual meeting notes. By integrating native browser Web Speech API transcription directly into peer-to-peer WebRTC video streams, Synapse auto-synthesizes spoken dialogue into a live workspace transcript.

It features secure JWT-based authentication, real-time Socket.io signaling rooms, and persistent meeting logs stored via MongoDB and Mongoose.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Real-Time P2P Streaming** | Low-latency audio/video tracks routed directly via WebRTC and `getUserMedia`. |
| **NAT Traversal Support** | Integrated STUN/TURN configurations to maintain stable connections across restrictive firewalls. |
| **Live Workspace Transcription** | Converts local speech to text via the Web Speech API and broadcasts captions in real-time. |
| **Secure Authentication** | Sign-in/sign-up flows protected with `bcrypt` hashing and HTTP-only cookie JWT storage. |
| **Room Code Orchestration** | Isolated channel grouping via `socket.join(roomCode)` for multi-peer event relaying. |
| **Meeting History Logs** | Dedicated dashboard endpoints to review, inspect, and export past session transcripts (`.txt`). |
| **Rate Limiting & Security** | Configured with `express-rate-limit`, `helmet`, and strict CORS policies. |

---

## Tech Stack

### Backend
- **Node.js & Express**: Core HTTP server routing and application logic.
- **Socket.io**: Bidirectional event communication for WebRTC signaling and live chat/captions.
- **Mongoose & MongoDB**: ODM and database layer for user records and past session persistence.
- **Bcrypt & JWT**: Secure credential hashing and token-based route authorization.
- **Helmet & Express Rate Limit**: Hardened HTTP security headers and brute-force protection.

### Frontend
- **React**: Component-driven UI framework with responsive dark-mode layouts.
- **WebRTC API**: Direct peer media stream ingestion and rendering.
- **Web Speech API**: Native browser speech recognition for closed captioning.

---

## Architecture & Signaling Flow

```text
[Client A (Browser)] <--- WebRTC Media Stream (UDP) ---> [Client B (Browser)]
        │                                                       │
        └─────── Socket.io Signaling (Offers, Answers, ICE) ────┘
                                   │
                                   ▼
                      [Node.js / Express Server]
                                   │
                                   ▼
                          [MongoDB Atlas DB]

```

---

## Project Structure

```text
synapse/
├── server.js               # Application entry point & HTTP/Socket.io setup
├── models/
│   ├── User.js             # User credentials & metadata schema
│   └── Transcript.js       # Meeting logs, room code, and caption text schema
├── routes/
│   ├── authRoutes.js       # Sign-in, sign-up, and logout endpoints
│   └── sessionRoutes.js    # Protected history & meeting log retrieval
├── middleware/
│   └── authMiddleware.js   # JWT extraction & HTTP-only cookie verification
└── public/ / src/          # Frontend React components, views, and styles

```

---

## Data Models

### User Schema

```javascript
{
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true } // bcrypt-hashed
}

```

### Transcript Schema

```javascript
{
  title:       { type: String, required: true },
  roomCode:    { type: String, required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transcript:  { type: String, default: '' },
  timestamp:   { type: Date, default: Date.now }
}

```

---

## API Routes

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Register a new user profile | No |
| `POST` | `/api/auth/login` | Authenticate and issue HTTP-only JWT cookie | No |
| `GET` | `/api/sessions/history` | Fetch all historical meeting logs for user | Yes |
| `POST` | `/api/sessions/save` | Persist accumulated room transcript to DB | Yes |

```

```
