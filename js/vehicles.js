// Loads data/vehicles.json — grouped by make, each make holding a list of
// { model, variant, years: [...] } — and expands it into a nested lookup
// for the cascading selector. Grouping by make (rather than one flat row
// per make/model/year) keeps the payload small: ~4,450 real vehicle
// variants gzip down to ~55KB this way, vs ~175KB as flat rows.

let catalogue = null; // Map<make, Map<model, Array<{variant, years: number[]}>>>
let makesCache = null;

async function load() {
  if (catalogue) return catalogue;

  const res = await fetch("data/vehicles.json");
  if (!res.ok) throw new Error(`Failed to load vehicles.json: ${res.status}`);
  const byMake = await res.json();

  catalogue = new Map();
  for (const [make, groups] of Object.entries(byMake)) {
    const models = new Map();
    catalogue.set(make, models);
    for (const group of groups) {
      if (!models.has(group.model)) models.set(group.model, []);
      models.get(group.model).push({
        variant: group.variant,
        years: [...group.years].sort((a, b) => a - b),
      });
    }
  }

  // Most recent variant group first within each model
  for (const models of catalogue.values()) {
    for (const groups of models.values()) {
      groups.sort((a, b) => b.years[b.years.length - 1] - a.years[a.years.length - 1]);
    }
  }

  return catalogue;
}

export async function getMakes() {
  await load();
  if (!makesCache) {
    makesCache = Array.from(catalogue.keys()).sort((a, b) => a.localeCompare(b));
  }
  return makesCache;
}

export async function getModels(make) {
  await load();
  const models = catalogue.get(make);
  if (!models) return [];
  return Array.from(models.keys()).sort((a, b) => a.localeCompare(b));
}

// Returns one entry per variant group for this model — each with its full
// years array (ascending, contiguous runs not yet collapsed). The caller
// collapses consecutive years into display ranges (e.g. "2010-2015").
export async function getYearVariants(make, model) {
  await load();
  const models = catalogue.get(make);
  if (!models) return [];
  return models.get(model) || [];
}
