import multer from "multer";
import { AppError } from "./errorHandler.middleware.js";

const storage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Not an image! Please upload only images.", 400));
    }
  },
});
