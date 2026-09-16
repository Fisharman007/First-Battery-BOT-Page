import { CONFIG } from "./config.js";
import { getMakes, getModels, getYearVariants } from "./vehicles.js";

const state = {
  make: "",
  model: "",
  year: null, // number | null
  variant: null, // { variant } | null
  utmTag: "",
};

// ---------- UTM capture ----------
// Persist across the session so a later anchor-jump (e.g. from a sitelink)
// still carries the tag that identified the ad.
(function captureUtm() {
  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("utm_campaign") || params.get("utm_source");
  if (campaign) {
    sessionStorage.setItem("fb_utm_tag", campaign);
  }
  state.utmTag = sessionStorage.getItem("fb_utm_tag") || "";
})();

// ---------- Tracking ----------
function initTracking() {
  if (!CONFIG.ga4MeasurementId) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ga4MeasurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", CONFIG.ga4MeasurementId);
}

function trackWhatsappClick(kind) {
  if (typeof window.gtag !== "function") return;

  const { conversionId, conversionLabel } = CONFIG.googleAds;
  if (conversionId && conversionLabel) {
    window.gtag("event", "conversion", {
      send_to: `${conversionId}/${conversionLabel}`,
    });
  } else {
    window.gtag("event", "whatsapp_click", { cta_type: kind });
  }
}

// ---------- WhatsApp link building ----------
function buildWhatsappUrl(message) {
  const tagged = state.utmTag ? `[Ad: ${state.utmTag}] ${message}` : message;
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(tagged)}`;
}

function vehicleLabel() {
  const parts = [state.make, state.model];
  if (state.year) parts.unshift(String(state.year));
  if (state.variant) parts.push(state.variant.variant);
  return parts.filter(Boolean).join(" ");
}

function calloutUrl() {
  return buildWhatsappUrl(CONFIG.messages.callout);
}

function chatUrl() {
  return buildWhatsappUrl(CONFIG.messages.chat(vehicleLabel()));
}

function notFoundUrl() {
  return buildWhatsappUrl(CONFIG.messages.notFound);
}

// ---------- Headline ----------
function renderHeadline() {
  const copy = CONFIG.headlines[CONFIG.activeHeadline] || CONFIG.headlines.A;
  document.getElementById("headline").textContent = copy.headline;
  document.getElementById("subheadline").textContent = copy.subheadline;
  document.getElementById("urgency-line").textContent = CONFIG.business.hoursLine;
}

// ---------- Footer / business details ----------
function renderBusinessDetails() {
  const mapsUrl = CONFIG.maps.url;
  document.querySelectorAll("[data-business-name]").forEach((el) => {
    el.textContent = CONFIG.business.name;
  });
  document.querySelectorAll("[data-business-address]").forEach((el) => {
    el.textContent = CONFIG.business.address;
  });
  document.querySelectorAll("[data-business-hours]").forEach((el) => {
    el.textContent = CONFIG.business.hoursFull;
  });
  document.querySelectorAll("[data-maps-link]").forEach((el) => {
    el.href = mapsUrl;
  });
  document.querySelectorAll("[data-phone-link]").forEach((el) => {
    el.href = `tel:${CONFIG.business.phoneTel}`;
    const label = el.querySelector("[data-phone-label]") || el;
    label.textContent = CONFIG.business.phoneDisplay;
  });
  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.href = buildWhatsappUrl(CONFIG.messages.callout);
    const label = el.querySelector("[data-whatsapp-label]") || el;
    label.textContent = CONFIG.whatsappDisplay;
  });
}

// ---------- CTA wiring ----------
function refreshCtaLinks() {
  const calloutHref = calloutUrl();
  document.querySelectorAll("[data-cta='callout']").forEach((el) => {
    el.href = calloutHref;
  });

  const ready = Boolean(state.make && state.model);
  const chatHref = ready ? chatUrl() : "#";
  document.querySelectorAll("[data-cta='chat']").forEach((el) => {
    el.href = chatHref;
    el.classList.toggle("is-ready", ready);
    el.setAttribute("aria-disabled", ready ? "false" : "true");
  });

  document.querySelectorAll("[data-cta-group]").forEach((el) => {
    el.classList.toggle("is-visible", ready);
  });

  document.getElementById("not-found-link").href = notFoundUrl();
}

function onWhatsappLinkClick(event) {
  const el = event.currentTarget;
  const kind = el.dataset.cta;
  if (kind === "chat" && el.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    return;
  }
  trackWhatsappClick(kind);
}

function wireCtaClicks() {
  document.querySelectorAll("[data-cta]").forEach((el) => {
    el.addEventListener("click", onWhatsappLinkClick);
  });
}

// ---------- Combobox (shared by Make and Model) ----------
// A searchable text input + filtered listbox. `getItems` is called on every
// keystroke, so callers with a dynamic source (e.g. Model, whose options
// depend on the selected Make) should keep it cheap — return a cached array
// rather than re-fetching.
function createCombobox({ wrapperId, inputId, listId, getItems, onSelect, onEdit }) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let activeIndex = -1;
  let filtered = [];

  function renderList() {
    list.innerHTML = "";
    filtered.forEach((item, i) => {
      const li = document.createElement("li");
      li.role = "option";
      li.id = `${listId}-option-${i}`;
      li.textContent = item;
      li.className = i === activeIndex ? "is-active" : "";
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        select(item);
      });
      list.appendChild(li);
    });
    list.hidden = filtered.length === 0;
    input.setAttribute("aria-expanded", String(!list.hidden));
    input.setAttribute(
      "aria-activedescendant",
      activeIndex >= 0 ? `${listId}-option-${activeIndex}` : ""
    );
  }

  function openList(query) {
    if (input.disabled) return;
    const items = getItems();
    const q = query.trim().toLowerCase();
    filtered = q ? items.filter((m) => m.toLowerCase().includes(q)) : items;
    activeIndex = -1;
    renderList();
  }

  function closeList() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function select(item) {
    input.value = item;
    closeList();
    onSelect(item);
  }

  input.addEventListener("input", () => {
    openList(input.value);
    if (onEdit) onEdit(input.value);
  });
  input.addEventListener("focus", () => openList(input.value));

  input.addEventListener("keydown", (e) => {
    if (list.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      openList(input.value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      renderList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      renderList();
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        select(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      closeList();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(`#${wrapperId}`)) closeList();
  });

  return {
    disable(placeholder) {
      input.value = "";
      input.disabled = true;
      input.placeholder = placeholder;
      closeList();
    },
    enable(placeholder) {
      input.disabled = false;
      input.value = "";
      input.placeholder = placeholder;
    },
  };
}

