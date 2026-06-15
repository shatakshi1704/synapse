import { Server } from "socket.io"

let connections = {}
let messages = {}
let timeOnline = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED:", socket.id);

        socket.on("join-call", (path) => {
            // FIX: Trailing slash hatao taaki room mismatch na ho
            const cleanPath = path.replace(/\/$/, ""); 
            
            console.log("User", socket.id, "joining path:", cleanPath);

            if (connections[cleanPath] === undefined) {
                connections[cleanPath] = []
            }
            connections[cleanPath].push(socket.id)
            timeOnline[socket.id] = new Date();

            // Debug: Room mein kitne log hain check karne ke liye
            console.log("Current connections in room", cleanPath, ":", connections[cleanPath]);

            for (let a = 0; a < connections[cleanPath].length; a++) {
                io.to(connections[cleanPath][a]).emit("user-joined", socket.id, connections[cleanPath])
            }

            if (messages[cleanPath] !== undefined) {
                for (let a = 0; a < messages[cleanPath].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[cleanPath][a]['data'],
                        messages[cleanPath][a]['sender'], messages[cleanPath][a]['socket-id-sender'])
                }
            }
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) messages[matchingRoom] = []
                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })

        socket.on("transcript-update", (incomingTranscript) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("transcript-update", incomingTranscript);
                    }
                })
            }
        });

        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);
            var diffTime = Math.abs(timeOnline[socket.id] - new Date())
            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }
                        var index = connections[key].indexOf(socket.id)
                        connections[key].splice(index, 1)

                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }
            }
        })
    })

    return io;
}