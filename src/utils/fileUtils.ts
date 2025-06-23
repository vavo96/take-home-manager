import { File as FileIcon, Image as ImageIcon } from "lucide-react";
import { ACCEPTED_TYPES, ALLOWED_EXTENSIONS, MAX_SIZE } from "@/constants";
import { FileType } from "@/types";

// File validation utility
export const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() || '')) {
      return { valid: false, error: "File type not supported" };
    }
  
    if (file.size > MAX_SIZE) {
      const sizeMB = Math.round(MAX_SIZE / (1024 * 1024));
      return { valid: false, error: `File size exceeds ${sizeMB}MB limit` };
    }
  
    return { valid: true };
  };
  
export const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    files.forEach((file, index) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });
  
    return { valid: errors.length === 0, errors };
};

export const getFileType = (file: File): FileType => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return 'image';
    }
    
    return 'image';
};
  
export const getFileIcon = (file: File) => {
    const fileType = getFileType(file);
    return fileType === 'pdf' ? FileIcon : ImageIcon;
};
  
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
  