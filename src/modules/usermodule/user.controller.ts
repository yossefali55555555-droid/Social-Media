import { Router } from "express";
import { signup } from "./user.service.js";
const userrouter = Router()
export const userRoutes ={
    base:"/users",
    signup:"/signup"
}


userrouter.post(userRoutes.signup,async(req,res)=>{
    const {body} =req
    await signup(body)
    res.json("user created")
})


export default userrouter