import fs from "fs/promises";
import path from "path";

export async function internalizeImageFromUrl(imageUrl: string, postId: number) {
  if (!imageUrl.startsWith("https://bpichain.africa/")) {
    throw new Error("Only bpichain.africa images can be internalized");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch image (status ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = contentType.split("/")[1] || "jpg";
  const filename = `${postId}-${Date.now()}.${ext}`;
  const relative = path.join("uploads", "blog", filename);
  const targetPath = path.join(process.cwd(), "public", relative);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);

  return {
    localPath: `/${relative.replace(/\\/g, "/")}`,
    contentType,
  };
}
