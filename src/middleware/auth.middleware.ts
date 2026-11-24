import jwt from "jsonwebtoken"
import { access, refresh } from "../config/config.js"
import { session } from "../utils/redis-services.js"
import { usermodel } from "../DB/models/user.model.js"
import { invalidtoken, loggedout, usernotfound } from "../utils/error.handle.js"
import { redisconn } from "../DB/redis.connection.js"
import type { Iuser } from "../modules/usermodule/user.types.js"
import type { HydratedDocument, Types } from "mongoose"
import type { NextFunction, Request, Response } from "express"

declare module "express-serve-static-core" {interface Request {
    user?:HydratedDocument <Iuser>,
    jti?:string
}
}
export const auth = async(req:Request,res:Response,next:NextFunction)=>{
    const {user,jti}=await decodetoken(req.headers.authorization as string)
    req.user =user
    req.jti =jti
    next()
}

export enum tokenenum {
    access,refresh
}
export const decodetoken =  async(authorization:string,tokentype=tokenenum.access)=>{
    if(!authorization||!authorization.startsWith("Bearer")){
        throw new invalidtoken()
    }
    const token = authorization.split(" ")[1]
    if(!token){
        throw new invalidtoken()
    }
    const payload = jwt.verify(token,
        tokentype==tokenenum.access?
        access
        :refresh
    )as jwt.JwtPayload & {_id?:number|Types.ObjectId,email?:string}
    const user = await usermodel.findById(payload._id)
      if(!user){
        throw new usernotfound()
    }
    // if(!user.confirmedAt){
    //     err("confirm first",400)
    // }
    const {jti} =payload
    if(!jti){
        throw new invalidtoken()
    }
    const redisjti =  await redisconn.get(session(user._id,jti))
    if(!redisjti){
        throw new loggedout()
    }
    return {user,jti}
}


// export const authorization =  (...roles)=>{
//     return async(req,res,next)=>{
//      if(!roles.includes(req.user.role)){
//         err("unauthorized",401)
//     }
//     next()
//     }
// }