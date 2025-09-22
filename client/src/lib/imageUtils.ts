// Utility functions for handling images efficiently

export function compressImage(file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function safeSaveToLocalStorage(key: string, data: any): boolean {
  try {
    const jsonString = JSON.stringify(data);
    
    // Check if the data size is reasonable (under 4MB to be safe)
    if (jsonString.length > 4 * 1024 * 1024) {
      console.warn('Data too large for localStorage');
      return false;
    }
    
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      // QuotaExceededError
      console.error('localStorage quota exceeded');
      
      // Try to clear some space by removing old data
      try {
        localStorage.removeItem('tempData');
        localStorage.removeItem('cache');
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (retryError) {
        console.error('Failed to save even after cleanup:', retryError);
        return false;
      }
    }
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}