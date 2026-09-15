/**
 * Product Configuration for Pi Network Payments
 * Contains product IDs used throughout the application
 */

export const PRODUCT_CONFIG = {
  PRODUCT_69cb411a9acc4c42897c1ae2: "vip_69cb411a9acc4c42897c1ae2",
} as const;

export type ProductConfigKey = keyof typeof PRODUCT_CONFIG;
