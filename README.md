<p align="center">
  <img src="frontend/public/logo.png" alt="Synapse Logo" width="120" />
</p>

# Synapse — Real-Time Video Conferencing & Live Transcription Platform

A scalable real-time video collaboration and live transcription ecosystem built for seamless global conversations[cite: 1, 2].

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

**Synapse** is a modern, high-definition video conferencing platform designed to solve the friction of taking manual meeting notes[cite: 1, 2]. By integrating native browser Web Speech API transcription directly into peer-to-peer WebRTC video streams, Synapse auto-synthesizes spoken dialogue into a live workspace transcript[cite: 1, 2].

It features secure JWT-based authentication, real-time Socket.io signaling rooms, and persistent meeting logs stored via MongoDB and Mongoose[cite: 1, 2].

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Real-Time P2P Streaming** | Low-latency audio/video tracks routed directly via WebRTC and `getUserMedia`[cite: 1, 2]. |
| **NAT Traversal Support** | Integrated STUN/TURN configurations to maintain stable connections across restrictive firewalls[cite: 1, 2]. |
| **Live Workspace Transcription** | Converts local speech to text via the Web Speech API and broadcasts captions in real-time[cite: 1, 2]. |
| **Secure Authentication** | Sign-in/sign-up flows protected with `bcrypt` hashing and HTTP-only cookie JWT storage[cite: 1, 2]. |
| **Room Code Orchestration** | Isolated channel grouping via `socket.join(roomCode)` for multi-peer event relaying[cite: 1, 2]. |
| **Meeting History Logs** | Dedicated dashboard endpoints to review, inspect, and export past session transcripts (`.txt`)[cite: 1, 2]. |
| **Rate Limiting & Security** | Configured with `express-rate-limit`, `helmet`, and strict CORS policies[cite: 1, 2]. |

---

## Tech Stack

### Backend
- **Node.js & Express**: Core HTTP server routing and application logic[cite: 1, 2].
- **Socket.io**: Bidirectional event communication for WebRTC signaling and live chat/captions[cite: 1, 2].
- **Mongoose & MongoDB**: ODM and database layer for user records and past session persistence[cite: 1, 2].
- **Bcrypt & JWT**: Secure credential hashing and token-based route authorization[cite: 1, 2].
- **Helmet & Express Rate Limit**: Hardened HTTP security headers and brute-force protection[cite: 1, 2].

### Frontend
- **React**: Component-driven UI framework with responsive dark-mode layouts[cite: 1, 2].
- **WebRTC API**: Direct peer media stream ingestion and rendering[cite: 1, 2].
- **Web Speech API**: Native browser speech recognition for closed captioning[cite: 1, 2].
