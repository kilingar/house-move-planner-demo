// ============================================================
//  HOUSE PROJECT - App Logic
//  Checklist-based tracker with shared state across sections.
// ============================================================

import { SECTIONS } from "./data.js";

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

const timelineSection = SECTIONS.find(function(section) {
  return section.id === "timeline";
});
const planningSections = [HOUSE_MAP_SECTION].concat(SECTIONS.filter(function(section) {
  return PLANNING_SECTION_IDS.has(section.id);
}));
const areaSections = SECTIONS.filter(function(section) {
  return !PLANNING_SECTION_IDS.has(section.id) && !HIDDEN_FROM_AREA_NAV_IDS.has(section.id);
});
const VIEW_SECTIONS = planningSections.concat(areaSections, TASK_SECTIONS);
const TYPE_ORDER = ["plan", "buy", "do"];
const TYPE_LABEL = {
  plan: "Plan",
  buy: "To Buy",
  do: "To Do",
};
const PROVISIONAL_ACCEPTANCE_SECTION_ID = "provisional-acceptance";
const PROVISIONAL_ACCEPTANCE_TASK_ID = "provisional-acceptance";
const GROUPED_FLAT_SECTION_IDS = new Set(["timeline", "pre-sale-visit", "provisional-acceptance"]);
const PLAN_SECTION_IDS = new Set(["admin", "pre-sale-visit", "provisional-acceptance"]);
const BUY_SECTION_IDS = new Set(["general-buy-list"]);
const CHECKLIST_STORAGE_KEY = "house-project-checklist-v1";
const CHECKLIST_VERSION = 3;
const REMOTE_SYNC_ENDPOINT = "/api/checklist";

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeText(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function toDomToken(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeChecklistState(rawState) {
  const parsed = rawState && typeof rawState === "object" ? rawState : {};

  if (parsed.version !== CHECKLIST_VERSION || !parsed.room || typeof parsed.room !== "object") {
    return { version: CHECKLIST_VERSION, room: {}, legacy: {}, updatedAt: 0 };
  }

  return {
    version: CHECKLIST_VERSION,
    room: parsed.room,
    legacy: parsed.legacy && typeof parsed.legacy === "object" ? parsed.legacy : {},
    updatedAt: Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : 0,
  };
}

function loadChecklistState() {
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) {
      return normalizeChecklistState(null);
    }

    return normalizeChecklistState(JSON.parse(raw));
  } catch (error) {
    return normalizeChecklistState(null);
  }
}

let checklistState = loadChecklistState();
let remoteSyncTimerId = null;
let remoteSyncInFlight = false;
let remoteSyncPending = false;

function markChecklistUpdated() {
  checklistState.updatedAt = Date.now();
}

function saveChecklistState() {
  try {
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState));
  } catch (error) {
    // Ignore storage failures and keep the UI usable.
  }

  scheduleRemoteSync();
}

async function fetchRemoteChecklistState() {
  try {
    const response = await window.fetch(REMOTE_SYNC_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return normalizeChecklistState(payload && payload.state);
  } catch (error) {
    return null;
  }
}

async function pushRemoteChecklistState() {
  if (remoteSyncInFlight) {
    remoteSyncPending = true;
    return;
  }

  remoteSyncInFlight = true;

  try {
    await window.fetch(REMOTE_SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: checklistState }),
    });
  } catch (error) {
    // Keep local state if remote sync fails.
  } finally {
    remoteSyncInFlight = false;
    if (remoteSyncPending) {
      remoteSyncPending = false;
      pushRemoteChecklistState();
    }
  }
}

function scheduleRemoteSync() {
  if (remoteSyncTimerId !== null) {
    window.clearTimeout(remoteSyncTimerId);
  }

  remoteSyncTimerId = window.setTimeout(function() {
    remoteSyncTimerId = null;
    pushRemoteChecklistState();
  }, 400);
}

function isChecklistStateEmpty(state) {
  const room = state && state.room && typeof state.room === "object" ? state.room : {};
  const legacy = state && state.legacy && typeof state.legacy === "object" ? state.legacy : {};
  return Object.keys(room).length === 0 && Object.keys(legacy).length === 0;
}

