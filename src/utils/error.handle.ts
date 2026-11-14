export interface IError extends Error {
    status:number
}
export class AppError extends Error {
    constructor(msg:string,private status:number=500 )
    {
        super(msg)
    }
}

export class badrequest extends AppError {
    constructor(msg:string="user aleardy exists"){
        super(msg,400)
    }
}

export class invalidcred extends AppError {
    constructor(){
        super ("invalid creds",404)
    }
}

export class invalidtoken extends AppError {
    constructor(){
        super ("invalid token",404)
    }
}
export class usernotfound extends AppError {
    constructor(){
        super ("user not found",404)
    }
}


export class loggedout extends AppError {
    constructor(){
        super ("you logged out",400)
    }
}