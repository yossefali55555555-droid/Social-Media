export const success = ({ res, status, msg, data }) => {
    return res.status(status).json({
        data,
        msg,
        status
    });
};
