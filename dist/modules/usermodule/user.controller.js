import { Router } from "express";
import { auth } from "../../middleware/auth.middleware.js";
// import { success } from "../../utils/success.js";
import { usersignup } from "./user.service.js";
import { appendFile } from "fs";
import { usermodel } from "../../DB/models/user.model.js";
import { uploadfile } from "../../utils/multer.js";
import { toFile } from "@imagekit/nodejs";
import { imagekit } from "../../utils/imageKit/imagekit.js";
const userrouter = Router();
export const userRoutes = {
    base: "/users",
    signup: "/signup",
    login: "/login",
    me: "/me",
    uploadfile: "/upload",
    refresh: "/refresh",
    forgetPass: "/forget-pass",
    resetpass: "/reset-pass",
    googlelogin: "/google-login",
    resendconfirmemail: "/resendotp",
    confirmemail: "/confirm",
    logout: "/logout1",
    logoutall: "/logoutall"
};
userrouter.post(userRoutes.signup, async (req, res) => {
    const { body } = req;
    const data = await usersignup.signup(body);
    res.success(data, "User created successfully");
});
userrouter.post(userRoutes.login, async (req, res) => {
    const { body } = req;
    let data = await usersignup.login(body);
    res.success(data, "login successfull");
});
userrouter.get(userRoutes.me, auth, async (req, res) => {
    res.success(req.user);
});
userrouter.post(userRoutes.uploadfile, auth, uploadfile("/users", 2).single("image"), async (req, res) => {
    if (!req.file) {
        throw new Error("File not found");
    }
    if (!req.user) {
        throw new Error("User not found");
    }
    const user_id = req.user._id.toString();
    // Create user-specific folder
    const uploaded = await imagekit.files.upload({
        file: await toFile(req.file.buffer, req.file.originalname),
        fileName: req.file.originalname,
        folder: `/users/${user_id}`,
        useUniqueFileName: true
    });
    // Save image information in MongoDB
    if (!uploaded.url) {
        throw new Error("Image URL not found");
    }
    req.user.profileimage = uploaded.url;
    await req.user.save();
    res.success({
        profileimage: uploaded.url,
        profileimagepath: uploaded.filePath,
        profileimageid: uploaded.fileId
    }, "Image uploaded successfully");
});
userrouter.get(userRoutes.refresh, async (req, res) => {
    const data = await usersignup.refresh(req.headers.authorization);
    res.success(data, "");
});
userrouter.post(userRoutes.forgetPass, async (req, res) => {
    const { email } = req.body;
    const data = await usersignup.forgetPassSendmail(email);
    res.success(data, "OTP sent successfully");
});
userrouter.post(userRoutes.resetpass, async (req, res) => {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
        throw new Error("All fields are required");
    }
    const data = await usersignup.resetpassword(email, otp, password);
    res.success(data, "Password reset successfully");
});
userrouter.post(userRoutes.googlelogin, async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw new Error("Google token is required");
    }
    const data = await usersignup.gmaillogin(token);
    res.success(data, "Google login successfully");
});
// Resend 
userrouter.post(userRoutes.resendconfirmemail, async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new Error("Email is required");
    }
    const data = await usersignup.resendconfirmemail(email);
    res.success(data, "OTP sent successfully");
});
// Confirm 
userrouter.post(userRoutes.confirmemail, async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new Error("Email and OTP are required");
    }
    const data = await usersignup.confirmed(otp, email);
    res.success(data, "Email confirmed successfully");
});
// Logout
userrouter.post(userRoutes.logout, auth, async (req, res) => {
    const { _id } = req.user;
    const { jti } = req;
    if (!_id || !jti) {
        throw new Error("User ID and JTI are required");
    }
    const data = await usersignup.logout1(_id, jti);
    res.success(data, "Logged out successfully");
});
// Logout all
userrouter.post(userRoutes.logoutall, auth, async (req, res) => {
    const { _id } = req.user;
    if (!_id) {
        throw new Error("User ID is required");
    }
    const data = await usersignup.logoutall(_id);
    res.success(data, "Logged out from all devices successfully");
});
//my notes //
userrouter.get("/hooks", async (req, res) => {
    // const data = new usermodel({
    //     fullname:"yosdsef ali",
    //     email:"yossedf@route.com",
    //     password:"anddsfsadfa",
    //     username:"wladwlaahooo",
    //     phone:"821094d8908349080941823"
    // })
    // const user = data.save()
    const data = await usermodel.findById("6b05edac787328f74d80124c");
    res.json({ data });
});
export default userrouter;
