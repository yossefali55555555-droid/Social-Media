import { model, Schema, Types, type HydratedDocument } from "mongoose";
import { genderenum, providerenum, roleenum, type Iuser } from "../../modules/usermodule/user.types.js";
import { decryption, encryption } from "../../utils/security/encryption.js";


const userschema = new Schema <Iuser> ({
     username:{
        type:String,
         required:function(this:Iuser){
            this.provider == providerenum.system ? true :false;
        },
        unique:true
    } 
    ,firstname :{
        type:String,
        required:true
    },
      lastname :{
        type:String,
        required:true
    },
        email :{
        type:String,
        required:true,
        unique:true
    }
    ,
      password :{
        type:String,
        required:function(this:Iuser){
            this.provider == providerenum.system ? true :false;
        }
    },
    age : Number,
    profileimage:{
        type:String
    },
    gender:{
        type:Number,
        enum :genderenum,
        default:genderenum.male
    },
    provider : {
        type:Number,
        enum: providerenum,
        default:providerenum.system
    },
    role:{
        type:Number,
        enum : roleenum,
        default : roleenum.user
    },
    bio :{
        type:String
    },
    confirmedAt:{
        type:Date
    },
    blockedAt:Date,
    phone:{
        type:String,
        set (value:string) {
            return encryption(value)
        },
        get(value:string){
            return decryption(value)
        }
    }
},{
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,

    toJSON: {
        virtuals: true,
        getters: true,
        transform(doc, ret) {
            delete ret.password;
            delete (ret as Iuser & {id?:string}).id;
            return ret;
        }
    },

    toObject: {
        virtuals: true,
        getters: true
    },

    virtuals: {
        fullname: {
            set(this:HydratedDocument<Iuser>,value:string) {
                const [firstname, lastname] = value.split(" ");

                if (!firstname || !lastname) {
                    throw new Error("should type first or last name");
                }

                this.set("firstname", firstname);
                this.set("lastname", lastname);
            }
        }
    }
})

export const usermodel = model("users",userschema)