async function hydrateChecklistStateFromRemote() {
  const remoteState = await fetchRemoteChecklistState();
  if (!remoteState) return;

  const localUpdated = Number.isFinite(checklistState.updatedAt) ? checklistState.updatedAt : 0;
  const remoteUpdated = Number.isFinite(remoteState.updatedAt) ? remoteState.updatedAt : 0;

  if (remoteUpdated > localUpdated) {
    checklistState = remoteState;
    try {
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState));
    } catch (error) {
      // Ignore storage failures and keep the UI usable.
    }
    renderNav();
    renderContent();
    return;
  }

  if (localUpdated > remoteUpdated) {
    scheduleRemoteSync();
    return;
  }

  const localIsEmpty = isChecklistStateEmpty(checklistState);
  const remoteIsEmpty = isChecklistStateEmpty(remoteState);

  if (!localIsEmpty && remoteIsEmpty) {
    scheduleRemoteSync();
    return;
  }

  if (localIsEmpty && !remoteIsEmpty) {
    checklistState = remoteState;
    try {
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState));
    } catch (error) {
      // Ignore storage failures and keep the UI usable.
    }
    renderNav();
    renderContent();
  }
}

function roomLabelById(roomId) {
  const section = SECTIONS.find(function(entry) {
    return entry.id === roomId;
  });
  return section ? section.name : roomId;
}

function isItemCompleteForRoom(key, roomId) {
  const roomState = checklistState.room && checklistState.room[roomId];
  return Boolean(roomState && roomState[key]);
}

function setItemCompleteForRoom(key, roomId, complete) {
  if (!checklistState.room[roomId]) {
    checklistState.room[roomId] = {};
  }

  if (complete) {
    checklistState.room[roomId][key] = true;
  } else {
    delete checklistState.room[roomId][key];
    if (Object.keys(checklistState.room[roomId]).length === 0) {
      delete checklistState.room[roomId];
    }
  }

  markChecklistUpdated();
  saveChecklistState();
}

function getItemCompletion(item) {
  const roomIds = item.scopeRoomIds && item.scopeRoomIds.length
    ? item.scopeRoomIds
    : ["global"];

  const completedCount = roomIds.reduce(function(count, roomId) {
    if (roomId === "global") {
      return count + (checklistState.legacy && checklistState.legacy[item.key] ? 1 : 0);
    }
    return count + (isItemCompleteForRoom(item.key, roomId) ? 1 : 0);
  }, 0);

  return {
    total: roomIds.length,
    completed: completedCount,
    allDone: completedCount === roomIds.length,
    partial: completedCount > 0 && completedCount < roomIds.length,
    pendingRoomIds: roomIds.filter(function(roomId) {
      return roomId !== "global" && !isItemCompleteForRoom(item.key, roomId);
    }),
  };
}

function buildNativeItemKey(sectionId, groupTitle, itemText) {
  return ["native", sectionId, normalizeText(groupTitle), normalizeText(itemText)].join("::");
}

function buildItemGraph(sections) {
  const items = [];

  for (const section of sections) {
    for (const raw of section.items || []) {
      const extraRooms = (raw.rooms || []).filter(function(r) { return r !== section.id; });
      const rooms = [section.id].concat(extraRooms);
      items.push({
        key: raw.id,
        type: raw.type,
        text: raw.text,
        group: raw.group || null,
        tasks: raw.tasks || [],
        rooms: rooms,
        roomNames: rooms.map(roomLabelById),
      });
    }
  }

  return items;
}

const ITEM_GRAPH = buildItemGraph(SECTIONS);

function taskById(taskId) {
  return TASK_DEFS.find(function(task) {
    return task.id === taskId;
  });
}

function canTaskApplyToArea(task, areaId) {
  if (!task.areaIds || !task.areaIds.length) return true;
  return task.areaIds.includes(areaId);
}

function availableTasksForArea(section) {
  return TASK_DEFS.filter(function(task) {
    if (!canTaskApplyToArea(task, section.id)) return false;
    return ITEM_GRAPH.some(function(item) {
      return item.tasks.includes(task.id) && item.rooms.includes(section.id);
    });
  });
}

