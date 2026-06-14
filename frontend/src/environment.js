// environment.js mein
let IS_PROD = false; // Isse 'false' karo taaki yeh localhost use kare
const server = IS_PROD ?
    "https://apnacollegebackend.onrender.com" :
    "http://localhost:8000"

export default server;