import {Response,Request} from "express"


exports.videoStream = (req:Request,res:Response)=>{

    return res.status(200).send("test1")
}