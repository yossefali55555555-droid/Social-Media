//the old one

// import type { Response } from "express"

// export const success = ({
//     res,
//     status,
//     msg,
//     data
// }: {
//     res: Response,
//     status: number,
//     msg?: string,
//     data: object
// }) => {
//     return res.status(status).json({
//         data,
//         msg,
//         status
//     })
// }



declare module "express-serve-static-core"   {
        interface Response {
            success: (data?: unknown, message?: string) => void
        }
    }