function availableAreasForTask(task) {
  return areaSections.filter(function(area) {
    return canTaskApplyToArea(task, area.id) && ITEM_GRAPH.some(function(item) {
      return item.tasks.includes(task.id) && item.rooms.includes(area.id);
    });
  });
}

function getLinkedRoomNames(item, currentSectionId) {
  if (currentSectionId === HOUSE_MAP_SECTION.id) {
    return item.roomNames;
  }

  const currentSection = VIEW_SECTIONS.find(function(section) {
    return section.id === currentSectionId;
  });

  return item.roomNames.filter(function(name) {
    return !currentSection || name !== currentSection.name;
  });
}

function buildRenderableItem(key, text, linkedRoomNames, options) {
  const opts = options || {};

  return {
    key,
    text,
    linkedRoomNames: linkedRoomNames || [],
    scopeRoomIds: opts.scopeRoomIds || [],
    scopeRoomNames: opts.scopeRoomNames || [],
  };
}

function getNativeGroups(section) {
  return (section.groups || []).map(function(group) {
    return {
      title: group.title,
      items: (group.items || []).map(function(itemText) {
        return buildRenderableItem(
          buildNativeItemKey(section.id, group.title, itemText),
          itemText,
          [],
          {
            scopeRoomIds: [section.id],
            scopeRoomNames: [section.name],
          }
        );
      }),
    };
  }).filter(function(group) {
    return group.items.length > 0;
  });
}

function getTypedGroups(section) {
  const activeTask = activeAreaTaskFilter ? taskById(activeAreaTaskFilter) : null;
  return TYPE_ORDER.map(function(type) {
    const filtered = ITEM_GRAPH.filter(function(item) {
      if (item.type !== type) return false;
      if (!item.rooms.includes(section.id)) return false;
      if (activeTask && !item.tasks.includes(activeTask.id)) return false;
      return true;
    });
    return {
      title: TYPE_LABEL[type],
      items: filtered.map(function(item) {
        return buildRenderableItem(item.key, item.text, getLinkedRoomNames(item, section.id), {
          scopeRoomIds: [section.id],
          scopeRoomNames: [section.name],
        });
      }),
    };
  }).filter(function(group) {
    return group.items.length > 0;
  });
}

function getGroupedFlatSectionGroups(section) {
  const activeTask = activeAreaTaskFilter ? taskById(activeAreaTaskFilter) : null;
  const groupedItems = ITEM_GRAPH.filter(function(item) {
    const isCrossListedProvisionalItem =
      section.id === PROVISIONAL_ACCEPTANCE_SECTION_ID && item.tasks.includes(PROVISIONAL_ACCEPTANCE_TASK_ID);

    if (!item.rooms.includes(section.id) && !isCrossListedProvisionalItem) return false;
    if (activeTask && !item.tasks.includes(activeTask.id)) return false;
    return true;
  });

  const orderedTitles = [];
  const buckets = new Map();

  groupedItems.forEach(function(item) {
    const sourceRoomId = section.id === PROVISIONAL_ACCEPTANCE_SECTION_ID
      ? item.rooms.find(function(roomId) {
          return roomId !== PROVISIONAL_ACCEPTANCE_SECTION_ID;
        })
      : null;
    const title = item.group || (sourceRoomId ? roomLabelById(sourceRoomId) : null) || TYPE_LABEL[item.type] || "Items";
    if (!buckets.has(title)) {
      buckets.set(title, []);
      orderedTitles.push(title);
    }

    buckets.get(title).push(buildRenderableItem(item.key, item.text, getLinkedRoomNames(item, section.id), {
      scopeRoomIds: [section.id],
      scopeRoomNames: [section.name],
    }));
  });

  return orderedTitles.map(function(title) {
    return {
      title: title,
      items: buckets.get(title),
    };
  }).filter(function(group) {
    return group.items.length > 0;
  });
}

