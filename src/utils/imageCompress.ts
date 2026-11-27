/**
 * Compresses and resizes an image file in the browser using Canvas
 * before uploading via multipart/form-data.
 */
export async function compressImageFile(file: File, maxWidth = 1280, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Unable to read image ${file.name}`));
      el.src = objectUrl;
    });

    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const targetMime = 'image/webp';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, targetMime, quality),
    );
    if (!blob) return file;

    const ext = '.webp';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}${ext}`, { type: targetMime });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
