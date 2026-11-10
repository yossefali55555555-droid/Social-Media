import argon2 from "argon2"
export const createhash = async(password:string)=>{
    const generatedhash = await argon2.hash(password,{
        memoryCost:1024*1024 //1MB
    })
    return generatedhash
}
export const ismatch = async(password:string,dbpassword:string)=>{
    const data = await argon2.verify(dbpassword,password)
    return data //true or false
}