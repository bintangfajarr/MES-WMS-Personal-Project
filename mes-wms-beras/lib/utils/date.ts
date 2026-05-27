import { format, addMonths } from "date-fns";

/**
 * Format date to: dd MMM yyyy
 * Example: 01 Jan 2024
 */
export const formatDate = (date: Date | string) =>
  format(new Date(date), "dd MMM yyyy");

/**
 * Format date and time to: dd MMM yyyy HH:mm
 * Example: 01 Jan 2024 07:30
 */
export const formatDateTime = (date: Date | string) =>
  format(new Date(date), "dd MMM yyyy HH:mm");

/**
 * Calculate expiry date (6 months from production date)
 */
export const calculateExpiryDate = (productionDate: Date): Date =>
  addMonths(productionDate, 6);

/**
 * Format number with thousands separator
 * Example: 1000 → "1,000"
 */
export const formatNumber = (num: number): string =>
  num.toLocaleString("en-US");

/**
 * Format decimal number with 2 digits
 * Example: 12.5 → "12.50"
 */
export const formatDecimal = (num: number): string =>
  num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Format percentage
 * Example: 82.5 → "82.50%"
 */
export const formatPercentage = (num: number): string =>
  `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
