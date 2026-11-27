import multer, { diskStorage } from "multer";
import fs from "fs/promises";
export const uploadfile = (dest = "./uploads", choice = 2) => {
    let storage;
    switch (choice) {
        case 1:
            storage = diskStorage({
                destination: async (req, file, cb) => {
                    const user_id = req.user?._id?.toString() || "guestID";
                    const folder_name = `./uploads${dest}_${user_id}`;
                    try {
                        await fs.access(folder_name);
                    }
                    catch (err) {
                        await fs.mkdir(folder_name, {
                            recursive: true
                        });
                    }
                    cb(null, folder_name);
                },
                filename: (req, file, cb) => {
                    const username = req.user?.username || "guestNAME";
                    const filename = username + "_" + Date.now() + "_" + file.originalname;
                    cb(null, filename);
                }
            });
            break;
        case 2:
            storage = multer.memoryStorage();
            break;
        default:
            storage = multer.memoryStorage();
            break;
    }
    return multer({
        storage
    });
};
