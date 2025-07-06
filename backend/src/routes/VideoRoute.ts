const express =require("express")
const VideoRouter = express.Router()
const VideoController = require("../controllers/VideoController")
VideoRouter.get("/",VideoController.videoStream)


module.exports = VideoRouter