let modelCombobox = null;
let currentModels = []; // cached synchronously for the model combobox's filter
let currentGroups = []; // { variant, years } groups for the selected make/model

function resetModelAndVariant() {
  state.make = "";
  state.model = "";
  currentModels = [];

  if (modelCombobox) modelCombobox.disable("Select make first");
  resetYearAndVariant();

  refreshCtaLinks();
}

function resetYearAndVariant() {
  state.year = null;
  currentGroups = [];

  const yearSelect = document.getElementById("year-select");
  yearSelect.innerHTML = '<option value="">Select model first</option>';
  yearSelect.disabled = true;

  resetVariantSelect();
}

function resetVariantSelect() {
  state.variant = null;
  const variantSelect = document.getElementById("variant-select");
  variantSelect.innerHTML = '<option value="">Select year first</option>';
  variantSelect.disabled = true;
}

async function onMakeSelected(make) {
  state.make = make;
  state.model = "";

  currentModels = await getModels(make);
  if (modelCombobox) modelCombobox.enable("Start typing a model");
  resetYearAndVariant();

  refreshCtaLinks();
}

async function onModelSelected(model) {
  state.model = model;

  const yearSelect = document.getElementById("year-select");
  if (!model) {
    resetYearAndVariant();
    refreshCtaLinks();
    return;
  }

  currentGroups = await getYearVariants(state.make, model);
  const years = [...new Set(currentGroups.flatMap((g) => g.years))].sort((a, b) => b - a);

  yearSelect.innerHTML =
    '<option value="">Any year</option>' +
    years.map((y) => `<option value="${y}">${y}</option>`).join("");
  yearSelect.disabled = years.length === 0;

  resetVariantSelect();
  refreshCtaLinks();
}

function onYearSelected(value) {
  state.year = value ? Number(value) : null;

  if (!state.year) {
    resetVariantSelect();
    refreshCtaLinks();
    return;
  }

  const variants = [
    ...new Set(
      currentGroups.filter((g) => g.years.includes(state.year)).map((g) => g.variant)
    ),
  ];

  const variantSelect = document.getElementById("variant-select");
  variantSelect.innerHTML =
    '<option value="">Any variant</option>' +
    variants.map((v, i) => `<option value="${i}">${escapeHtml(v)}</option>`).join("");
  variantSelect.disabled = variants.length === 0;
  variantSelect.dataset.entries = JSON.stringify(variants);
  state.variant = null;

  refreshCtaLinks();
}

function onVariantSelected(index) {
  if (index === "") {
    state.variant = null;
  } else {
    const variantSelect = document.getElementById("variant-select");
    const entries = JSON.parse(variantSelect.dataset.entries || "[]");
    const variant = entries[Number(index)];
    state.variant = variant ? { variant } : null;
  }
  refreshCtaLinks();
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

// ---------- Sticky mobile CTA ----------
function initStickyCta() {
  const sticky = document.getElementById("sticky-cta");
  const finder = document.getElementById("battery-finder");
  if (!sticky || !finder) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      sticky.classList.toggle("is-visible", !entry.isIntersecting);
    },
    { rootMargin: "-1px 0px 0px 0px" }
  );
  observer.observe(finder);
}

// ---------- Boot ----------
async function main() {
  renderHeadline();
  renderBusinessDetails();
  wireCtaClicks();
  initStickyCta();
  initTracking();
  refreshCtaLinks();

  modelCombobox = createCombobox({
    wrapperId: "model-combobox",
    inputId: "model-input",
    listId: "model-listbox",
    getItems: () => currentModels,
    onSelect: (model) => onModelSelected(model),
    onEdit: (value) => {
      if (value !== state.model) {
        state.model = "";
        resetYearAndVariant();
        refreshCtaLinks();
      }
    },
  });

  document.getElementById("year-select").addEventListener("change", (e) => {
    onYearSelected(e.target.value);
  });

  document.getElementById("variant-select").addEventListener("change", (e) => {
    onVariantSelected(e.target.value);
  });

  try {
    const makes = await getMakes();
    createCombobox({
      wrapperId: "make-combobox",
      inputId: "make-input",
      listId: "make-listbox",
      getItems: () => makes,
      onSelect: (make) => onMakeSelected(make),
      onEdit: (value) => {
        if (value !== state.make) resetModelAndVariant();
      },
    });
  } catch (err) {
    console.error("Could not load vehicle catalogue:", err);
    const input = document.getElementById("make-input");
    input.placeholder = "Vehicle list unavailable — use Callout below";
    input.disabled = true;
  }
}

main();
