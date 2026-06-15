import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PRIMARY_BURGUNDY = "#810b38";
const TEXT_DARK = "#1f2937";
const WHITE = "#FFFFFF";

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div style={{ backgroundColor: WHITE, minHeight: "100vh", padding: "0 50px", overflowX: "hidden", fontFamily: "'Inter', sans-serif" }}>
            
            {/* Navbar */}
            <motion.nav 
                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: `1px solid ${PRIMARY_BURGUNDY}` }}
            >
                <img src="/together logo.png" alt="Synapse" style={{ height: "45px" }} />
                <div style={{ display: "flex", gap: "30px", color: PRIMARY_BURGUNDY, fontWeight: "600", cursor: "pointer", alignItems: "center" }}>
                    <p onClick={() => router("/aljk23")}>Join as Guest</p>
                    <Link to="/auth" style={{ textDecoration: 'none', color: WHITE, backgroundColor: PRIMARY_BURGUNDY, padding: '10px 20px', borderRadius: '5px' }}>
                        Sign up
                    </Link>
                </div>
            </motion.nav>

            {/* Main Content Area */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "100px", height: "calc(100vh - 150px)" }}>
                
                {/* Left Text */}
                <motion.div 
                    initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                    style={{ maxWidth: "50%" }}
                >
                    <h1 style={{ color: PRIMARY_BURGUNDY, fontSize: "4rem", lineHeight: "1.1", margin: 0, fontWeight: 800 }}>
                        EMPOWERING GLOBAL CONVERSATIONS
                    </h1>
                    <p style={{ fontSize: "1.2rem", color: TEXT_DARK, margin: "30px 0" }}>
                        Experience seamless, secure, high-definition video collaboration.
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to={"/auth"} style={{ 
                            backgroundColor: PRIMARY_BURGUNDY, color: WHITE, padding: "18px 45px", 
                            borderRadius: "8px", textDecoration: "none", fontWeight: "bold", 
                            display: "inline-block", fontSize: "1.1rem"
                        }}>
                            START MEETING
                        </Link>
                    </motion.div>
                </motion.div>
                
                {/* Right Visuals */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "50%" }}
                >
                    <motion.div 
                        animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        style={{ 
                            width: "480px", height: "420px", backgroundColor: WHITE, 
                            borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(129, 11, 56, 0.15)",
                            border: `1px solid ${PRIMARY_BURGUNDY}20`, display: "flex", flexDirection: "column", overflow: "hidden"
                        }}
                    >
                        <div style={{ display: "flex", gap: "10px", padding: "15px", height: "240px", backgroundColor: "#FEF2F2" }}>
                            <div style={{ flex: 2, backgroundColor: PRIMARY_BURGUNDY, borderRadius: "12px", position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ width: "80px", height: "80px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "50%", position: "absolute", top: "30px" }} />
                                <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ width: "120px", height: "100px", backgroundColor: "rgba(255,255,255,0.1)", borderTopLeftRadius: "60px", borderTopRightRadius: "60px", position: "absolute", bottom: "-20px" }} />
                                <div style={{ position: "absolute", bottom: "15px", left: "15px", display: "flex", gap: "4px", alignItems: "flex-end", height: "20px" }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <motion.div key={i} animate={{ height: ["4px", i % 2 === 0 ? "16px" : "20px", "4px"] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} style={{ width: "4px", backgroundColor: WHITE, borderRadius: "2px" }} />
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ flex: 1, backgroundColor: `${PRIMARY_BURGUNDY}90`, borderRadius: "12px", position: "relative" }} />
                                <div style={{ flex: 1, backgroundColor: `${PRIMARY_BURGUNDY}60`, borderRadius: "12px", position: "relative" }} />
                            </div>
                        </div>
                        <div style={{ flex: 1, padding: "20px", backgroundColor: WHITE, display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: PRIMARY_BURGUNDY, display: "flex", alignItems: "center", gap: "8px" }}>
                                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: "8px", height: "8px", backgroundColor: "#e21d48", borderRadius: "50%" }} />
                                LIVE SYNTHESIS TRANSCRIPT
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {[80, 60, 45].map((targetWidth, i) => (
                                    <motion.div key={i} initial={{ width: "0%", opacity: 0 }} animate={{ width: `${targetWidth}%`, opacity: [0, 1, 1, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 1.5, ease: "linear" }} style={{ height: "10px", backgroundColor: `${PRIMARY_BURGUNDY}40`, borderRadius: "5px" }} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}