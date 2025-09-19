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
  
  // Check file type
  if (!rules.allowedFormats.includes(file.type)) {
    const allowedExtensions = rules.allowedFormats
      .map(format => format.split('/')[1].toUpperCase())
      .join(', ');
    errors.push(`File type not supported. Please use: ${allowedExtensions}`);
  }
  
  // Check file size
  if (sizeMB > rules.maxSizeMB) {
    errors.push(
      `File size too large (${formatFileSize(file.size)}). Maximum allowed: ${rules.maxSizeMB}MB`
    );
  }
  
  // Add size warning if approaching limit
  if (sizeMB > rules.maxSizeMB * 0.8) {
    warnings.push(
      `Large file size (${formatFileSize(file.size)}). Consider optimizing for faster uploads.`
    );
  }
  
  let dimensions: { width: number; height: number } | undefined;
  
  // Check image dimensions if it's a valid image type
  if (rules.allowedFormats.includes(file.type)) {
    try {
      dimensions = await getImageDimensions(file);
      
      if (dimensions.width > rules.maxWidth) {
        errors.push(
          `Image width too large (${dimensions.width}px). Maximum: ${rules.maxWidth}px`
        );
      }
      
      if (dimensions.height > rules.maxHeight) {
        errors.push(
          `Image height too large (${dimensions.height}px). Maximum: ${rules.maxHeight}px`
        );
      }
      
      if (rules.minWidth && dimensions.width < rules.minWidth) {
        errors.push(
          `Image width too small (${dimensions.width}px). Minimum: ${rules.minWidth}px`
        );
      }
      
      if (rules.minHeight && dimensions.height < rules.minHeight) {
        errors.push(
          `Image height too small (${dimensions.height}px). Minimum: ${rules.minHeight}px`
        );
      }
      
      // Add dimension recommendations
      if (dimensions.width > rules.maxWidth * 0.8 || dimensions.height > rules.maxHeight * 0.8) {
        warnings.push(
          `Large image dimensions (${dimensions.width}×${dimensions.height}px). Consider resizing for better performance.`
        );
      }
      
    } catch (error) {
      errors.push('Unable to read image dimensions. File may be corrupted.');
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