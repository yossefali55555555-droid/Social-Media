import mongoose from "mongoose";
import { mongo_url } from "../config/config.js";
export const Dbconnection =async()=>{
    return await mongoose.connect(mongo_url).then(()=>{
        console.log("mongodb connected")
    }).catch((err)=>{
        console.log("error is " + err)   
    })
}