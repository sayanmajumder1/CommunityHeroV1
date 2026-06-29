/**
 * Safe access utilities to prevent runtime crashes
 */

export const safeArray = <T>(arr: any): T[] => {
  return Array.isArray(arr) ? arr : [];
};

export const safeString = (val: any, fallback: string = ''): string => {
  return typeof val === 'string' ? val : fallback;
};

export const safeNumber = (val: any, fallback: number = 0): number => {
  return typeof val === 'number' ? val : fallback;
};

export const safeObject = <T>(obj: any, fallback: T): T => {
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : fallback;
};

export const safeFormat = (timestamp: number | undefined): string => {
  try {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};
