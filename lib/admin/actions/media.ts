"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { assertUser } from "../auth";
import { dataDir } from "../db";
import type { Result } from "../action";

// Not exported: every export of a "use server" file becomes a callable endpoint.
const mediaDir = async () => {
  const dir = path.join(dataDir, "media");
  await mkdir(dir, { recursive: true });
  return dir;
};

/**
 * Image upload for product photos, promo banners and profile pictures. Whatever is uploaded is decoded and
 * re-encoded to WebP (max 1600 px), so only clean pixels are stored — no scripts, EXIF or polyglot files.
 */
export async function uploadImage(form: FormData): Promise<Result<string>> {
  try {
    await assertUser();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
    if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Images must be 4 MB or smaller." };
    if (!/^image\/(png|jpe?g|webp|avif|gif)$/.test(file.type)) return { ok: false, error: "Use a PNG, JPG, WebP, AVIF or GIF image." };

    const out = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 90 })
      .toBuffer();
    const name = `${crypto.randomUUID().replace(/-/g, "")}.webp`;
    await writeFile(path.join(await mediaDir(), name), out);
    return { ok: true, data: `/media/${name}` };
  } catch {
    return { ok: false, error: "That file couldn't be read as an image." };
  }
}
