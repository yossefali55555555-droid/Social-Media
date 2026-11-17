import { Router } from "express";
import { auth } from "../../middleware/auth.middleware.js";
// import { success } from "../../utils/success.js";
import { usersignup } from "./user.service.js";
const userrouter = Router();
export const userRoutes = {
    base: "/users",
    signup: "/signup",
    login: "/login",
    me: "/me"
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
export default userrouter;
