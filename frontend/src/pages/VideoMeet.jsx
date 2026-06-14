import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
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
import server from '../environment';

const server_url = server;
var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

// Synapse Theme Colors
const PRIMARY_BURGUNDY = "#810b38";
const TEXT_DARK = "#1f2937";
const WHITE = "#FFFFFF";

export default function VideoMeetComponent() {
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(false); // Default chat hidden
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    
    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    // --- CORE LOGIC (UNTOUCHED) ---
    useEffect(() => {
        getPermissions();
    }, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
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

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                });
            }
        });
    };

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { }
        }
    };

    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
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
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    };

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);
        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on('chat-message', addMessage);
            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
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
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try { connections[id2].addStream(window.localStream); } catch (e) { }
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
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
    useEffect(() => { if (screen !== undefined) getDislayMedia(); }, [screen]);

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }
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
        if(username.trim() === "") return;
        setAskForUsername(false);
        getMedia();
    };

    // --- RENDER UI ---
    return (
        <div style={{ backgroundColor: askForUsername ? "#FAFAFA" : "#0f172a", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
            
            {/* LOBBY UI (Before Joining) */}
            {askForUsername ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        style={{ display: "flex", width: "900px", backgroundColor: WHITE, borderRadius: "20px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(129, 11, 56, 0.15)" }}
                    >
                        {/* Video Preview Side */}
                        <div style={{ flex: 1, backgroundColor: "#000", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                            <video 
                                ref={localVideoref} 
                                autoPlay 
                                muted 
                                style={{ width: "100%", borderRadius: "12px", border: `2px solid ${PRIMARY_BURGUNDY}40`, aspectRatio: "16/9", objectFit: "cover", backgroundColor: "#1f2937" }}
                            />
                            <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "20px" }}>
                                <IconButton onClick={() => setVideoAvailable(!videoAvailable)} style={{ backgroundColor: videoAvailable ? `${PRIMARY_BURGUNDY}20` : "#ef4444", color: videoAvailable ? WHITE : WHITE }}>
                                    {videoAvailable ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                                <IconButton onClick={() => setAudioAvailable(!audioAvailable)} style={{ backgroundColor: audioAvailable ? `${PRIMARY_BURGUNDY}20` : "#ef4444", color: audioAvailable ? WHITE : WHITE }}>
                                    {audioAvailable ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </div>
                        </div>

                        {/* Name Input Side */}
                        <div style={{ flex: 1, padding: "50px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <h2 style={{ fontSize: "2rem", color: PRIMARY_BURGUNDY, margin: "0 0 10px 0" }}>Ready to join?</h2>
                            <p style={{ color: "#6b7280", marginBottom: "30px" }}>Enter your display name to enter the workspace.</p>
                            
                            <input 
                                placeholder="Your Name" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && connect()}
                                style={{ 
                                    width: "100%", padding: "15px", borderRadius: "8px", border: `1px solid ${PRIMARY_BURGUNDY}40`, 
                                    fontSize: "1rem", outline: "none", marginBottom: "20px", boxSizing: "border-box"
                                }}
                            />
                            <button 
                                onClick={connect}
                                style={{ 
                                    width: "100%", padding: "16px", backgroundColor: PRIMARY_BURGUNDY, color: WHITE, 
                                    border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "1rem", cursor: "pointer" 
                                }}
                            >
                                Connect to Meeting
                            </button>
                        </div>
                    </motion.div>
                </div>
            ) : 

            /* IN-MEETING UI */
            (
                <div style={{ display: "flex", height: "100vh", position: "relative", overflow: "hidden" }}>
                    
                    {/* VIDEO GRID AREA */}
                    <div style={{ flex: 1, padding: "20px", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", alignContent: "center", gap: "20px", transition: "all 0.3s" }}>
                        
                        {/* My Local Video */}
                        <div style={{ position: "relative", width: videos.length === 0 ? "70vw" : "400px", transition: "width 0.3s" }}>
                            <video 
                                ref={localVideoref} 
                                autoPlay 
                                muted 
                                style={{ width: "100%", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: `2px solid ${PRIMARY_BURGUNDY}` }}
                            />
                            <div style={{ position: "absolute", bottom: "15px", left: "15px", backgroundColor: "rgba(0,0,0,0.6)", padding: "5px 12px", borderRadius: "6px", color: WHITE, fontSize: "0.8rem", fontWeight: "bold" }}>
                                You ({username})
                            </div>
                        </div>

                        {/* Other Participants Videos */}
                        {videos.map((vid) => (
                            <div key={vid.socketId} style={{ position: "relative", width: "400px" }}>
                                <video
                                    data-socket={vid.socketId}
                                    ref={ref => { if (ref && vid.stream) ref.srcObject = vid.stream; }}
                                    autoPlay
                                    style={{ width: "100%", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", backgroundColor: "#1e293b" }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* CHAT SIDEBAR PANEL */}
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

                    {/* BOTTOM CONTROL BAR */}
                    <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "15px", backgroundColor: "rgba(30, 41, 59, 0.8)", backdropFilter: "blur(10px)", padding: "15px 25px", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.1)", zIndex: 100 }}>
                        
                        <IconButton 
                            onClick={handleVideo} 
                            style={{ backgroundColor: video ? "rgba(255,255,255,0.1)" : "#ef4444", color: WHITE, width: "50px", height: "50px" }}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        
                        <IconButton 
                            onClick={handleAudio} 
                            style={{ backgroundColor: audio ? "rgba(255,255,255,0.1)" : "#ef4444", color: WHITE, width: "50px", height: "50px" }}
                        >
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        
                        {screenAvailable && (
                            <IconButton 
                                onClick={handleScreen} 
                                style={{ backgroundColor: screen ? `${PRIMARY_BURGUNDY}` : "rgba(255,255,255,0.1)", color: WHITE, width: "50px", height: "50px" }}
                            >
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}
                        
                        <Badge badgeContent={newMessages} color="error" overlap="circular">
                            <IconButton 
                                onClick={() => { setModal(!showModal); setNewMessages(0); }} 
                                style={{ backgroundColor: showModal ? PRIMARY_BURGUNDY : "rgba(255,255,255,0.1)", color: WHITE, width: "50px", height: "50px" }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                        
                        <div style={{ width: "2px", backgroundColor: "rgba(255,255,255,0.2)", margin: "0 5px" }} />
                        
                        <IconButton 
                            onClick={handleEndCall} 
                            style={{ backgroundColor: "#ef4444", color: WHITE, width: "50px", height: "50px", marginLeft: "10px" }}
                        >
                            <CallEndIcon />
                        </IconButton>
                    </div>

                </div>
            )}
        </div>
    );
}