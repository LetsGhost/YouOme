import sharp from "sharp";

const AVATAR_DIMENSION_PX = 512;
const AVATAR_WEBP_QUALITY = 80;

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

// Takes an arbitrary uploaded image (e.g. an 8MB phone photo) and produces a
// small, fixed-size avatar: auto-oriented (phones store rotation as EXIF
// metadata rather than actually rotating pixels), cropped to a square, capped
// at 512x512, re-encoded as WebP. This is what keeps avatars in the
// low-tens-of-KB range instead of megabytes, regardless of what was uploaded.
export async function processAvatarImage(input: Buffer): Promise<ProcessedImage> {
  const buffer = await sharp(input)
    .rotate()
    .resize(AVATAR_DIMENSION_PX, AVATAR_DIMENSION_PX, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: AVATAR_WEBP_QUALITY })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    extension: "webp",
  };
}
