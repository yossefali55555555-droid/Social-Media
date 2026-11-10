import type { Types } from "mongoose"

export const userprefix = (userid:string | Types.ObjectId) =>`users:${userid}:otp`
export const confirmemailkey  = (userid:string | Types.ObjectId) =>`${userprefix(userid)}:confirmemail`
export const resend = (userid:string | Types.ObjectId) => `${userprefix(userid)}:resend`
export const attemps = (userid:string | Types.ObjectId) =>`${userprefix(userid)}:attemps` 
export const block = (userid:string | Types.ObjectId) =>`${userprefix(userid)}:block`
export const blockcount = (userid:string | Types.ObjectId) =>`${userprefix(userid)}:blockcount`


//for forget password
export const userprefix2 = (userid:string | Types.ObjectId) =>`users:${userid}:forget`
export const  confirmemailkey2 = (userid:string | Types.ObjectId) =>`${userprefix2(userid)}:confirmemail`
export const resend2 = (userid:string | Types.ObjectId) => `${userprefix2(userid)}:resend`
export const attemps2 = (userid:string | Types.ObjectId) =>`${userprefix2(userid)}:attemps` 
export const block2 = (userid:string | Types.ObjectId) =>`${userprefix2(userid)}:block`
export const blockcount2 = (userid:string | Types.ObjectId) =>`${userprefix2(userid)}:blockcount`


//for  jti
export const sessionperfix= (userid:string | Types.ObjectId)=>{
    return `users:${userid}:session`
}
export const session= (userid:string | Types.ObjectId,jti:string)=>{
    return `${sessionperfix(userid)}:${jti}`
}