import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "URL immagine mancante" }, { status: 400 });
    }

    // Scarica l'immagine
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Impossibile scaricare l'immagine" }, { status: 400 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determina l'estensione del file
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const filename = `web-search-${Date.now()}.${extension}`;

    // Scegli se usare Cloudinary o storage locale
    const useCloudinary = Boolean(cloudinaryCloudName && cloudinaryUploadPreset);

    if (useCloudinary) {
      // Upload su Cloudinary
      const blob = new Blob([buffer], { type: contentType });
      const formData = new FormData();
      formData.append("file", blob, filename);
      formData.append("upload_preset", cloudinaryUploadPreset!);
      formData.append("folder", "inventario-av");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        const error = await cloudinaryResponse.json().catch(() => ({}));
        throw new Error(error?.error?.message || "Upload Cloudinary fallito");
      }

      const data = await cloudinaryResponse.json();
      return NextResponse.json({ url: data.secure_url });
    } else {
      // Upload locale in /public/uploads
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadsDir, filename);

      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      return NextResponse.json({ url: publicUrl });
    }
  } catch (error: any) {
    console.error("Error downloading/uploading image:", error);
    return NextResponse.json(
      { error: error.message || "Errore del server" },
      { status: 500 }
    );
  }
}
