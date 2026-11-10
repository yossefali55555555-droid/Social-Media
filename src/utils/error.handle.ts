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