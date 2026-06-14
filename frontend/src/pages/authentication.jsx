import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material'; // Tumhara purana error handler retained hai

const PRIMARY_BURGUNDY = "#810b38";
const TEXT_DARK = "#1f2937";
const WHITE = "#FFFFFF";

export default function Authentication() {
    // TUMHARI STATES
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [formState, setFormState] = useState(0); // 0 = Login, 1 = Register
    const [open, setOpen] = useState(false);

    const router = useNavigate();
    const { handleRegister, handleLogin } = useContext(AuthContext);

    // TUMHARA AUTH LOGIC (Untouched, bas safe error handling slightly updated)
    let handleAuth = async () => {
        try {
            setError(""); // Reset error on new attempt
            if (formState === 0) {
                let result = await handleLogin(username, password);
                // Agar login successful ke baad redirect karna hai toh yahan kar sakte ho
                // router("/home"); 
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
                setPassword("");
            }
        } catch (err) {
            console.log(err);
            let errMsg = err.response?.data?.message || "An error occurred. Please try again.";
            setError(errMsg);
        }
    }

    // SYNTHESIS STYLES
    const inputStyle = {
        width: "100%",
        padding: "14px",
        marginBottom: "15px",
        borderRadius: "8px",
        border: `1px solid ${PRIMARY_BURGUNDY}40`,
        fontSize: "1rem",
        outline: "none",
        transition: "border 0.3s",
        backgroundColor: "#FAFAFA",
        color: TEXT_DARK
    };

    return (
        <div style={{ backgroundColor: WHITE, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Inter', sans-serif" }}>
            
            {/* Minimal Navbar */}
            <nav style={{ width: "100%", padding: "20px 50px", display: "flex", justifyContent: "flex-start" }}>
                <img src="/together logo.png" alt="Synapse" style={{ height: "40px", cursor: "pointer" }} onClick={() => router("/")} />
            </nav>

            {/* Form Container */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", width: "100%", paddingBottom: "100px" }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ 
                        width: "100%", maxWidth: "420px", padding: "40px", 
                        backgroundColor: WHITE, borderRadius: "16px",
                        boxShadow: "0 20px 25px -5px rgba(129, 11, 56, 0.1), 0 10px 10px -5px rgba(129, 11, 56, 0.04)",
                        border: `1px solid ${PRIMARY_BURGUNDY}15`
                    }}
                >
                    {/* Toggle Header */}
                    <div style={{ display: "flex", marginBottom: "30px", borderBottom: `1px solid ${PRIMARY_BURGUNDY}20` }}>
                        <p 
                            onClick={() => { setFormState(0); setError(""); }}
                            style={{ 
                                flex: 1, textAlign: "center", padding: "10px", cursor: "pointer",
                                fontWeight: "700", color: formState === 0 ? PRIMARY_BURGUNDY : "#9ca3af",
                                borderBottom: formState === 0 ? `3px solid ${PRIMARY_BURGUNDY}` : "none",
                                transition: "all 0.3s"
                            }}
                        >
                            Sign In
                        </p>
                        <p 
                            onClick={() => { setFormState(1); setError(""); }}
                            style={{ 
                                flex: 1, textAlign: "center", padding: "10px", cursor: "pointer",
                                fontWeight: "700", color: formState === 1 ? PRIMARY_BURGUNDY : "#9ca3af",
                                borderBottom: formState === 1 ? `3px solid ${PRIMARY_BURGUNDY}` : "none",
                                transition: "all 0.3s"
                            }}
                        >
                            Sign Up
                        </p>
                    </div>

                    {/* Animated Form */}
                    <AnimatePresence mode="wait">
                        <motion.form 
                            key={formState === 0 ? 'login' : 'signup'}
                            initial={{ x: formState === 0 ? -10 : 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: formState === 0 ? 10 : -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={(e) => e.preventDefault()} // Prevent page reload
                        >
                            {formState === 1 && (
                                <input 
                                    style={inputStyle} 
                                    placeholder="Full Name" 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={(e) => e.target.style.border = `1px solid ${PRIMARY_BURGUNDY}`}
                                    onBlur={(e) => e.target.style.border = `1px solid ${PRIMARY_BURGUNDY}40`}
                                />
                            )}
                            
                            <input 
                                style={inputStyle} 
                                placeholder="Username / Email" 
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={(e) => e.target.style.border = `1px solid ${PRIMARY_BURGUNDY}`}
                                onBlur={(e) => e.target.style.border = `1px solid ${PRIMARY_BURGUNDY}40`}
                            />
                            
                            <input 
                                style={inputStyle} 
                                placeholder="Password" 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={(e) => e.target.style.border = `1px solid ${PRIMARY_BURGUNDY}`}
                                onBlur={(e) => e.target.style.border = `1px solid ${PRIMARY_BURGUNDY}40`}
                            />

                            {/* Error Display */}
                            {error && (
                                <motion.p 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ color: "#e21d48", fontSize: "0.85rem", marginTop: "5px", marginBottom: "15px", textAlign: "center", fontWeight: "500" }}
                                >
                                    {error}
                                </motion.p>
                            )}

                            <motion.button 
                                type="button"
                                onClick={handleAuth}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ 
                                    width: "100%", padding: "14px", backgroundColor: PRIMARY_BURGUNDY, 
                                    color: WHITE, border: "none", borderRadius: "8px", 
                                    fontWeight: "700", fontSize: "1rem", cursor: "pointer", marginTop: "10px"
                                }}
                            >
                                {formState === 0 ? "Login to Synapse" : "Create Account"}
                            </motion.button>
                        </motion.form>
                    </AnimatePresence>

                </motion.div>
            </div>

            {/* Tumhara purana MUI Snackbar */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                message={message}
            />

        </div>
    );
}