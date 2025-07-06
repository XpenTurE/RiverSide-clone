import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { accessSync } from "fs";
import {Server} from "socket.io"
import http from "http"
const VideoRouter = require("./routes/VideoRoute")
const app = express();
const port = 8000;

const server = http.createServer(app)

const io  = new Server(server,{
    cors:{
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    pingInterval: 25000

})

io.on("connection",(socket)=>{
    console.log('Client connected:', socket.id);

    socket.on("video_chunk",(data)=>{
        console.log('Message from client:', data);
        io.emit('receive_message', data);
        
    })

    socket.on('disconnect', (e) => {
    console.log('Client disconnected:', e);
  });
})


app.use(cors());
app.use(express.json());
app.use("",VideoRouter)

server.listen(port, () => {
    console.log(`Server is Listening on port ${port}`);
});
