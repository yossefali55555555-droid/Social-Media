export class AppError extends Error {
    status;
    constructor(msg, status = 500) {
        super(msg);
        this.status = status;
    }
}
export class badrequest extends AppError {
    constructor(msg = "user aleardy exists") {
        super(msg, 400);
    }
}
