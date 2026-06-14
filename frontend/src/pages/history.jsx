import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';

// Synthesis Theme Colors
const PRIMARY_BURGUNDY = "#810b38";
const TEXT_DARK = "#1f2937";
const WHITE = "#FFFFFF";

export default function History() {
    // ----------------------------------------------------
    // TUMHARA ORIGINAL LOGIC - 100% UNTOUCHED
    // ----------------------------------------------------
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }
        fetchHistory();
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    // ----------------------------------------------------

    // ANIMATION VARIANTS
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 } // Ek ke baad ek aayenge
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, x: 50 }, // Side (right) se aayega
        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 80 } }
    };

    return (
        <div style={{ backgroundColor: WHITE, minHeight: "100vh", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" }}>

            {/* ABSTRACT SIDE ANIMATION (Background) */}
            <motion.div 
                animate={{ rotate: 360, scale: [1, 1.05, 1] }} 
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ 
                    position: "fixed", top: "10%", right: "-15%", width: "800px", height: "800px", 
                    borderRadius: "50%", border: `2px dashed ${PRIMARY_BURGUNDY}10`, zIndex: 0, pointerEvents: "none" 
                }}
            />
            <motion.div 
                animate={{ rotate: -360, scale: [1, 1.1, 1] }} 
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{ 
                    position: "fixed", bottom: "-20%", left: "-10%", width: "600px", height: "600px", 
                    borderRadius: "50%", border: `1px solid ${PRIMARY_BURGUNDY}05`, zIndex: 0, pointerEvents: "none" 
                }}
            />

            {/* Premium Navbar */}
            <motion.nav 
                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
                style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", padding: "20px 50px", borderBottom: `1px solid ${PRIMARY_BURGUNDY}20`, gap: "20px", backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)" }}
            >
                <IconButton 
                    onClick={() => { routeTo("/home") }}
                    style={{ color: PRIMARY_BURGUNDY, backgroundColor: `${PRIMARY_BURGUNDY}10` }}
                >
                    <HomeIcon />
                </IconButton >
                <img src="/together logo.png" alt="Synapse" style={{ height: "35px" }} />
                <h2 style={{ margin: "0 0 0 auto", color: TEXT_DARK, fontSize: "1.1rem", fontWeight: "600" }}>
                    Workspace History
                </h2>
            </motion.nav>

            {/* Main Content */}
            <div style={{ position: "relative", zIndex: 10, padding: "50px 10vw", maxWidth: "1200px", margin: "0 auto" }}>
                
                <motion.div 
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    style={{ marginBottom: "40px" }}
                >
                    <h1 style={{ color: PRIMARY_BURGUNDY, fontSize: "2.5rem", fontWeight: 800, marginBottom: "10px" }}>
                        Meeting Logs
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
                        Review your past synthesis sessions and transcriptions.
                    </p>
                </motion.div>

                {/* ANIMATED GRID CONTAINER */}
                {
                    (meetings.length !== 0) ? (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}
                        >
                            {meetings.map((e, i) => {
                                return (
                                    <motion.div 
                                        key={i} 
                                        variants={cardVariants}
                                        whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(129, 11, 56, 0.2)" }}
                                        style={{ 
                                            backgroundColor: WHITE, 
                                            borderRadius: "12px", 
                                            padding: "25px", 
                                            border: `1px solid ${PRIMARY_BURGUNDY}20`,
                                            borderLeft: `4px solid ${PRIMARY_BURGUNDY}`,
                                            position: "relative",
                                            display: "flex",
                                            flexDirection: "column",
                                            transition: "border 0.3s ease"
                                        }}
                                    >
                                        <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#10b981", letterSpacing: "1px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "5px" }}>
                                            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }} />
                                            RECORDED SESSION
                                        </div>
                                        
                                        <div style={{ fontSize: "1.5rem", fontWeight: "700", color: TEXT_DARK, marginBottom: "8px" }}>
                                            {e.meetingCode}
                                        </div>
                                        
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.95rem", flex: 1 }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            {formatDate(e.date)}
                                        </div>

                                        {/* View Transcript Button Layer */}
                                        <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: `1px solid ${PRIMARY_BURGUNDY}15`, display: "flex", justifyContent: "flex-end" }}>
                                            <motion.button
                                                whileHover={{ scale: 1.02, backgroundColor: `${PRIMARY_BURGUNDY}10` }}
                                                whileTap={{ scale: 0.95 }}
                                                style={{
                                                    backgroundColor: "transparent",
                                                    color: PRIMARY_BURGUNDY,
                                                    border: `1px solid ${PRIMARY_BURGUNDY}40`,
                                                    padding: "8px 12px",
                                                    borderRadius: "6px",
                                                    fontWeight: "600",
                                                    fontSize: "0.85rem",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                                View Transcript
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    ) : <></>
                }
            </div>
        </div>
    )
}