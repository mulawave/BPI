import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";

/**
 * Utility function to merge Tailwind CSS classes with conditional class values
 * Uses clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique transaction reference with collision resistance
 * Format: {prefix}-{timestamp}-{random}
 * Example: WD-1735123456789-AB3F
 * 
 * @param prefix - Short prefix to identify transaction type (e.g., 'WD', 'TXF', 'PKG')
 * @returns Unique reference string
 */
export function generateTxReference(prefix: string): string {
  const timestamp = Date.now();
  const random = randomBytes(2).toString('hex').toUpperCase(); // 4 character random hex
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate multiple unique references in a batch (guaranteed unique within batch)
 * Useful when creating multiple related transactions in quick succession
 * 
 * @param prefix - Transaction type prefix
 * @param count - Number of references to generate
 * @returns Array of unique references
 */
export function generateTxReferenceBatch(prefix: string, count: number): string[] {
  const baseTimestamp = Date.now();
  const references: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = baseTimestamp + i; // Increment timestamp slightly for each
    const random = randomBytes(2).toString('hex').toUpperCase();
    references.push(`${prefix}-${timestamp}-${random}`);
  }
  
  return references;
}
