import ImageKit from "@imagekit/nodejs";
import { privateImage } from "../../config/config.js";
export const imagekit = new ImageKit({
    privateKey: privateImage
});
