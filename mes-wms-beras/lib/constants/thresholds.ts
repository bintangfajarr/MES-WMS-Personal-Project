export const THRESHOLDS = {
  // Moisture content
  MAX_MOISTURE_FOR_MILLING: 14,    // % max before milling
  MAX_MOISTURE_INCOMING: 22,       // % max to be accepted
  MAX_DRYER_TEMP: 43,              // °C max dryer temperature

  // Dirt / impurities
  MAX_DIRT_PERCENTAGE: 5,          // % max dirt to be accepted

  // Yield benchmarks
  MIN_HUSKING_YIELD: 75,           // % minimum husking yield
  TARGET_HUSKING_YIELD: 78,        // % target husking yield
  MIN_POLISHING_YIELD: 93,         // % minimum polishing yield
  TARGET_OVERALL_YIELD: 62,        // % target overall yield
  MIN_OVERALL_YIELD: 58,           // % alert if below this

  // Grading
  PREMIUM_MIN_WHOLE_GRAIN: 95,     // % whole grain for Premium
  MEDIUM_MIN_WHOLE_GRAIN: 80,      // % whole grain for Medium

  // Minimum stock (sacks)
  MIN_STOCK_PREMIUM: 100,
  MIN_STOCK_MEDIUM: 200,
  MIN_STOCK_PATAH: 100,
  MIN_PADDY_STOCK_KG: 5000,        // kg minimum paddy stock

  // Expiry
  EXPIRY_MONTHS: 6,                // months shelf life for rice
  EXPIRY_ALERT_DAYS: 30,           // days before expiry for alert

  // Operations
  MAX_PADDY_STORAGE_DAYS: 7,       // max days paddy in warehouse
  DO_CONFIRMATION_HOURS: 24,       // hours before DO unconfirmed alert
} as const;
