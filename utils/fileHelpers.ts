// Import the legacy API as recommended by Expo
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

/**
 * Reads a file and converts it to base64
 * @param uri The file URI to read
 * @returns Base64 string with data URI prefix
 */
export const readFileAsBase64 = async (uri: string, mimeType: string = 'application/pdf'): Promise<string> => {
  try {
    // Use the legacy API with proper encoding
    const base64String = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });

    // Return with data URI prefix
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error reading file as base64:', error);
    throw new Error('Unable to read file. Please try again.');
  }
};

/**
 * Converts a blob or file to base64
 * @param blob The blob or file to convert
 * @returns Promise with base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Gets file size in MB
 * @param sizeInBytes File size in bytes
 * @returns File size in MB
 */
export const getFileSizeInMB = (sizeInBytes: number): number => {
  return sizeInBytes / (1024 * 1024);
};

/**
 * Validates if file size is within limit
 * @param sizeInBytes File size in bytes
 * @param maxSizeInMB Maximum allowed size in MB
 * @returns Boolean indicating if file is within size limit
 */
export const isFileSizeValid = (sizeInBytes: number, maxSizeInMB: number = 5): boolean => {
  return getFileSizeInMB(sizeInBytes) <= maxSizeInMB;
};