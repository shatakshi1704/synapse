// environment.js mein
let IS_PROD = true; // Ab yeh true rahega taaki live URL use ho
const server = IS_PROD ?
    "https://synapse-ehmv.onrender.com" :
    "http://localhost:8000"

export default server;