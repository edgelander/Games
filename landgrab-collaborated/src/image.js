// Client-side image compression before upload — keeps Supabase storage small
// while staying sharp on a phone. Phone photos are several MB; this gets them
// down to roughly 50–150 KB.
const MAX_DIM = 1080;   // longest side, in px — plenty for a phone screen
const QUALITY = 0.82;   // JPEG/WebP quality

// Does this browser's canvas actually encode WebP? (Safari gained this recently.)
function supportsWebP() {
  try {
    return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function extFromName(name) {
  return ((name && name.split('.').pop()) || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
}

// Returns { blob, ext } to upload. Falls back to the original file whenever
// compression isn't safe/helpful (GIFs, non-images, decode errors, or when the
// re-encoded result isn't actually smaller).
export async function compressImage(file) {
  // Preserve GIF animation; pass through anything that isn't a still image.
  if (!file.type || !file.type.startsWith('image/') || file.type === 'image/gif') {
    return { blob: file, ext: extFromName(file.name) };
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const webp = supportsWebP();
    const type = webp ? 'image/webp' : 'image/jpeg';
    const ext = webp ? 'webp' : 'jpg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));

    // Keep whichever is smaller (tiny source images may already beat re-encoding).
    if (!blob || blob.size >= file.size) return { blob: file, ext: extFromName(file.name) };
    return { blob, ext };
  } catch {
    return { blob: file, ext: extFromName(file.name) };
  }
}
