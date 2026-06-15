import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

const PRIMARY_BURGUNDY = "#810b38";
const TEXT_DARK = "#1f2937";
const WHITE = "#FFFFFF";

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return; 
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }

    const inputStyle = {
        width: "100%",
        maxWidth: "300px",
        padding: "14px 20px",
        borderRadius: "8px",
        border: `2px solid ${PRIMARY_BURGUNDY}40`,
        fontSize: "1rem",
        outline: "none",
        transition: "all 0.3s ease",
        backgroundColor: "#FAFAFA",
        color: TEXT_DARK,
        fontWeight: "500"
    };

    return (
        <div style={{ backgroundColor: WHITE, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
            
            {/* Navbar */}
            <motion.nav 
                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 50px", borderBottom: `1px solid ${PRIMARY_BURGUNDY}20`, flexWrap: "wrap" }}
            >
                <img src="/together logo.png" alt="Synapse" style={{ height: "40px", cursor: "pointer" }} onClick={() => navigate("/")} />
                
                <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
                    <motion.div 
                        whileHover={{ scale: 1.05, color: PRIMARY_BURGUNDY }}
                        onClick={() => navigate("/history")}
                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: `${TEXT_DARK}90`, fontWeight: "600", transition: "color 0.3s" }}
                    >
                        <RestoreIcon fontSize="small" /> History
                    </motion.div>
                    
                    <motion.button 
                        whileHover={{ backgroundColor: PRIMARY_BURGUNDY, color: WHITE }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { localStorage.removeItem("token"); navigate("/auth"); }}
                        style={{ 
                            background: "transparent", border: `2px solid ${PRIMARY_BURGUNDY}`, color: PRIMARY_BURGUNDY, 
                            padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", transition: "all 0.3s" 
                        }}
                    >
                        Logout
                    </motion.button>
                </div>
            </motion.nav>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10vw", flexWrap: "wrap", gap: "40px" }}>
                
                {/* Left Side */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ flex: "1 1 400px", maxWidth: "500px" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                        <div style={{ width: "12px", height: "12px", backgroundColor: "#10b981", borderRadius: "50%" }}></div>
                        <p style={{ color: "#10b981", fontWeight: "700", margin: 0, letterSpacing: "1px", fontSize: "0.85rem" }}>SYSTEM ONLINE</p>
                    </div>

                    <h1 style={{ color: PRIMARY_BURGUNDY, fontSize: "3.5rem", lineHeight: "1.2", margin: "0 0 20px 0", fontWeight: 800 }}>
                        Enter your<br/>Workspace.
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: TEXT_DARK, marginBottom: "40px", opacity: 0.8 }}>
                        Join a secure, high-definition environment instantly. Enter your unique meeting code to synthesize.
                    </p>

                    <div style={{ display: 'flex', gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
                        <input 
                            style={inputStyle}
                            placeholder="Enter Meeting Code (e.g. xyz-abc)"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinVideoCall()}
                        />
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(129, 11, 56, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleJoinVideoCall} 
                            style={{ 
                                backgroundColor: PRIMARY_BURGUNDY, color: WHITE, border: "none", 
                                padding: "16px 35px", borderRadius: "8px", fontWeight: "700", 
                                fontSize: "1rem", cursor: "pointer", whiteSpace: "nowrap"
                            }}
                        >
                            JOIN MEETING
                        </motion.button>
                    </div>
                </motion.div>

                {/* Right Side - Animation Shifted to Right */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
                    style={{ flex: "1 1 350px", display: "flex", justifyContent: "flex-end", position: "relative", height: "400px", alignItems: "center" }}
                >
                    <div style={{ position: "relative", width: "350px", height: "350px", display: "flex", justifyContent: "center", alignItems: "center", marginRight: "20px" }}>
                        {[1, 2, 3].map((ring) => (
                            <motion.div
                                key={ring}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity, delay: ring * 0.5, ease: "easeInOut" }}
                                style={{
                                    position: "absolute", width: `${ring * 100}px`, height: `${ring * 100}px`,
                                    border: `1px solid ${PRIMARY_BURGUNDY}`, borderRadius: "50%",
                                }}
                            />
                        ))}
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                            style={{ width: "60px", height: "60px", backgroundColor: PRIMARY_BURGUNDY, borderRadius: "50%", zIndex: 10, boxShadow: `0 0 30px ${PRIMARY_BURGUNDY}60` }}
                        />
                        {/* Cards */}
                        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "20px", left: "20px", padding: "10px 15px", backgroundColor: WHITE, borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: `1px solid ${PRIMARY_BURGUNDY}20`, display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "8px", height: "8px", backgroundColor: PRIMARY_BURGUNDY, borderRadius: "50%" }} />
                            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: TEXT_DARK }}>End-to-End Encrypted</span>
                        </motion.div>
                        <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} style={{ position: "absolute", bottom: "40px", right: "-20px", padding: "10px 15px", backgroundColor: WHITE, borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: `1px solid ${PRIMARY_BURGUNDY}20`, display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "8px", height: "8px", backgroundColor: "#10b981", borderRadius: "50%" }} />
                            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: TEXT_DARK }}>Low Latency Active</span>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default withAuth(HomeComponent);