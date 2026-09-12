// Vercel Speed Insights initialization
// This file loads and initializes Vercel Speed Insights for performance tracking.
// The script only tracks data in production mode (not in development).

import { injectSpeedInsights } from '../node_modules/@vercel/speed-insights/dist/index.mjs';

// Initialize Speed Insights
// When deployed to Vercel, this will automatically track Web Vitals and
// other performance metrics. No additional configuration needed.
injectSpeedInsights({
  debug: false, // Set to true if you want to see debug logs during development
});
