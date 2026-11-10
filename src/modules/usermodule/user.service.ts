import { usermodel } from "../../DB/models/user.model.js";
import { redisconn } from "../../DB/redis.connection.js";
import { random1 } from "../../utils/email/createOTP.js";
import { emailTemplate } from "../../utils/email/emailTemplate.js";
import { sendemail } from "../../utils/email/sendemail.js";
import { AppError, badrequest } from "../../utils/error.handle.js";
import { attemps, confirmemailkey, resend } from "../../utils/redis-services.js";
import { createhash } from "../../utils/security/hash.js";
import type { signupdata } from "./user.validation.js";

export const signup = async(data:signupdata)=>{
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