function getSectionGroups(section) {
  if (section.kind === "task") {
    const task = taskById(section.taskId);
    if (!task) return [];

    const matchingItems = ITEM_GRAPH.filter(function(item) {
      if (!item.tasks.includes(task.id)) return false;
      if (taskScopeAreaId && !item.rooms.includes(taskScopeAreaId)) return false;
      return true;
    });

    return TYPE_ORDER.map(function(type) {
      const typeItems = matchingItems.filter(function(item) { return item.type === type; });
      return {
        title: TYPE_LABEL[type],
        items: typeItems.map(function(item) {
          const scopeIds = taskScopeAreaId
            ? item.rooms.filter(function(r) { return r === taskScopeAreaId; })
            : item.rooms;
          const finalScope = scopeIds.length ? scopeIds : item.rooms;
          const linkedNames = item.roomNames.filter(function(name) {
            return !finalScope.map(roomLabelById).includes(name);
          });
          return buildRenderableItem(item.key, item.text, linkedNames, {
            scopeRoomIds: finalScope,
            scopeRoomNames: finalScope.map(roomLabelById),
          });
        }),
      };
    }).filter(function(g) { return g.items.length > 0; });
  }

  if (section.id === HOUSE_MAP_SECTION.id) {
    return TYPE_ORDER.map(function(type) {
      return {
        title: TYPE_LABEL[type],
        items: ITEM_GRAPH.filter(function(item) {
          return item.type === type;
        }).map(function(item) {
          return buildRenderableItem(item.key, item.text, getLinkedRoomNames(item, section.id), {
            scopeRoomIds: item.rooms,
            scopeRoomNames: item.roomNames,
          });
        }),
      };
    }).filter(function(group) {
      return group.items.length > 0;
    });
  }

  if (section.id === "general-buy-list") {
    return [
      {
        title: "To Buy",
        items: ITEM_GRAPH.filter(function(item) {
          return item.type === "buy";
        }).map(function(item) {
          return buildRenderableItem(item.key, item.text, getLinkedRoomNames(item, section.id), {
            scopeRoomIds: item.rooms,
            scopeRoomNames: item.roomNames,
          });
        }),
      },
    ];
  }

  if (GROUPED_FLAT_SECTION_IDS.has(section.id)) {
    return getGroupedFlatSectionGroups(section);
  }

  const typedGroups = getTypedGroups(section);
  return typedGroups.length > 0 ? typedGroups : getNativeGroups(section);
}

function getGroupStats(groups) {
  const total = groups.reduce(function(sum, group) {
    return sum + group.items.length;
  }, 0);
  const completed = groups.reduce(function(sum, group) {
    return sum + group.items.filter(function(item) {
      return getItemCompletion(item).allDone;
    }).length;
  }, 0);

  return { total, completed };
}

function getSectionProgress(section) {
  return getGroupStats(getSectionGroups(section));
}

function labelForSummary(type) {
  if (type === "plan") return "Plan";
  if (type === "buy") return "Buy";
  return "Do";
}

function buildTypedSummary(groups) {
  return TYPE_ORDER.map(function(type) {
    const count = groups.reduce(function(sum, group) {
      if (group.title !== TYPE_LABEL[type]) return sum;
      return sum + group.items.length;
    }, 0);

    return count + " " + labelForSummary(type);
  }).join(" · ");
}

function renderProgress(completed, total) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    '<div class="progress-wrap">' +
      '<div class="progress-bar" aria-hidden="true">' +
        '<div class="progress-fill" style="width:' + percent + '%"></div>' +
      '</div>' +
      '<div class="progress-text">' + completed + '/' + total + ' done</div>' +
    '</div>'
  );
}

function renderItemRow(item) {
  const completion = getItemCompletion(item);
  const checked = completion.allDone;
  const itemId = "item-" + toDomToken(item.key + "--" + (item.scopeRoomIds || []).join("-"));
  const chips = (item.linkedRoomNames || []).map(function(name) {
    return '<span class="room-chip">' + esc(name) + '</span>';
  }).join("");
  const pendingChips = completion.pendingRoomIds.map(function(roomId) {
    return '<span class="room-chip room-chip-pending">' + esc(roomLabelById(roomId)) + '</span>';
  }).join("");
  const linkedHtml = chips
    ? '<div class="item-meta"><span class="meta-label">Linked rooms:</span>' + chips + '</div>'
    : "";
  const pendingHtml = pendingChips
    ? '<div class="item-meta"><span class="meta-label">Pending:</span>' + pendingChips + '</div>'
    : "";

  return (
    '<li class="item' + (checked ? ' checked' : '') + (completion.partial ? ' partial' : '') + '">' +
      '<label for="' + esc(itemId) + '">' +
        '<input class="item-toggle" id="' + esc(itemId) + '" type="checkbox" data-key="' + esc(item.key) + '" data-scope="' + esc((item.scopeRoomIds || []).join(",")) + '" data-partial="' + (completion.partial ? '1' : '0') + '"' + (checked ? ' checked' : '') + ' />' +
        '<span class="checkmark" aria-hidden="true">' +
          '<svg viewBox="0 0 16 16"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"></path></svg>' +
        '</span>' +
        '<span class="item-text">' + esc(item.text) + '</span>' +
      '</label>' +
      linkedHtml + pendingHtml +
    '</li>'
  );
}

