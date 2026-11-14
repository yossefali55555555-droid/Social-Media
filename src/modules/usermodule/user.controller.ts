import { Router } from "express";
import { usersignup } from "./user.service.js";
import { success } from "../../utils/success.js";
import { number } from "zod";
import { auth } from "../../middleware/auth.middleware.js";
const userrouter = Router()
export const userRoutes ={
    base:"/users",
    signup:"/signup",
    login:"/login",
    me:"/me"
}


userrouter.post(userRoutes.signup,async(req,res)=>{
    const {body} =req
    await usersignup.signup(body)
    res.json("user created")
})



userrouter.post(userRoutes.login,async(req,res)=>{
    const {body} =req
    let data =await usersignup.login(body)
    success({res,status:200,data})
})


userrouter.get(userRoutes.me,auth,async(req,res)=>{
    success({res,status:200,data:req.user})
})

export default userrouter