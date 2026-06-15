import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import server from '../environment';

const server_url = server;

const peerConfigConnections = {
    "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }]
};

const PRIMARY_BURGUNDY = "#810b38";
const TEXT_DARK = "#1f2937";
const WHITE = "#FFFFFF";

export default function VideoMeetComponent() {
    // --- STATE AND REFERENCE INITIALIZATION ---
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [fullscreenId, setFullscreenId] = useState(null);

    const recognitionRef = useRef(null);
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();
    const videoRef = useRef([]);

    // FIX 1: connections moved inside component as a useRef to persist across re-renders
    const connections = useRef({});

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    let [videos, setVideos] = useState([]);

    const usernameRef = useRef(username);
    useEffect(() => {
        usernameRef.current = username;
    }, [username]);

    // --- CORE LIFE CYCLE HOOKS ---
    useEffect(() => {
        getPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    const shouldListenRef = useRef(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-IN';

            recognition.onresult = (event) => {
                let finalTranscript = "";
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (interimTranscript.trim()) {
                    console.log("👉 Chrome hears you whispering:", interimTranscript);
                }

                if (finalTranscript.trim()) {
                    const formattedText = `${usernameRef.current}: ${finalTranscript}`;
                    setTranscript(prev => prev ? prev + "\n" + formattedText : formattedText);

                    if (socketRef.current) {
                        socketRef.current.emit('transcript-update', formattedText);
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Live Log:", event.error);
            };

            recognition.onend = () => {
                if (shouldListenRef.current) {
                    try {
                        recognition.start();
                    } catch (error) {
                        console.error("Keep-alive auto-restart bypassed:", error);
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported or initialized in this browser.");
            return;
        }

        if (isListening) {
            shouldListenRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                shouldListenRef.current = true;
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Failed to start speech engine:", error);
            }
        }
    };

    const downloadTranscript = () => {
        const element = document.createElement("a");
        const file = new Blob([transcript], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "meeting-transcript.txt";
        element.click();
    };

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) setVideoAvailable(true);
            else setVideoAvailable(false);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) setAudioAvailable(true);
            else setAudioAvailable(false);

            if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
            else setScreenAvailable(false);

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    let getUserMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        // FIX 1 applied: connections.current used throughout
        for (let id in connections.current) {
            if (id === socketIdRef.current) continue;
            connections.current[id].addStream(window.localStream);
            connections.current[id].createOffer().then((description) => {
                connections.current[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections.current[id].localDescription })))
                    .catch(e => console.log(e))
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e) }
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;
            for (let id in connections.current) {
                connections.current[id].addStream(window.localStream);
                connections.current[id].createOffer().then((description) => {
                    connections.current[id].setLocalDescription(description)
                        .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections.current[id].localDescription })))
                        .catch(e => console.log(e))
                });
            }
        });
    };

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { }
        }
    };

    let getDislayMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        // FIX 1 applied: connections.current used throughout
        for (let id in connections.current) {
            if (id === socketIdRef.current) continue;
            connections.current[id].addStream(window.localStream);
            connections.current[id].createOffer().then((description) => {
                connections.current[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections.current[id].localDescription })))
                    .catch(e => console.log(e))
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e) }
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;
            getUserMedia();
        });
    };

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                // FIX 1 applied: connections.current used throughout
                connections.current[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections.current[fromId].createAnswer().then((description) => {
                            connections.current[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections.current[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }
            if (signal.ice) {
                connections.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    };

    let connectToSocketServer = () => {
        // FIX 1: Added secure: true and transports for Render to prevent connection drops/split rooms
        socketRef.current = io.connect(server_url, { 
            secure: true, 
            transports: ["websocket", "polling"] 
        });
        
        // Bulletproof Fix: Purane listeners remove karo taaki double events fire na hon
        socketRef.current.off('signal');
        socketRef.current.on('signal', gotMessageFromServer);
        
        socketRef.current.off('connect');
        socketRef.current.on('connect', () => {
            // FIX 2: Normalize path, remove trailing slash, and lowercase it to ensure exact room match
            const cleanPath = window.location.pathname.replace(/\/$/, "").toLowerCase();
            socketRef.current.emit('join-call', cleanPath);

            socketIdRef.current = socketRef.current.id;

            // Chat double aane ka fix
            socketRef.current.off('chat-message');
            socketRef.current.on('chat-message', addMessage);

            // Transcript double aane ka fix
            socketRef.current.off('transcript-update');
            socketRef.current.on('transcript-update', (incomingTranscript) => {
                setTranscript(prev => prev ? prev + "\n" + incomingTranscript : incomingTranscript);
            });

            socketRef.current.off('user-left');
            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                if (fullscreenId === id) setFullscreenId(null);
            });

            socketRef.current.off('user-joined');
            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    // FIX 3: Only create a new RTCPeerConnection if one doesn't already exist
                    if (!connections.current[socketListId]) {
                        connections.current[socketListId] = new RTCPeerConnection(peerConfigConnections);

                        connections.current[socketListId].onicecandidate = function (event) {
                            if (event.candidate != null) {
                                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                            }
                        };

                        connections.current[socketListId].onaddstream = (event) => {
                            let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                            if (videoExists) {
                                setVideos(videos => {
                                    const updatedVideos = videos.map(video =>
                                        video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                    );
                                    videoRef.current = updatedVideos;
                                    return updatedVideos;
                                });
                            } else {
                                let newVideo = { socketId: socketListId, stream: event.stream, autoplay: true, playsinline: true };
                                setVideos(videos => {
                                    const updatedVideos = [...videos, newVideo];
                                    videoRef.current = updatedVideos;
                                    return updatedVideos;
                                });
                            }
                        };

                        if (window.localStream !== undefined && window.localStream !== null) {
                            connections.current[socketListId].addStream(window.localStream);
                        } else {
                            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                            window.localStream = blackSilence();
                            connections.current[socketListId].addStream(window.localStream);
                        }
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections.current) {
                        if (id2 === socketIdRef.current) continue;
                        try { connections.current[id2].addStream(window.localStream); } catch (e) { }
                        connections.current[id2].createOffer().then((description) => {
                            connections.current[id2].setLocalDescription(description)
                                .then(() => socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections.current[id2].localDescription })))
                                .catch(e => console.log(e))
                        });
                    }
                }
            });
        });
    };

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    let handleVideo = () => setVideo(!video);
    let handleAudio = () => setAudio(!audio);
    let handleScreen = () => setScreen(!screen);

    useEffect(() => {
        if (screen !== undefined) getDislayMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    let handleEndCall = async () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { console.log(e) }

        if (transcript) {
            try {
                await fetch(`${server_url}/api/save-transcript`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        meetingUrl: window.location.pathname,
                        transcriptData: transcript,
                        date: new Date()
                    })
                });
                console.log("Transcript successfully processed and saved to cluster history.");
            } catch (error) {
                console.log("Failed to commit transcript write operations:", error);
            }
        }

        window.location.href = "/home";
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    let sendMessage = () => {
        if (message.trim() === "") return;
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    let connect = () => {
        if (username.trim() === "") return;
        setAskForUsername(false);
        getMedia();
    };

    const toggleFullscreen = (id) => {
        setFullscreenId(prev => prev === id ? null : id);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setFullscreenId(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getVideoCardStyle = (id) => {
        const isFullscreen = fullscreenId === id;
        if (isFullscreen) {
            return {
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                width: '100vw', height: '100vh',
                zIndex: 200,
                backgroundColor: '#000',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            };
        }
        if (fullscreenId !== null && fullscreenId !== id) {
            return { display: 'none' };
        }
        return {
            position: 'relative',
            width: videos.length === 0 ? "70vw" : "400px",
            transition: "width 0.3s",
        };
    };

    const getVideoStyle = (id) => {
        const isFullscreen = fullscreenId === id;
        if (isFullscreen) {
            return {
                width: '100%',
                height: '100%',
                maxHeight: '100vh',
                objectFit: 'contain',
                borderRadius: 0,
                display: 'block',
            };
        }
        return {
            width: "100%",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            border: `2px solid ${PRIMARY_BURGUNDY}`,
            display: 'block',
            // Mirror only local camera feed; screen share and remote peers stay normal
            transform: (id === 'local' && !screen) ? "scaleX(-1)" : "scaleX(1)"
        };
    };

    const fullscreenBtnStyle = (id) => ({
        position: 'absolute',
        top: fullscreenId === id ? '20px' : '10px',
        right: fullscreenId === id ? '20px' : '10px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        color: WHITE,
        borderRadius: '8px',
        zIndex: 210,
        opacity: 0.85,
        transition: 'opacity 0.2s',
    });

    return (
        <div style={{ backgroundColor: askForUsername ? "#FAFAFA" : "#0f172a", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

            {/* LOBBY INTERFACE */}
            {askForUsername ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        style={{ display: "flex", width: "900px", backgroundColor: WHITE, borderRadius: "20px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(129, 11, 56, 0.15)" }}
                    >
                        <div style={{ flex: 1, backgroundColor: "#000", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                            <video
                                ref={localVideoref}
                                autoPlay
                                muted
                                style={{ width: "100%", borderRadius: "12px", border: `2px solid ${PRIMARY_BURGUNDY}40`, aspectRatio: "16/9", objectFit: "cover", backgroundColor: "#1f2937" }}
                            />
                            <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "20px" }}>
                                <IconButton onClick={() => setVideoAvailable(!videoAvailable)} style={{ backgroundColor: videoAvailable ? `${PRIMARY_BURGUNDY}20` : "#ef4444", color: WHITE }}>
                                    {videoAvailable ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                                <IconButton onClick={() => setAudioAvailable(!audioAvailable)} style={{ backgroundColor: audioAvailable ? `${PRIMARY_BURGUNDY}20` : "#ef4444", color: WHITE }}>
                                    {audioAvailable ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </div>
                        </div>
                        <div style={{ flex: 1, padding: "50px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <h2 style={{ fontSize: "2rem", color: PRIMARY_BURGUNDY, margin: "0 0 10px 0" }}>Ready to join?</h2>
                            <p style={{ color: "#6b7280", marginBottom: "30px" }}>Enter your display name to enter the workspace.</p>
                            <input
                                placeholder="Your Name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && connect()}
                                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: `1px solid ${PRIMARY_BURGUNDY}40`, fontSize: "1rem", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}
                            />
                            <button
                                onClick={connect}
                                style={{ width: "100%", padding: "16px", backgroundColor: PRIMARY_BURGUNDY, color: WHITE, border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "1rem", cursor: "pointer" }}
                            >
                                Connect to Meeting
                            </button>
                        </div>
                    </motion.div>
                </div>
            ) : (

                /* CALL ACTIVE SCREEN VIEWPORTS */
                <div style={{ display: "flex", height: "100vh", position: "relative", overflow: "hidden" }}>

                    {/* VIDEO FRAME WRAPPER CONTAINER */}
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", alignContent: "center", gap: "20px", transition: "all 0.3s" }}>

                        {/* Local Stream Output */}
                        <div style={getVideoCardStyle('local')}>
                            <video
                                ref={localVideoref}
                                autoPlay
                                muted
                                style={getVideoStyle('local')}
                            />
                            <div style={{ position: "absolute", bottom: fullscreenId === 'local' ? "30px" : "15px", left: fullscreenId === 'local' ? "30px" : "15px", backgroundColor: "rgba(0,0,0,0.6)", padding: "5px 12px", borderRadius: "6px", color: WHITE, fontSize: "0.8rem", fontWeight: "bold", zIndex: 210 }}>
                                You ({username})
                            </div>
                            <IconButton onClick={() => toggleFullscreen('local')} style={fullscreenBtnStyle('local')}>
                                {fullscreenId === 'local' ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </div>

                        {/* Distant Call Peers Output */}
                        {videos.map((vid) => (
                            <div key={vid.socketId} style={getVideoCardStyle(vid.socketId)}>
                                <video
                                    data-socket={vid.socketId}
                                    ref={ref => { if (ref && vid.stream) ref.srcObject = vid.stream; }}
                                    autoPlay
                                    style={getVideoStyle(vid.socketId)}
                                />
                                <IconButton onClick={() => toggleFullscreen(vid.socketId)} style={fullscreenBtnStyle(vid.socketId)}>
                                    {fullscreenId === vid.socketId ? <FullscreenExitIcon /> : <FullscreenIcon />}
                                </IconButton>
                                {fullscreenId === vid.socketId && (
                                    <div
                                        onClick={() => setFullscreenId(null)}
                                        style={{ position: 'absolute', inset: 0, zIndex: 205, cursor: 'pointer' }}
                                        title="Click to exit fullscreen"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* INTERACTIVE CHAT PANEL */}
                    <AnimatePresence>
                        {showModal && (
                            <motion.div
                                initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                style={{ width: "350px", backgroundColor: WHITE, display: "flex", flexDirection: "column", borderLeft: `1px solid ${PRIMARY_BURGUNDY}20`, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", zIndex: 50 }}
                            >
                                <div style={{ padding: "20px", borderBottom: `1px solid ${PRIMARY_BURGUNDY}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3 style={{ margin: 0, color: PRIMARY_BURGUNDY, fontSize: "1.2rem" }}>Meeting Chat</h3>
                                    <IconButton onClick={() => setModal(false)} size="small"><CloseIcon /></IconButton>
                                </div>
                                <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
                                    {messages.length === 0 ? (
                                        <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "50px" }}>No messages yet. Say hi!</p>
                                    ) : (
                                        messages.map((item, index) => (
                                            <div key={index} style={{ alignSelf: item.sender === username ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px", textAlign: item.sender === username ? "right" : "left" }}>
                                                    {item.sender === username ? "You" : item.sender}
                                                </div>
                                                <div style={{ backgroundColor: item.sender === username ? PRIMARY_BURGUNDY : "#f3f4f6", color: item.sender === username ? WHITE : TEXT_DARK, padding: "10px 15px", borderRadius: "12px", borderBottomRightRadius: item.sender === username ? "0" : "12px", borderBottomLeftRadius: item.sender === username ? "12px" : "0" }}>
                                                    {item.data}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div style={{ padding: "15px", borderTop: `1px solid ${PRIMARY_BURGUNDY}20`, display: "flex", gap: "10px" }}>
                                    <input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        style={{ flex: 1, padding: "10px 15px", borderRadius: "20px", border: "1px solid #d1d5db", outline: "none", fontSize: "0.9rem" }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        style={{ backgroundColor: PRIMARY_BURGUNDY, color: WHITE, border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* FLOATING ACTION TOOLBAR CONTROL BAR */}
                    <div style={{ position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "15px", backgroundColor: "rgba(30, 41, 59, 0.8)", backdropFilter: "blur(10px)", padding: "15px 25px", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.1)", zIndex: 300 }}>
                        <IconButton onClick={handleVideo} style={{ backgroundColor: video ? "rgba(255,255,255,0.1)" : "#ef4444", color: WHITE, width: "50px", height: "50px" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ backgroundColor: audio ? "rgba(255,255,255,0.1)" : "#ef4444", color: WHITE, width: "50px", height: "50px" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ backgroundColor: screen ? PRIMARY_BURGUNDY : "rgba(255,255,255,0.1)", color: WHITE, width: "50px", height: "50px" }}>
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}
                        <Badge badgeContent={newMessages} color="error" overlap="circular">
                            <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} style={{ backgroundColor: showModal ? PRIMARY_BURGUNDY : "rgba(255,255,255,0.1)", color: WHITE, width: "50px", height: "50px" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                        <div style={{ width: "2px", backgroundColor: "rgba(255,255,255,0.2)", margin: "0 5px" }} />

                        {/* Audio Streaming Transcription Toggle Button */}
                        <IconButton onClick={toggleListening} style={{ backgroundColor: isListening ? "#ef4444" : "rgba(255,255,255,0.1)", color: WHITE, width: "50px", height: "50px" }}>
                            <TextSnippetIcon />
                        </IconButton>

                        {/* Live Transcript Drawer Viewport Toggle */}
                        <IconButton onClick={() => setShowTranscript(!showTranscript)} style={{ backgroundColor: showTranscript ? PRIMARY_BURGUNDY : "rgba(255,255,255,0.1)", color: WHITE, width: "50px", height: "50px" }}>
                            <TextSnippetIcon style={{ opacity: 0.7 }} />
                        </IconButton>

                        <IconButton onClick={handleEndCall} style={{ backgroundColor: "#ef4444", color: WHITE, width: "50px", height: "50px", marginLeft: "10px" }}>
                            <CallEndIcon />
                        </IconButton>
                    </div>

                    {/* FIXED SIDE TRANSCRIPT VISUAL PANEL LAYOUT */}
                    {showTranscript && (
                        <div style={{ position: 'fixed', right: 20, top: 20, width: 320, height: '75vh', backgroundColor: WHITE, padding: 20, zIndex: 1000, borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: PRIMARY_BURGUNDY, fontSize: '1.2rem' }}>Live Workspace Transcript</h3>
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: TEXT_DARK, whiteSpace: 'pre-wrap', fontSize: '0.9rem', textAlign: 'left' }}>
                                {transcript || "No words tracked yet. Activate microphone recording to begin stream logging..."}
                            </div>
                            <Button variant="contained" onClick={downloadTranscript} style={{ backgroundColor: PRIMARY_BURGUNDY, color: WHITE, borderRadius: '8px', padding: '10px', fontWeight: 'bold' }}>
                                Download Local Copy (.txt)
                            </Button>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}