export interface ImageValidationRules {
  maxSizeMB: number;
  maxWidth: number;
  maxHeight: number;
  allowedFormats: string[];
  minWidth?: number;
  minHeight?: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  file?: File;
  dimensions?: { width: number; height: number };
  sizeInfo?: { sizeMB: number; sizeKB: number };
}

export const DEFAULT_IMAGE_RULES: ImageValidationRules = {
  maxSizeMB: 5,
  maxWidth: 1920,
  maxHeight: 1080,
  minWidth: 100,
  minHeight: 100,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

export const MENU_ITEM_RULES: ImageValidationRules = {
  maxSizeMB: 2,
  maxWidth: 1200,
  maxHeight: 800,
  minWidth: 200,
  minHeight: 150,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

export async function validateImage(
  file: File,
  rules: ImageValidationRules = DEFAULT_IMAGE_RULES
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const sizeMB = file.size / (1024 * 1024);
  const sizeKB = file.size / 1024;
  
  // Check file type - only reject completely unsupported formats
  if (!file.type.startsWith('image/')) {
    errors.push('Please select an image file (JPG, PNG, WEBP, etc.)');
  }
  
  // We'll auto-process everything else, so no size/dimension errors
  // Just provide helpful info
  let dimensions: { width: number; height: number } | undefined;
  
  if (file.type.startsWith('image/')) {
    try {
      dimensions = await getImageDimensions(file);
      warnings.push(`✨ Image will be automatically optimized for best performance`);
    } catch (error) {
      errors.push('Unable to process this image file. Please try a different image.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    file,
    dimensions,
    sizeInfo: { sizeMB, sizeKB }
  };
}

export async function processImageForUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate optimal dimensions (max 800px for either dimension)
      let { width, height } = img;
      const maxSize = 800;
      
      // Maintain aspect ratio while ensuring max dimension is 800px
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      // Ensure minimum size (200x150) by scaling up if needed
      const minWidth = 200;
      const minHeight = 150;
      
      if (width < minWidth || height < minHeight) {
        const scaleX = minWidth / width;
        const scaleY = minHeight / height;
        const scale = Math.max(scaleX, scaleY);
        
        width *= scale;
        height *= scale;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress - high quality for food photos
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Use JPEG with 85% quality for good balance of quality and size
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Check final size and adjust quality if needed
      const finalSize = optimizedDataUrl.length * 0.75; // approximate size in bytes
      const finalSizeMB = finalSize / (1024 * 1024);
      
      if (finalSizeMB > 1.5) {
        // If still too large, reduce quality more
        const reducedQualityDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(reducedQualityDataUrl);
      } else {
        resolve(optimizedDataUrl);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to process image. Please try a different image.'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export function getImageValidationMessage(result: ImageValidationResult): string {
  if (result.isValid) {
    let message = '✅ Image valid';
    if (result.dimensions) {
      message += ` (${result.dimensions.width}×${result.dimensions.height}px, ${formatFileSize(result.file!.size)})`;
    }
    return message;
  }
  
  return result.errors.join('\n');
}

export function getImageRecommendations(rules: ImageValidationRules): string[] {
  return [
    `📏 Recommended dimensions: ${rules.minWidth || 200}-${rules.maxWidth}px × ${rules.minHeight || 150}-${rules.maxHeight}px`,
    `💾 Maximum file size: ${rules.maxSizeMB}MB`,
    `📋 Supported formats: ${rules.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`,
    `🎯 For best results: Use JPEG for photos, PNG for graphics with transparency`,
    `⚡ Tip: Compress images before upload for faster loading`
  ];
}