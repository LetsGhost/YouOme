import multer from "multer";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8MB - matches nginx client_max_body_size

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed"));
      return;
    }
    callback(null, true);
  },
});

export const avatarUpload = upload.single("avatar");