function renderGroupBlock(title, items) {
  if (!items || !items.length) return "";

  return (
    '<div class="group">' +
      '<h3 class="group-title">' + esc(title) + '</h3>' +
      '<ul class="item-list">' + items.map(renderItemRow).join("") + '</ul>' +
    '</div>'
  );
}

function buildSummary(section, groups, stats) {
  if (section.kind === "task") {
    const scopeName = taskScopeAreaId
      ? (areaSections.find(function(area) { return area.id === taskScopeAreaId; }) || {}).name
      : "All areas";
    return scopeName + " · " + buildTypedSummary(groups) + " · " + stats.completed + "/" + stats.total + " done";
  }

  if (section.id === "timeline") {
    return stats.total + " timeline steps · " + stats.completed + "/" + stats.total + " done";
  }

  if (section.id === "pre-sale-visit") {
    return groups.length + " visit areas · " + stats.completed + "/" + stats.total + " done";
  }

  if (section.id === "provisional-acceptance") {
    return groups.length + " room checklists · " + stats.completed + "/" + stats.total + " done";
  }

  if (section.id === HOUSE_MAP_SECTION.id) {
    return buildTypedSummary(groups) + " · " + stats.completed + "/" + stats.total + " done";
  }

  if (section.id === "general-buy-list") {
    return stats.total + " buy items across all sections · " + stats.completed + "/" + stats.total + " done";
  }

  const hasTypedGroups = groups.some(function(group) {
    return Object.values(TYPE_LABEL).includes(group.title);
  });

  if (hasTypedGroups) {
    return buildTypedSummary(groups) + " · " + stats.completed + "/" + stats.total + " done";
  }

  return stats.total + " items · " + stats.completed + "/" + stats.total + " done";
}

let activeId = timelineSection ? timelineSection.id : VIEW_SECTIONS[0].id;
let taskScopeAreaId = null;
let activeAreaTaskFilter = null;

function renderNav() {
  const nav = document.getElementById("nav");

  function renderNavGroup(label, sections) {
    if (!sections.length) return "";

    return '<p class="nav-section-label">' + esc(label) + '</p>' + sections.map(function(section) {
      const progress = getSectionProgress(section);
      const active = section.id === activeId ? " active" : "";

      return (
        '<button class="nav-item' + active + '" data-id="' + esc(section.id) + '" aria-label="' + esc(section.name) + '">' +
          '<span class="nav-icon" aria-hidden="true">' + section.icon + '</span>' +
          '<span class="nav-label">' + esc(section.name) + '</span>' +
          '<span class="nav-badge">' + progress.completed + '/' + progress.total + '</span>' +
        '</button>'
      );
    }).join('');
  }

  nav.innerHTML =
    renderNavGroup("Planning", planningSections) +
    renderNavGroup("Areas", areaSections) +
    renderNavGroup("Tasks", TASK_SECTIONS);

  nav.querySelectorAll(".nav-item").forEach(function(button) {
    button.addEventListener("click", function() {
      selectSection(button.dataset.id);
    });
  });
}

