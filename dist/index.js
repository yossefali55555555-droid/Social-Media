import express, {} from "express";
import userrouter, { userRoutes } from "./modules/usermodule/user.controller.js";
import { Dbconnection } from "./DB/mongodb.connection.js";
import { PORT } from "./config/config.js";
import { redisconn } from "./DB/redis.connection.js";
import { usermodel } from "./DB/models/user.model.js";
const app = express();
app.use(express.json());
await Dbconnection();
app.use((req, res, next) => {
    res.success = (data, message = "success") => {
        res.status(200).json({
            success: true,
            message,
            data
        });
    };
    next();
});
app.use(userRoutes.base, userrouter);
app.use("/uploads", express.static("./uploads"));
app.use((err, req, res, next) => {
    const status = err?.status || 500;
    res.status(status).json({
        msg: err.message,
        code: err.status
    });
});
app.listen(PORT, () => {
    console.log("the server connected");
});
