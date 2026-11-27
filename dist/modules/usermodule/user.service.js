import { string } from "zod";
import { usermodel } from "../../DB/models/user.model.js";
import { redisconn } from "../../DB/redis.connection.js";
import { random1 } from "../../utils/email/createOTP.js";
import { emailTemplate } from "../../utils/email/emailTemplate.js";
import { sendemail } from "../../utils/email/sendemail.js";
import { AppError, badrequest, invalidcred, loggedout, usernotfound } from "../../utils/error.handle.js";
import { attemps, attemps2, block, block2, blockcount, blockcount2, confirmemailkey, confirmemailkey2, resend, resend2, session, sessionperfix, userprefix, userprefix2 } from "../../utils/redis-services.js";
import { createhash, ismatch } from "../../utils/security/hash.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { access, clientid, refresh } from "../../config/config.js";
import { decodetoken, tokenenum } from "../../middleware/auth.middleware.js";
import { OAuth2Client } from "google-auth-library";
import { providerenum } from "./user.types.js";
const client = new OAuth2Client();
export const bcounts = (count) => {
    const blockmin = [5, 15, 60, 300, 1440];
    const index = Math.min(count, blockmin.length);
    return blockmin[index] * 60;
};
class userservices {
    signup = async (data) => {
        const user = await usermodel.findOne({ $or: [
                { email: data.email },
                { username: data.email }
            ] });
        if (user) {
            throw new badrequest("user aleardy exists !");
        }
        const otp = random1();
        await sendemail({ to: data.email, subject: "Verify Your Email", html: emailTemplate({ otp, subject: "Verify Your Email" }) });
        // const hashedpassword = await createhash(data.password)
        const data1 = await usermodel.insertOne({ username: data.username, fullname: data.fullname, email: data.email,
            password: data.password, phone: data.phone });
        await redisconn.set(confirmemailkey(data1._id), await createhash(otp), {
            expiration: {
                type: "EX",
                value: 5 * 60
            }
        });
        await redisconn.set(resend(data1._id), 0, {
            expiration: {
                type: "EX",
                value: 60
            }
        });
        await redisconn.incr(attemps(data1._id));
        return data;
    };
    login = async (data) => {
        const user = await usermodel.findOne({ $or: [
                { email: data.iden },
                { username: data.iden }
            ] });
        if (!user || !user.password) {
            throw new invalidcred();
        }
        const match = await ismatch(data.password, user.password);
        if (!match) {
            throw new invalidcred();
        }
        const jwtid = nanoid();
        const access1 = jwt.sign({
            _id: user._id,
            email: user.email
        }, access, {
            expiresIn: "30min",
            jwtid
        });
        const refresh1 = jwt.sign({
            _id: user._id,
            email: user.email
        }, refresh, {
            expiresIn: "7d",
            jwtid
        });
        await redisconn.set(session(user._id, jwtid), jwtid, {
            expiration: {
                type: "EX",
                value: 7 * 24 * 60 * 60
            }
        });
        return {
            refresh1, access1
        };
    };
    refresh = async (authorization) => {
        const { user, jti } = await decodetoken(authorization, tokenenum.refresh);
        const access1 = jwt.sign({
            _id: user._id,
            email: user.email
        }, access, {
            expiresIn: "30min",
            jwtid: jti
        });
        return access1;
    };
    forgetPassSendmail = async (email) => {
        const user = await usermodel.findOne({ email });
        if (!user) {
            return;
        }
        const isotp = await redisconn.get(confirmemailkey2(user._id));
        if (isotp) {
            return "you still have otp";
        }
        const cannotresend = await redisconn.get(resend2(user._id))
            || await redisconn.get(block2(user._id));
        if (cannotresend) {
            throw new Error("wait shwya");
        }
        const attemptsCount = await redisconn.incr(attemps2(user._id));
        if (attemptsCount >= 5) {
            const blocKcount = await redisconn.incr(blockcount2(user._id));
            await redisconn.set(block2(user._id), 0, {
                expiration: {
                    type: "EX",
                    value: bcounts(blocKcount)
                }
            });
            await redisconn.set(attemps2(user._id), 0);
            throw new Error("Too many attempts");
        }
        else {
            await redisconn.set(resend2(user._id), 0, {
                expiration: {
                    type: "EX",
                    value: 60
                }
            });
            const otp = random1();
            await redisconn.set(confirmemailkey2(user._id), await createhash(otp), {
                expiration: {
                    type: "EX",
                    value: 5 * 60
                }
            });
            await sendemail({ to: email, subject: "FORGET PASS OTP", html: emailTemplate({ subject: "FORGET PASS OTP", otp }) });
            return { data: {} };
        }
    };
    resetpassword = async (email, otp, password) => {
        const user = await usermodel.findOne({ email });
        if (!user) {
            throw new usernotfound();
        }
        const dbotp = await redisconn.get(confirmemailkey2(user._id));
        if (!dbotp) {
            throw new Error("invalid or expired otp");
        }
        const isblocked = await redisconn.get(block2(user._id));
        if (isblocked) {
            const blockedttl = await redisconn.ttl(block2(user._id));
            throw new Error(`you are restricted until ${Math.ceil(blockedttl / 60)}`);
        }
        const otpcorrect = await ismatch(otp, dbotp);
        if (!otpcorrect) {
            const attemptsCount = await redisconn.incr(attemps2(user._id));
            if (attemptsCount >= 5) {
                const blocKcount = await redisconn.incr(blockcount2(user._id));
                const durationMinutes = bcounts(blocKcount) / 60;
                await redisconn.set(block2(user._id), 0, {
                    expiration: {
                        type: "EX",
                        value: bcounts(blocKcount)
                    }
                });
                await redisconn.set(attemps2(user._id), 0);
                throw new Error(`you are restricted until the block ${durationMinutes} minutes remaining`);
            }
            throw new Error("Invalid OTP");
        }
        else {
            user.password = await createhash(password);
            await user.save();
            const userkeys = await redisconn.keys(`${userprefix2(user._id)}*`);
            await redisconn.del(userkeys);
            return { data: {} };
        }
    };
    gmaillogin = async (token) => {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientid
        }); //فكينا توكين كلها 
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error("Invalid Google Token");
        }
        const { name, email, picture } = payload; //الداتا فعلا الي جوا بتاعى اليوزر
        let user = await usermodel.findOne({ email });
        if (user) {
            if (user.provider !== providerenum.google) {
                throw new Error("please signup with your provider");
            }
        }
        else {
            user = await usermodel.create({
                email,
                fullname: name ?? email.split("@")[0],
                ...(picture && { profileimage: picture }),
                provider: providerenum.google
            });
        }
        const access1 = jwt.sign({
            _id: user._id,
            email: user.email
        }, access, {
            expiresIn: "30min"
        });
        const refresh1 = jwt.sign({
            _id: user._id,
            email: user.email
        }, refresh, {
            expiresIn: "30day"
        });
        return {
            refresh1, access1
        };
    };
    // resend otp 
    resendconfirmemail = async (email) => {
        const user = await usermodel.findOne({ email, confirmedAt: {
                $exists: false
            } });
        if (!user) {
            throw new usernotfound();
        }
        const cannotresend = await redisconn.get(resend(user._id))
            || await redisconn.get(block(user._id));
        if (cannotresend) {
            throw new Error("wait shwya ");
        }
        const attemptsCount = await redisconn.incr(attemps(user._id));
        if (attemptsCount >= 5) {
            const blocKcount = await redisconn.incr(blockcount(user._id));
            await redisconn.set(block(user._id), 0, {
                expiration: {
                    type: "EX",
                    value: bcounts(blocKcount)
                }
            });
            await redisconn.set(attemps(user._id), 0);
        }
        else {
            await redisconn.set(resend(user._id), 0, {
                expiration: {
                    type: "EX",
                    value: 60
                }
            });
        }
        const otp = random1();
        await sendemail({ to: email, subject: "Verify Your Email", html: emailTemplate({ otp, subject: "Verify Your Email" }) });
        await redisconn.set(confirmemailkey(user._id), await createhash(otp), {
            expiration: {
                type: "EX",
                value: 5 * 60
            }
        });
        return { data: {} };
    };
    // confirm 
    confirmed = async (otp, email) => {
        const user = await usermodel.findOne({ email, confirmedAt: {
                $exists: false
            } });
        if (!user) {
            throw new usernotfound();
        }
        const dbotp = await redisconn.get(confirmemailkey(user._id));
        if (!dbotp) {
            throw new Error("invalid or expired otp");
        }
        const isblocked = await redisconn.get(block(user._id));
        if (isblocked) {
            const blockedttl = await redisconn.ttl(block(user._id));
            throw new Error(`you are restricted until ${Math.ceil(blockedttl / 60)}`);
        }
        const otpcorrect = await ismatch(otp, dbotp);
        if (!otpcorrect) {
            const attemptsCount = await redisconn.incr(attemps(user._id));
            if (attemptsCount >= 5) {
                const blocKcount = await redisconn.incr(blockcount(user._id));
                const durationMinutes = bcounts(blocKcount) / 60;
                await redisconn.set(block(user._id), 0, {
                    expiration: {
                        type: "EX",
                        value: bcounts(blocKcount)
                    }
                });
                await redisconn.set(attemps(user._id), 0);
                throw new Error(`you are restricted until the block ${durationMinutes} minutes remaining`);
            }
            throw new Error("Invalid OTP");
        }
        else {
            user.confirmedAt = new Date();
            await user.save();
            const userkeys = await redisconn.keys(`${userprefix(user._id)}*`);
            await redisconn.del(userkeys);
        }
        return "done";
    };
    // logout 1
    logout1 = async (userid, jti) => {
        const user = await usermodel.findById(userid);
        if (!user) {
            throw new usernotfound();
        }
        const redisSession = await redisconn.del(session(userid, jti));
        if (redisSession < 1) {
            throw new loggedout();
        }
        return "logout done ^^";
    };
    // logout all
    logoutall = async (userid) => {
        const user = await usermodel.findById(userid);
        if (!user) {
            throw new Error("user not found ");
        }
        const redisSession = await redisconn.keys(`${sessionperfix(userid)}*`);
        const deleteall = await redisconn.del(redisSession);
        if (deleteall < 1) {
            throw new loggedout();
        }
        return "logout done ^^";
    };
}
export const usersignup = new userservices();
