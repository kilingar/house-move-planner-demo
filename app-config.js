const HOUSE_MAP_SECTION = {
  id: "house-map",
  name: "House Map",
  icon: "🧭",
  groups: [],
};

const TASK_DEFS = [
  {
    id: "painting",
    name: "Painting",
    icon: "🎨",
  },
  {
    id: "ikea-pax",
    name: "PAX",
    icon: "🧰",
  },
  {
    id: "furniture-making",
    name: "Furniture",
    icon: "🪚",
  },
  {
    id: "cloison",
    name: "Cloison",
    icon: "🧱",
  },
  {
    id: "flooring",
    name: "Flooring",
    icon: "🪵",
  },
  {
    id: "wall-panels",
    name: "Wall Panels",
    icon: "🪟",
  },
];

const TASK_SECTIONS = TASK_DEFS.map(function(task) {
  return {
    id: "task-" + task.id,
    name: task.name,
    icon: task.icon,
    kind: "task",
    taskId: task.id,
    groups: [],
  };
});

const PLANNING_SECTION_IDS = new Set([
  "timeline",
  "general-buy-list",
  "pre-sale-visit",
  "provisional-acceptance",
  "admin",
]);

const HIDDEN_FROM_AREA_NAV_IDS = new Set(["painting"]);

const TYPE_ORDER = ["plan", "buy", "do"];
const TYPE_LABEL = {
  plan: "Plan",
  buy: "To Buy",
  do: "To Do",
};

const BUY_GROUP_ORDER = [
  "Electricals",
  "Plumbing",
  "Paint",
  "IKEA",
  "Furniture Store",
  "Tools & Safety",
  "Textiles & Decor",
  "Appliances",
  "Baby & Kids",
  "Garden & Outdoor",
  "Office",
  "General",
];

const PROVISIONAL_ACCEPTANCE_SECTION_ID = "provisional-acceptance";
const PROVISIONAL_ACCEPTANCE_TASK_ID = "provisional-acceptance";
const GROUPED_FLAT_SECTION_IDS = new Set(["timeline", "pre-sale-visit", "provisional-acceptance"]);
const PLAN_SECTION_IDS = new Set(["admin", "pre-sale-visit", "provisional-acceptance"]);
const BUY_SECTION_IDS = new Set(["general-buy-list"]);

const CHECKLIST_STORAGE_KEY = "house-project-checklist-v1";
const CHECKLIST_VERSION = 3;
const REMOTE_SYNC_ENDPOINT = "/api/checklist";

function buildViewSections(sections) {
  const timelineSection = sections.find(function(section) {
    return section.id === "timeline";
  });

  const planningSections = [HOUSE_MAP_SECTION].concat(sections.filter(function(section) {
    return PLANNING_SECTION_IDS.has(section.id);
  }));

  const areaSections = sections.filter(function(section) {
    return !PLANNING_SECTION_IDS.has(section.id) && !HIDDEN_FROM_AREA_NAV_IDS.has(section.id);
  });

  const VIEW_SECTIONS = planningSections.concat(areaSections, TASK_SECTIONS);

  return {
    timelineSection,
    planningSections,
    areaSections,
    VIEW_SECTIONS,
  };
}

export {
  HOUSE_MAP_SECTION,
  TASK_DEFS,
  TASK_SECTIONS,
  PLANNING_SECTION_IDS,
  HIDDEN_FROM_AREA_NAV_IDS,
  TYPE_ORDER,
  TYPE_LABEL,
  BUY_GROUP_ORDER,
  PROVISIONAL_ACCEPTANCE_SECTION_ID,
  PROVISIONAL_ACCEPTANCE_TASK_ID,
  GROUPED_FLAT_SECTION_IDS,
  PLAN_SECTION_IDS,
  BUY_SECTION_IDS,
  CHECKLIST_STORAGE_KEY,
  CHECKLIST_VERSION,
  REMOTE_SYNC_ENDPOINT,
  buildViewSections,
};
