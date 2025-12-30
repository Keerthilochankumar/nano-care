export function estimateProcessingTime(fileSize: number, fileType: string): string {
  // Base processing time estimates (in seconds)
  const baseTimePerMB = {
    'application/pdf': 30, // PDFs take longer due to text extraction
    'application/msword': 20,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20,
    'text/plain': 5,
    'text/markdown': 5,
    'application/json': 8,
    'text/csv': 8,
    'application/rtf': 10,
  };

  const fileSizeMB = fileSize / (1024 * 1024);
  const timePerMB = baseTimePerMB[fileType as keyof typeof baseTimePerMB] || 10;
  const estimatedSeconds = Math.max(5, fileSizeMB * timePerMB);

  if (estimatedSeconds < 60) {
    return `~${Math.round(estimatedSeconds)} seconds`;
  } else if (estimatedSeconds < 300) {
    return `~${Math.round(estimatedSeconds / 60)} minutes`;
  } else {
    return `~${Math.round(estimatedSeconds / 60)} minutes (large file)`;
  }
}

export function getFileTypeIcon(fileType: string, filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (fileType) {
    case 'application/pdf':
      return '📄';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '📝';
    case 'text/csv':
      return '📊';
    case 'application/json':
      return '🔧';
    case 'text/markdown':
      return '📋';
    case 'application/rtf':
      return '📄';
    default:
      return '📄';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileSizeWarning(fileSize: number): string | null {
  const sizeMB = fileSize / (1024 * 1024);
  
  if (sizeMB > 8) {
    return 'Very large file - processing may take 5+ minutes';
  } else if (sizeMB > 5) {
    return 'Large file - processing may take 2-5 minutes';
  } else if (sizeMB > 2) {
    return 'Medium file - processing may take 1-2 minutes';
  }
  
  return null;
}