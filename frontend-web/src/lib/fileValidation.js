export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validasi file unggahan foto lahan
 * @param {File} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, error: 'File tidak ditemukan' };
  }

  const name = file.name || 'File';
  const ext = name.includes('.') ? `.${name.split('.').pop().toLowerCase()}` : '';

  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: `${name}: format tidak didukung. Gunakan JPG, PNG, atau WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${name}: melebihi batas 5 MB.`,
    };
  }

  return { valid: true, error: null };
}
