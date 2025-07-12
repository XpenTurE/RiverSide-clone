import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createWriteStream, WriteStream } from "fs";
import { Server } from "socket.io"
import http from "http"
import path from "path"
import fs from "fs"

const VideoRouter = require("./routes/VideoRoute")
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use("", VideoRouter)

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    pingInterval: 25000
})

io.on("connection", (socket) => {
    console.log('Client connected:', socket.id);
    
    let writableStream: WriteStream | null = null;
    let filename: string;

    socket.on("recording_start", () => {
        filename = `recording_${socket.id}_${Date.now()}.webm`;
        const filepath = path.join(__dirname, 'uploads', filename);
        
        const uploadsDir = path.join(__dirname, 'z');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        writableStream = createWriteStream(filepath);
        
        writableStream.on('error', (err: Error) => {
            console.error("Stream error:", err);
        });
        
        writableStream.on('finish', () => {
            console.log(`Recording saved: ${filename}`);
        });
        
        console.log(`Recording started for client ${socket.id}`);
    });

    socket.on("video_chunk", (data: ArrayBuffer) => {
        if (writableStream && !writableStream.destroyed) {
            try {
                const buffer = Buffer.from(data);
                writableStream.write(buffer);
                console.log(`Chunk written: ${buffer.length} bytes`);
            } catch (error) {
                console.error("Error writing chunk:", error);
            }
        } else {
            console.warn("Stream not available or destroyed");
        }
    });

    socket.on("recording_end", () => {
        if (writableStream && !writableStream.destroyed) {
            writableStream.end();
            console.log(`Recording ended for client ${socket.id}`);
        }
        writableStream = null;
    });

    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', reason);
        if (writableStream && !writableStream.destroyed) {
            writableStream.end();
        }
        writableStream = null;
    });
});

server.listen(port, () => {
    console.log(`Server is Listening on port ${port}`);
});