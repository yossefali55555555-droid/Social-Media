import express, { type NextFunction, type Request, type Response } from "express"
import userrouter, { userRoutes } from "./modules/usermodule/user.controller.js"
import { Dbconnection } from "./DB/mongodb.connection.js"
import { PORT } from "./config/config.js"
import { redisconn } from "./DB/redis.connection.js"
import { usermodel } from "./DB/models/user.model.js"
import type { IError } from "./utils/error.handle.js"
const app = express()
app.use(express.json())
await Dbconnection()
app.use(userRoutes.base,userrouter)
app.use((err:IError,req:Request,res:Response,next:NextFunction)=>{
    res.status(err.status).json({
        msg:err.message,
        code:err.status
    })
})
app.listen(PORT,()=>{
    console.log("the server connected")
})