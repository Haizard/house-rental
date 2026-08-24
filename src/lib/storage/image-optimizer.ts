import sharp from "sharp";

export type ImageSize = {
  label: string;
  width: number;
  height: number;
  quality: number;
};

const SIZES: ImageSize[] = [
  { label: "thumb", width: 400, height: 300, quality: 80 },
  { label: "medium", width: 800, height: 600, quality: 85 },
  { label: "full", width: 1200, height: 900, quality: 90 },
];

/**
 * Optimize an image buffer: resize + compress + convert to WebP.
 * Returns optimized buffers for each size tier.
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  originalName: string
): Promise<
  { size: string; buffer: Buffer; contentType: string; suffix: string }[]
> {
  const results: {
    size: string;
    buffer: Buffer;
    contentType: string;
    suffix: string;
  }[] = [];

  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || 1200;
  const originalHeight = metadata.height || 900;

  for (const size of SIZES) {
    // Don't upscale — only downscale if the original is larger
    const targetWidth = Math.min(size.width, originalWidth);
    const targetHeight = Math.min(size.height, originalHeight);

    try {
      const optimized = await sharp(inputBuffer)
        .resize(targetWidth, targetHeight, {
          fit: "inside", // Maintain aspect ratio
          withoutEnlargement: true,
        })
        .webp({ quality: size.quality })
        .toBuffer();

      results.push({
        size: size.label,
        buffer: optimized,
        contentType: "image/webp",
        suffix: `${size.label}.webp`,
      });
    } catch {
      // Fallback: try JPEG
      try {
        const optimized = await sharp(inputBuffer)
          .resize(targetWidth, targetHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: size.quality, progressive: true })
          .toBuffer();

        results.push({
          size: size.label,
          buffer: optimized,
          contentType: "image/jpeg",
          suffix: `${size.label}.jpg`,
        });
      } catch {
        // If all optimization fails, return the original
        results.push({
          size: size.label,
          buffer: inputBuffer,
          contentType: getContentType(originalName),
          suffix: getExtension(originalName),
        });
      }
    }
  }

  return results;
}

/**
 * Validate image before processing.
 * Accepts JPEG, PNG, WebP, GIF. Max 10MB.
 */
export function validateImage(
  contentType: string | null,
  size: number
): { valid: boolean; error?: string } {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (contentType && !allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Unsupported image type: ${contentType}. Use JPEG, PNG, or WebP.`,
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    return {
      valid: false,
      error: `Image too large (${(size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Get a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

function getExtension(filename: string): string {
  return filename.split(".").pop() || "jpg";
}
