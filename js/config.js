// Single source of truth for business details, CTA copy, and tracking IDs.
// Update the values below before going live — nothing else in the codebase
// needs to change.

export const CONFIG = {
  business: {
    name: "First Battery Woodmead",
    phoneDisplay: "(010) 746 6260",
    phoneTel: "+27107466260",
    address: "Unit CA1, Woodmead Commercial Park, 17 Waterval Crescent, Woodmead, Johannesburg",
    hoursLine: "Same-day fitment available — open until 17:30",
    hoursFull: "Mon–Fri 08:00–17:30, Sat 08:00–14:00, Sun Closed",
  },

  // WhatsApp number both CTAs message, digits only, country code, no leading +
  whatsappNumber: "27826252141",

  // Flip this to "B" or "C" to test a different headline. Keep the copy
  // close to real search terms for Google Ads Quality Score.
  activeHeadline: "A",
  headlines: {
    A: {
      headline: "Need a new car battery? Get sorted in under a minute",
      subheadline: "Select your vehicle, chat with us on WhatsApp, we fit it the same day.",
    },
    B: {
      headline: "Same-day battery fitment in Woodmead",
      subheadline: "Tell us your vehicle on WhatsApp and we'll have a battery ready and fitted today.",
    },
    C: {
      headline: "Flat battery? Chat now, we'll sort it today",
      subheadline: "Pick your vehicle below and message us on WhatsApp for same-day fitment.",
    },
  },

  messages: {
    chat: (vehicleLabel) => `Hi, I need a battery for my ${vehicleLabel}`,
    callout: "Callout",
    notFound: "Hi, I need a battery but couldn't find my vehicle on the site",
  },

  maps: {
    // The business's existing Google Maps directions link.
    url: "https://share.google/csvciyYZ7nWOaoYmi",
  },

  // Google Analytics 4 measurement id, e.g. "G-XXXXXXXXXX". Leave blank to
  // disable analytics entirely.
  ga4MeasurementId: "",

  // Google Ads conversion. Both must be set for the conversion event to
  // fire — otherwise the WhatsApp click still fires a GA4 event fallback.
  googleAds: {
    conversionId: "", // e.g. "AW-000000000"
    conversionLabel: "", // e.g. "AbC-D_efG-h12-i34"
  },
};
