import { createClient } from "redis";
import { redis_url } from "../config/config.js";
export const redisconn = createClient({
    url : redis_url,
    database:10
}
)

redisconn.on("error",(err)=>{
    console.log(err)
}).on("connect",()=>{
    console.log("redis connected")
}).connect()