function renderContent() {
  const section = VIEW_SECTIONS.find(function(entry) {
    return entry.id === activeId;
  });
  if (!section) return;

  const groups = getSectionGroups(section);
  const stats = getGroupStats(groups);
  let filterPanel = "";
  if (section.kind === "task") {
    const task = taskById(section.taskId);
    if (task) {
      const applicableAreas = availableAreasForTask(task);
      if (applicableAreas.length > 0) {
        const allActive = !taskScopeAreaId ? ' area-filter-chip--active' : '';
        const allChip = '<button class="area-filter-chip' + allActive + '" data-area-filter-id="">All Areas</button>';
        const areaChips = applicableAreas.map(function(a) {
          const active = taskScopeAreaId === a.id ? ' area-filter-chip--active' : '';
          return '<button class="area-filter-chip' + active + '" data-area-filter-id="' + esc(a.id) + '">' + esc(a.name) + '</button>';
        }).join('');
        filterPanel =
          '<div class="task-panel">' +
            '<div class="task-panel-title">Filter by Area</div>' +
            '<div class="task-panel-row">' + allChip + areaChips + '</div>' +
          '</div>';
      }
    }
  } else if (!section.kind && !PLANNING_SECTION_IDS.has(section.id) && section.id !== HOUSE_MAP_SECTION.id) {
    const tasks = availableTasksForArea(section);
    if (tasks.length) {
      filterPanel =
        '<div class="task-panel">' +
          '<div class="task-panel-title">Filter by Task</div>' +
          '<div class="task-panel-row">' +
            tasks.map(function(task) {
              const active = activeAreaTaskFilter === task.id ? ' task-chip--active' : '';
              return '<button class="task-chip' + active + '" data-task-filter-id="' + esc(task.id) + '">' + esc(task.name) + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
    }
  }

  document.getElementById("pageTitle").textContent = section.name;
  document.getElementById("content").innerHTML =
    '<div class="section-header">' +
      '<div class="section-title">' +
        '<span class="section-icon" aria-hidden="true">' + section.icon + '</span>' +
        '<h2>' + esc(section.name) + '</h2>' +
      '</div>' +
      '<div class="summary-line">' + esc(buildSummary(section, groups, stats)) + '</div>' +
      filterPanel +
      renderProgress(stats.completed, stats.total) +
    '</div>' +
    groups.map(function(group) {
      return renderGroupBlock(group.title, group.items);
    }).join('');

  document.getElementById("content").querySelectorAll(".item-toggle").forEach(function(input) {
    if (!(input instanceof HTMLInputElement)) return;
    input.indeterminate = input.dataset.partial === "1";
  });
}

function selectSection(id) {
  taskScopeAreaId = null;
  activeAreaTaskFilter = null;
  activeId = id;
  renderNav();
  renderContent();
  closeSidebar();
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

document.getElementById("menuBtn").addEventListener("click", openSidebar);
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
document.getElementById("overlay").addEventListener("click", closeSidebar);
document.getElementById("content").addEventListener("click", function(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const areaFilterChip = target.closest(".area-filter-chip");
  if (areaFilterChip) {
    taskScopeAreaId = areaFilterChip.dataset.areaFilterId || null;
    renderNav();
    renderContent();
    return;
  }

  const taskChip = target.closest(".task-chip");
  if (taskChip) {
    const newFilter = taskChip.dataset.taskFilterId;
    activeAreaTaskFilter = activeAreaTaskFilter === newFilter ? null : newFilter;
    renderNav();
    renderContent();
    return;
  }
});
document.getElementById("content").addEventListener("change", function(event) {
  const target = event.target;

  if (!(target instanceof HTMLInputElement) || !target.classList.contains("item-toggle")) {
    return;
  }

  const scope = (target.dataset.scope || "").split(",").filter(Boolean);
  const roomIds = scope.length ? scope : ["global"];

  roomIds.forEach(function(roomId) {
    if (roomId === "global") {
      if (!checklistState.legacy || typeof checklistState.legacy !== "object") {
        checklistState.legacy = {};
      }
      if (target.checked) {
        checklistState.legacy[target.dataset.key] = true;
      } else {
        delete checklistState.legacy[target.dataset.key];
      }
      markChecklistUpdated();
      saveChecklistState();
      return;
    }

    setItemCompleteForRoom(target.dataset.key, roomId, target.checked);
  });

  renderNav();
  renderContent();
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") closeSidebar();
});

renderNav();
renderContent();
hydrateChecklistStateFromRemote();
