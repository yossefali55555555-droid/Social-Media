import { string } from "zod";
import { usermodel } from "../../DB/models/user.model.js";
import { redisconn } from "../../DB/redis.connection.js";
import { random1 } from "../../utils/email/createOTP.js";
import { emailTemplate } from "../../utils/email/emailTemplate.js";
import { sendemail } from "../../utils/email/sendemail.js";
import { AppError, badrequest, invalidcred } from "../../utils/error.handle.js";
import { attemps, confirmemailkey, resend, session } from "../../utils/redis-services.js";
import { createhash, ismatch } from "../../utils/security/hash.js";
import type { logindata, signupdata } from "./user.validation.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken"
import { access, refresh } from "../../config/config.js";

class userservices {
    signup = async(data:signupdata)=>{
    const user = await usermodel.findOne({$or:[
        {email:data.email},
        {username:data.email}
    ]})
    if (user){
        throw new badrequest("user aleardy exists !")
    }
        const otp = random1()
        await sendemail({to:data.email,subject:"Verify Your Email",html:emailTemplate({otp,subject:"Verify Your Email"})})
        const hashedpassword = await createhash(data.password)
        const data1 = await usermodel.insertOne({username:data.username,fullname:data.fullname,email:data.email
        ,password:hashedpassword,phone:data.phone})
         await redisconn.set(confirmemailkey(data1._id),await createhash(otp),{
            expiration:{
                type:"EX",
                value:5*60
            }
         })
         await redisconn.set(resend(data1._id),0,{
            expiration:{
                type:"EX",
                value:60
            }
         })
         await redisconn.incr(attemps(data1._id))
        return data
}
login = async (data:logindata)=>{
    const user = await usermodel.findOne({$or:[
        {email:data.iden},
        {username:data.iden}
    ]})
    if (!user || !user.password) {
    throw new invalidcred()
}
    const match = await ismatch(data.password ,user.password)
    if(!match){
          throw new invalidcred()
    }
    const jwtid = nanoid()
        const access1 = jwt.sign({
            _id:user._id,
            email:user.email
        },
    access,{
        expiresIn:"30min",
        jwtid
    })
         const refresh1 = jwt.sign({
            _id:user._id,
            email:user.email
        },
    refresh,{
        expiresIn:"7d",
        jwtid
    })
    await redisconn.set(session(user._id,jwtid),jwtid,{
        expiration:{
            type:"EX",
            value:7*24*60*60
        }
    })
    return {
        refresh1,access1
    }
    
}
}

export const usersignup = new userservices()