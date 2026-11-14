import jwt from "jsonwebtoken";
import { access, refresh } from "../config/config.js";
import { session } from "../utils/redis-services.js";
import { usermodel } from "../DB/models/user.model.js";
import { invalidtoken, loggedout, usernotfound } from "../utils/error.handle.js";
import { redisconn } from "../DB/redis.connection.js";
export const auth = async (req, res, next) => {
    const { user, jti } = await decodetoken(req.headers.authorization);
    req.user = user;
    req.jti = jti;
    next();
};
export var tokenenum;
(function (tokenenum) {
    tokenenum[tokenenum["access"] = 0] = "access";
    tokenenum[tokenenum["refresh"] = 1] = "refresh";
})(tokenenum || (tokenenum = {}));
export const decodetoken = async (authorization, tokentype = tokenenum.access) => {
    if (!authorization || !authorization.startsWith("Bearer")) {
        throw new invalidtoken();
    }
    const token = authorization.split(" ")[1];
    if (!token) {
        throw new invalidtoken();
    }
    const payload = jwt.verify(token, tokentype == tokenenum.access ?
        access
        : refresh);
    const user = await usermodel.findById(payload._id);
    if (!user) {
        throw new usernotfound();
    }
    // if(!user.confirmedAt){
    //     err("confirm first",400)
    // }
    const { jti } = payload;
    if (!jti) {
        throw new invalidtoken();
    }
    const redisjti = await redisconn.get(session(user._id, jti));
    if (!redisjti) {
        throw new loggedout();
    }
    return { user, jti };
};
// export const authorization =  (...roles)=>{
//     return async(req,res,next)=>{
//      if(!roles.includes(req.user.role)){
//         err("unauthorized",401)
//     }
//     next()
//     }
// }
