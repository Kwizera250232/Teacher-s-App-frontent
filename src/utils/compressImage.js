/** Resize/compress images before classroom feed upload (avoids server size limits). */
export async function prepareFeedImageFile(file) {
  if (!file || !file.type?.startsWith('image/')) return file;

  const maxBytes = 3 * 1024 * 1024;
  if (file.size <= maxBytes && !/heic|heif/i.test(file.type)) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      const maxW = 1600;
      if (w > maxW) {
        h = Math.round(h * (maxW / w));
        w = maxW;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not compress image. Try a smaller photo.'));
            return;
          }
          const name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file.'));
    };
    img.src = url;
  });
}
