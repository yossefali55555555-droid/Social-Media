export enum genderenum  {
    male,female
}
export enum providerenum {
    system,google
}
export enum roleenum {
    user,admin
}
export interface Iuser {
    username?:String      
    firstname:String 
    lastname :string
    password? :string
    age? : Number | undefined
    profileimage:string
    gender:genderenum
    provider : providerenum
    role:roleenum
    bio? :string | undefined
    confirmedAt:Date
    blockedAt:Date
    email:string
    phone?:string | undefined
    fullname:string
}