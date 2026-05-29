const STORAGE_KEY = "moon-bra-fit-helper-records-v1";
const APP_VERSION = "1.0.0";

const cupLabels = ["AA", "A", "B", "C", "D", "E", "F", "G", "H"];

const fields = [
  "date",
  "weight",
  "tightUnderbust",
  "snugUnderbust",
  "looseUnderbust",
  "standingBust",
  "leaningBust",
  "lyingBust",
  "leftHalfArc",
  "rightHalfArc",
  "hrtNote",
  "currentBra",
  "fitNotes",
  "moodNote",
];

const issueOptions = [
  { id: "cupEdgeGaps", label: "杯口空" },
  { id: "sideCompression", label: "侧边压组织" },
  { id: "goreNotTacking", label: "鸡心不贴" },
  { id: "bandRidesUp", label: "下围上滑" },
  { id: "strapsCarryWeight", label: "肩带承担过多重量" },
  { id: "wireTooNarrow", label: "钢圈偏窄" },
  { id: "cupTooDeep", label: "杯型偏深" },
  { id: "cupCutsIn", label: "杯口压入组织" },
  { id: "oneSideDifferent", label: "左右贴合不同" },
];

const els = {};
let latestDraft = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  setDefaultDate();
  renderIssueChecklist();
  bindEvents();
  renderRecords();
  registerServiceWorker();
});

function cacheElements() {
  fields.forEach((field) => {
    els[field] = document.getElementById(field);
  });

  els.form = document.getElementById("measurement-form");
  els.formMessage = document.getElementById("form-message");
  els.saveMessage = document.getElementById("save-message");
  els.recordsMessage = document.getElementById("records-message");
  els.dateButtonText = document.getElementById("date-button-text");
  els.emptyResult = document.getElementById("empty-result");
  els.resultContent = document.getElementById("result-content");
  els.rangeChips = document.getElementById("range-chips");
  els.startingPoints = document.getElementById("starting-points");
  els.sisterSizes = document.getElementById("sister-sizes");
  els.styleDirection = document.getElementById("style-direction");
  els.arcHints = document.getElementById("arc-hints");
  els.asymmetryPanel = document.getElementById("asymmetry-panel");
  els.asymmetryNote = document.getElementById("asymmetry-note");
  els.tryonObservations = document.getElementById("tryon-observations");
  els.uncertaintyNotes = document.getElementById("uncertainty-notes");
  els.issueChecklist = document.getElementById("issue-checklist");
  els.issueSuggestions = document.getElementById("issue-suggestions");
  els.recordsList = document.getElementById("records-list");
}

function setDefaultDate() {
  if (!els.date.value) {
    els.date.value = localDateString();
  }
  updateDateButtonText();
}

function bindEvents() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewTarget));
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const measurement = collectMeasurement();
    const validation = validateMeasurement(measurement);

    if (!validation.ok) {
      showMessage(els.formMessage, validation.message, true);
      switchView("measure");
      return;
    }

    latestDraft = buildRecordDraft(measurement);
    renderResult(latestDraft);
    showMessage(els.formMessage, "已生成试穿起点。你可以继续调整数据，或到结果页查看。");
    switchView("results");
  });

  document.getElementById("reset-form").addEventListener("click", () => {
    els.form.reset();
    latestDraft = null;
    setDefaultDate();
    renderEmptyResult();
    showMessage(els.formMessage, "表单已清空。");
  });

  document.getElementById("save-record").addEventListener("click", saveLatestRecord);
  document.getElementById("export-json-result").addEventListener("click", () => exportCurrent("json"));
  document.getElementById("export-csv-result").addEventListener("click", () => exportCurrent("csv"));
  document.getElementById("export-json-all").addEventListener("click", () => exportAll("json"));
  document.getElementById("export-csv-all").addEventListener("click", () => exportAll("csv"));
  document.getElementById("import-json").addEventListener("change", importJsonFile);
  els.date.addEventListener("change", updateDateButtonText);
}

function switchView(viewName) {
  document.querySelectorAll("[data-view]").forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function collectMeasurement() {
  const data = {};

  fields.forEach((field) => {
    const element = els[field];
    if (element.type === "checkbox") {
      data[field] = element.checked;
    } else if (element.type === "number") {
      data[field] = parseNumber(element.value);
    } else {
      data[field] = element.value.trim();
    }
  });

  return data;
}

function validateMeasurement(data) {
  const required = [
    "date",
    "tightUnderbust",
    "snugUnderbust",
    "looseUnderbust",
    "standingBust",
    "leaningBust",
    "lyingBust",
  ];

  for (const field of required) {
    if (data[field] === "" || data[field] === null || Number.isNaN(data[field])) {
      return { ok: false, message: "请先补齐必填测量项。" };
    }
  }

  if (!(data.tightUnderbust <= data.snugUnderbust && data.snugUnderbust <= data.looseUnderbust)) {
    return {
      ok: false,
      message: "下胸围通常应为：紧下胸围 ≤ 舒适下胸围 ≤ 宽松下胸围。请检查是否填反。",
    };
  }

  const busts = [data.standingBust, data.leaningBust, data.lyingBust];
  if (busts.some((value) => value < data.tightUnderbust - 5)) {
    return {
      ok: false,
      message: "上胸围数据看起来低于下胸围较多。请确认单位为 cm，或检查是否填错位置。",
    };
  }

  const arcs = [data.leftHalfArc, data.rightHalfArc].filter((value) => value !== null);
  if (arcs.some((value) => value < 4)) {
    return {
      ok: false,
      message: "横向半周长可以留空；如果填写，请确认数值单位为 cm。",
    };
  }

  return { ok: true };
}

function buildRecordDraft(measurement) {
  const result = calculateFit(measurement);
  const selectedIssues = getSelectedIssues();

  return {
    id: makeId(),
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    measurement,
    result,
    fitIssues: selectedIssues,
    fitIssueSuggestions: buildIssueSuggestions(selectedIssues),
  };
}

function calculateFit(data) {
  const bandAnchor = round1(data.snugUnderbust);
  const estimatedBust = round1(data.standingBust * 0.45 + data.leaningBust * 0.35 + data.lyingBust * 0.2);
  const cupDifference = round1(Math.max(0, estimatedBust - bandAnchor));
  const bandRange = estimateBandRange(data);
  const primaryCupIndex = cupIndexFromDifference(cupDifference);
  const startingPointGroups = buildStartingPointGroups(bandRange, primaryCupIndex);
  const sisterSizes = buildSisterSizes(bandRange.primary, primaryCupIndex);
  const arc = interpretHalfArc(data, cupDifference, bandAnchor);
  const styleSuggestions = buildStyleSuggestions(arc, cupDifference);
  const confidence = estimateConfidence(data, arc);

  return {
    bandAnchor,
    estimatedBust,
    cupDifference,
    bandRange,
    primaryCupLabel: cupLabels[primaryCupIndex],
    priorityStartingPoints: startingPointGroups.priority,
    expandedStartingPoints: startingPointGroups.expanded,
    fittingRange: [...startingPointGroups.priority, ...startingPointGroups.expanded],
    allSuggestedSizes: [...startingPointGroups.priority, ...startingPointGroups.expanded],
    sisterSizes,
    confidence,
    arc,
    styleSuggestions,
    observations: buildTryOnObservations(),
    uncertainty: buildUncertaintyNotes(data, estimatedBust, cupDifference, confidence),
  };
}

function estimateBandRange(data) {
  const primary = clamp(roundToNearestFive(data.snugUnderbust), 55, 125);
  const candidates = new Set([primary]);
  const comfortSpread = data.looseUnderbust - data.tightUnderbust;

  if (data.looseUnderbust - data.snugUnderbust >= 2.8) {
    candidates.add(primary + 5);
  }
  if (data.snugUnderbust - data.tightUnderbust >= 2.8) {
    candidates.add(primary - 5);
  }
  if (comfortSpread >= 8) {
    candidates.add(primary + 5);
    candidates.add(primary - 5);
  }

  const range = [...candidates]
    .filter((value) => value >= 55 && value <= 125)
    .sort((a, b) => a - b);

  return {
    primary,
    range,
    note: `舒适下胸围 ${round1(data.snugUnderbust)} cm 作为主锚点；紧下胸围和宽松下胸围用于判断松紧容忍度。`,
    observationRules: [
      "如果较大下围上滑，可以试小一档下围。",
      "如果较小下围压迫明显，可以试大一档下围。",
      "下围稳定性优先于杯码标签。",
    ],
  };
}

function buildStartingPointGroups(bandRange, primaryCupIndex) {
  const primaryBand = bandRange.primary;
  const priorityCupIndexes = new Set([primaryCupIndex]);
  if (primaryCupIndex < cupLabels.length - 1) {
    priorityCupIndexes.add(primaryCupIndex + 1);
  }
  if (primaryCupIndex > 0) {
    priorityCupIndexes.add(primaryCupIndex - 1);
  }

  const priority = [...priorityCupIndexes]
    .sort((a, b) => a - b)
    .map((cupIndex) => `${primaryBand}${cupLabels[cupIndex]}`);

  const sizes = [];
  const cupCandidates = new Set([primaryCupIndex]);

  if (primaryCupIndex < cupLabels.length - 1) {
    cupCandidates.add(primaryCupIndex + 1);
  }
  if (primaryCupIndex > 0) {
    cupCandidates.add(primaryCupIndex - 1);
  }

  bandRange.range.forEach((band) => {
    [...cupCandidates].sort((a, b) => a - b).forEach((cupIndex) => {
      sizes.push(`${band}${cupLabels[cupIndex]}`);
    });
  });

  buildSisterSizes(bandRange.primary, primaryCupIndex).forEach((size) => sizes.push(size));
  const expanded = unique(sizes)
    .filter((size) => !priority.includes(size))
    .slice(0, 5);

  return { priority, expanded };
}

function buildSisterSizes(primaryBand, primaryCupIndex) {
  const sizes = [];
  if (primaryBand > 55 && primaryCupIndex < cupLabels.length - 1) {
    sizes.push(`${primaryBand - 5}${cupLabels[primaryCupIndex + 1]}`);
  }
  if (primaryBand < 125 && primaryCupIndex > 0) {
    sizes.push(`${primaryBand + 5}${cupLabels[primaryCupIndex - 1]}`);
  }
  if (primaryBand < 125) {
    sizes.push(`${primaryBand + 5}${cupLabels[primaryCupIndex]}`);
  }
  return unique(sizes);
}

function cupIndexFromDifference(diff) {
  if (diff < 8.5) return 0;
  if (diff < 11) return 1;
  if (diff < 13.5) return 2;
  if (diff < 16) return 3;
  if (diff < 18.5) return 4;
  if (diff < 21) return 5;
  if (diff < 23.5) return 6;
  if (diff < 26) return 7;
  return 8;
}

function interpretHalfArc(data, cupDifference, bandAnchor) {
  const hasLeft = data.leftHalfArc !== null;
  const hasRight = data.rightHalfArc !== null;

  if (!hasLeft && !hasRight) {
    return {
      status: "missing",
      hints: [
        "未填写横向半周长，因此底盘宽度、投射方向和左右差异提示会更保守。",
        "可以先从柔软、弹性、可调节的款式开始试穿，再用试穿感受修正范围。",
      ],
      asymmetry: null,
      tendencies: ["flexibleStart"],
    };
  }

  if (hasLeft !== hasRight) {
    const value = hasLeft ? data.leftHalfArc : data.rightHalfArc;
    return {
      status: "partial",
      averageHalfArc: round1(value),
      hints: [
        "目前只有一侧横向半周长，仍可作为杯型方向参考，但不用于判断左右差异。",
        "如果之后愿意补充另一侧数据，结果会更适合做试穿记录对比。",
      ],
      asymmetry: null,
      tendencies: ["flexibleStart"],
    };
  }

  const averageHalfArc = round1((data.leftHalfArc + data.rightHalfArc) / 2);
  const asymmetryDelta = round1(Math.abs(data.leftHalfArc - data.rightHalfArc));
  const halfArcToCupDifferenceRatio = round2(averageHalfArc / Math.max(cupDifference, 4));
  const halfArcToBandRatio = round2(averageHalfArc / bandAnchor);
  const tendencies = [];
  const hints = [];

  if (halfArcToCupDifferenceRatio >= 2.1 || (halfArcToBandRatio >= 0.27 && cupDifference <= 13)) {
    tendencies.push("broadBaseLowerProjection");
    hints.push("横向半周长相对杯差偏大，可能提示较宽底盘或较低投射方向。浅杯、宽钢圈或 bralette 可作为温和起点。");
  } else if (halfArcToCupDifferenceRatio <= 1.45 && cupDifference >= 11) {
    tendencies.push("narrowerBaseHigherProjection");
    hints.push("横向半周长相对杯差偏小，可能提示更窄底盘或更高投射方向。可以观察更深杯型或结构更明确的杯面。");
  } else {
    tendencies.push("mixedSignals");
    hints.push("横向半周长和杯差没有给出单一方向。建议同时试浅杯 / 弹性杯面，以及一款略有结构的杯型做对比。");
  }

  if (halfArcToBandRatio >= 0.27) {
    tendencies.push("broadDistribution");
    hints.push("平均横向半周长相对下围偏高，试穿时可特别观察侧边是否被钢圈或杯边压到。");
  }

  const asymmetry = asymmetryDelta >= 2 || asymmetryDelta / averageHalfArc >= 0.12
    ? {
        meaningful: true,
        text: `左右横向半周长相差约 ${asymmetryDelta} cm。可以考虑可调肩带、可取杯垫、弹性杯面，或按贴合更需要空间的一侧来试穿。`,
      }
    : {
        meaningful: false,
        text: "左右横向半周长接近。仍可在试穿时观察两侧杯口、侧边和肩带感受是否不同。",
      };

  return {
    status: "complete",
    averageHalfArc,
    asymmetryDelta,
    halfArcToCupDifferenceRatio,
    halfArcToBandRatio,
    hints,
    asymmetry,
    tendencies: unique(tendencies),
  };
}

function buildStyleSuggestions(arc, cupDifference) {
  const suggestions = new Set(["弹性杯面", "可调肩带"]);

  if (arc.tendencies.includes("broadBaseLowerProjection")) {
    ["浅杯", "宽钢圈", "无钢圈", "bralette", "轻支撑背心"].forEach((item) => suggestions.add(item));
  }

  if (arc.tendencies.includes("broadDistribution")) {
    ["侧边支撑", "全罩浅杯", "低压迫运动内衣"].forEach((item) => suggestions.add(item));
  }

  if (arc.tendencies.includes("narrowerBaseHigherProjection")) {
    ["更深杯型", "更有投射空间的杯面", "较稳定下围"].forEach((item) => suggestions.add(item));
  }

  if (arc.tendencies.includes("flexibleStart") || arc.tendencies.includes("mixedSignals")) {
    ["软三角杯", "无钢圈", "浅杯", "低压迫运动内衣"].forEach((item) => suggestions.add(item));
  }

  if (cupDifference < 8.5) {
    ["柔软杯面", "浅杯", "轻支撑款", "低压迫", "带胸垫背心"].forEach((item) => suggestions.add(item));
  }

  return [...suggestions];
}

function estimateConfidence(data, arc) {
  let score = 82;
  const bustSpread = Math.max(data.standingBust, data.leaningBust, data.lyingBust) -
    Math.min(data.standingBust, data.leaningBust, data.lyingBust);
  const bandSpread = data.looseUnderbust - data.tightUnderbust;

  if (arc.status === "missing") score -= 16;
  if (arc.status === "partial") score -= 9;
  if (bustSpread > 8) score -= 8;
  if (bustSpread > 12) score -= 8;
  if (bandSpread > 8) score -= 5;
  if (bandSpread < 2) score -= 4;

  score = clamp(score, 42, 92);

  if (score >= 78) {
    return { level: "较清晰", score, text: "数据之间相互支持，可以作为第一批试穿起点。" };
  }
  if (score >= 62) {
    return { level: "中等", score, text: "适合用于缩小试穿范围，仍建议用试穿感受修正。" };
  }
  return { level: "较保守", score, text: "结果可作为方向提示，不建议把任何标签当成固定答案。" };
}

function buildTryOnObservations() {
  return [
    "如果杯口空但侧边压，问题可能是杯型偏深或钢圈偏窄，可以试浅杯或宽钢圈。",
    "如果下围上滑，先观察下围稳定性，再考虑杯面空间。",
    "如果肩带承担过多重量，优先检查下围是否提供足够支撑。",
    "如果鸡心不贴，可能与杯型、杯面空间或下围稳定性有关。",
    "如果左右贴合不同，可按更需要空间的一侧试穿，再用肩带或杯垫微调。",
  ];
}

function buildUncertaintyNotes(data, estimatedBust, cupDifference, confidence) {
  const notes = [
    `上胸围估算使用透明权重：站立 45% + 前倾 35% + 躺下 20% = ${estimatedBust} cm。`,
    `杯差估算为 ${cupDifference} cm。它只用于选择第一批试穿标签，不是定论。`,
    `置信度：${confidence.level}。${confidence.text}`,
    "不同品牌、地区尺码和杯型版型差异很大，试穿体验比标签更重要。",
  ];

  if (data.leftHalfArc === null || data.rightHalfArc === null) {
    notes.push("横向半周长未完整填写，因此杯型方向提示会更依赖试穿反馈。");
  }

  if (cupDifference < 8.5) {
    notes.push("当前数据可能暂时不需要强支撑，可以从轻支撑、低压迫、无钢圈、bralette 或带胸垫背心等方向开始。");
  }

  return notes;
}

function renderResult(record) {
  const { result } = record;
  els.emptyResult.hidden = true;
  els.resultContent.hidden = false;

  renderChips(els.rangeChips, getPriorityStartingPoints(result));
  renderStartingPoints(els.startingPoints, result);
  renderResultItems(els.sisterSizes, [
    {
      title: result.sisterSizes.length
        ? `围绕主锚点 ${result.bandRange.primary}${result.primaryCupLabel} 的对照：${result.sisterSizes.join(" / ")}`
        : `主锚点 ${result.bandRange.primary}${result.primaryCupLabel}`,
      text: "姊妹尺码不是另一个裁定，而是围绕主下围锚点做对照：小一档下围通常对应更大杯标，大一档下围通常对应更小杯标，用来比较下围稳定性和杯面空间。",
    },
  ]);
  renderChips(els.styleDirection, result.styleSuggestions);
  renderResultItems(els.arcHints, result.arc.hints.map((text, index) => ({
    title: index === 0 ? "横向半周长提示" : "试穿观察",
    text,
  })));

  if (result.arc.asymmetry) {
    els.asymmetryPanel.hidden = false;
    renderResultItems(els.asymmetryNote, [{ title: "左右差异观察", text: result.arc.asymmetry.text }]);
  } else {
    els.asymmetryPanel.hidden = true;
  }

  els.tryonObservations.innerHTML = result.observations.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  renderResultItems(els.uncertaintyNotes, result.uncertainty.map((text) => ({ title: "说明", text })));
  showMessage(els.saveMessage, "");
}

function renderEmptyResult() {
  els.emptyResult.hidden = false;
  els.resultContent.hidden = true;
}

function renderChips(container, values) {
  container.innerHTML = values.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("");
}

function getPriorityStartingPoints(result) {
  if (Array.isArray(result.priorityStartingPoints) && result.priorityStartingPoints.length) {
    return result.priorityStartingPoints;
  }
  return Array.isArray(result.fittingRange) ? result.fittingRange.slice(0, 3) : [];
}

function getExpandedStartingPoints(result) {
  if (Array.isArray(result.expandedStartingPoints) && result.expandedStartingPoints.length) {
    return result.expandedStartingPoints;
  }
  return Array.isArray(result.fittingRange) ? result.fittingRange.slice(3) : [];
}

function getCombinedFittingRange(result) {
  return unique([...getPriorityStartingPoints(result), ...getExpandedStartingPoints(result)]);
}

function getAllSuggestedSizes(result) {
  if (Array.isArray(result.allSuggestedSizes) && result.allSuggestedSizes.length) {
    return result.allSuggestedSizes;
  }
  return getCombinedFittingRange(result);
}

function renderStartingPoints(container, result) {
  const priority = getPriorityStartingPoints(result);
  const expanded = getExpandedStartingPoints(result);
  const anchorSize = `${result.bandRange.primary}${result.primaryCupLabel}`;
  container.innerHTML = `
    <div class="result-item">
      <strong>优先试穿</strong>
      <div class="chips inline-chips">${priority.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("")}</div>
      <span>不同地区和品牌的杯码字母并不完全等价，这里的字母只用于生成第一批试穿标签。</span>
      <span>如果只想先买 1–2 件，优先选择可退换品牌，并从主锚点 ${escapeHtml(anchorSize)} 附近开始。</span>
      <span>试穿时同时记录品牌、杯型和身体感受。</span>
    </div>
    <div class="result-item">
      <strong>扩展对照</strong>
      <div class="chips inline-chips">${expanded.length ? expanded.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("") : "<span>暂无额外对照</span>"}</div>
      <span>这些用于比较不同下围和杯面空间，不需要一次全部购买。</span>
    </div>
    <div class="result-item">
      <strong>下围范围：${escapeHtml(result.bandRange.range.join(" / "))}</strong>
      <span>${escapeHtml(result.bandRange.note)} 偏柔软的下围和偏稳定的下围体感不同，可以都作为观察对象。</span>
      ${(result.bandRange.observationRules || []).map((rule) => `<span>${escapeHtml(rule)}</span>`).join("")}
    </div>
  `;
}

function renderResultItems(container, items) {
  container.innerHTML = items.map((item) => `
    <div class="result-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.text)}</span>
    </div>
  `).join("");
}

function renderIssueChecklist() {
  els.issueChecklist.innerHTML = issueOptions.map((issue) => `
    <label>
      <input type="checkbox" value="${issue.id}" data-issue>
      <span>${escapeHtml(issue.label)}</span>
    </label>
  `).join("");

  els.issueChecklist.querySelectorAll("[data-issue]").forEach((input) => {
    input.addEventListener("change", () => {
      const selected = getSelectedIssues();
      renderIssueSuggestions(selected);
      if (latestDraft) {
        latestDraft.fitIssues = selected;
        latestDraft.fitIssueSuggestions = buildIssueSuggestions(selected);
      }
    });
  });
}

function getSelectedIssues() {
  return [...document.querySelectorAll("[data-issue]:checked")].map((input) => input.value);
}

function renderIssueSuggestions(selected) {
  const suggestions = buildIssueSuggestions(selected);
  if (!suggestions.length) {
    els.issueSuggestions.innerHTML = "<p>先选择一两个最明显的现象。</p>";
    return;
  }

  renderResultItems(els.issueSuggestions, suggestions.map((text) => ({ title: "可尝试", text })));
}

function buildIssueSuggestions(selected) {
  const has = (id) => selected.includes(id);
  const suggestions = [];

  if (has("cupEdgeGaps") && has("sideCompression")) {
    suggestions.push("杯口空同时侧边压组织时，可以先试浅杯、宽钢圈或弹性杯面。");
  } else {
    if (has("cupEdgeGaps")) suggestions.push("杯口空可以观察杯型是否偏深，或杯面是否缺少贴合弹性。");
    if (has("sideCompression")) suggestions.push("侧边压组织时，可以试更宽钢圈、侧边更平顺的杯型，或低压迫款式。");
  }

  if (has("bandRidesUp")) suggestions.push("下围上滑时，可以试小一档下围或更稳定的下围材质。");
  if (has("goreNotTacking")) suggestions.push("鸡心不贴可能来自杯型、杯面空间或下围稳定性，可逐项对比。");
  if (has("strapsCarryWeight")) suggestions.push("肩带承担过多重量时，先检查下围支撑，再调整肩带长度。");
  if (has("wireTooNarrow")) suggestions.push("钢圈偏窄时，可以优先试宽钢圈、无钢圈或更柔软的侧边结构。");
  if (has("cupTooDeep")) suggestions.push("杯型偏深时，可以试浅杯、软三角杯或弹性杯面。");
  if (has("cupCutsIn")) suggestions.push("杯口压入组织时，可以观察杯口弹性、杯面容量和肩带是否过紧。");
  if (has("oneSideDifferent")) suggestions.push("左右贴合不同很常见。可按更需要空间的一侧试穿，并用肩带、可取杯垫或弹性杯面微调。");

  return unique(suggestions);
}

function saveLatestRecord() {
  if (!latestDraft) {
    showMessage(els.saveMessage, "还没有可保存的结果。", true);
    return;
  }

  latestDraft.fitIssues = getSelectedIssues();
  latestDraft.fitIssueSuggestions = buildIssueSuggestions(latestDraft.fitIssues);
  const records = loadRecords();
  records.unshift({ ...latestDraft, id: makeId() });
  saveRecords(records);
  renderRecords();
  showMessage(els.saveMessage, "已保存到本地记录。");
}

function renderRecords() {
  const records = loadRecords();

  if (!records.length) {
    els.recordsList.innerHTML = `
      <section class="empty-state">
        <h2>暂无记录</h2>
        <p>保存测量后，记录会出现在这里。建议定期导出 JSON 备份。</p>
      </section>
    `;
    return;
  }

  els.recordsList.innerHTML = records.map((record) => recordCardHtml(record)).join("");
  els.recordsList.querySelectorAll("[data-delete-record]").forEach((button) => {
    button.addEventListener("click", () => deleteRecord(button.dataset.deleteRecord));
  });
}

function recordCardHtml(record) {
  const measurement = record.measurement || {};
  const result = record.result || {};
  const priority = getPriorityStartingPoints(result);
  const expanded = getExpandedStartingPoints(result);
  const issueLabels = (record.fitIssues || [])
    .map((id) => issueOptions.find((issue) => issue.id === id)?.label || id);

  return `
    <article class="record-card">
      <div class="record-meta">
        <h2>${escapeHtml(measurement.date || "未命名日期")}</h2>
        <p>优先试穿：${escapeHtml(priority.join(" / ") || "未计算")}</p>
        <p>扩展对照：${escapeHtml(expanded.join(" / ") || "未记录")}</p>
        <p>下围建议：${escapeHtml((result.bandRange?.range || []).join(" / ") || "未计算")} ｜ 杯差估算：${escapeHtml(formatValue(result.cupDifference))} cm</p>
      </div>
      <ul class="record-details">
        <li><strong>底盘 / 投射：</strong>${escapeHtml((result.arc?.hints || []).join(" "))}</li>
        <li><strong>风格方向：</strong>${escapeHtml((result.styleSuggestions || []).join("、") || "未记录")}</li>
        <li><strong>试穿问题：</strong>${escapeHtml(issueLabels.join("、") || "未选择")}</li>
        <li><strong>备注：</strong>${escapeHtml([measurement.currentBra, measurement.fitNotes, measurement.moodNote].filter(Boolean).join(" ｜ ") || "未填写")}</li>
      </ul>
      <button class="ghost-button" type="button" data-delete-record="${escapeHtml(record.id)}">删除这条记录</button>
    </article>
  `;
}

function deleteRecord(id) {
  const records = loadRecords().filter((record) => record.id !== id);
  saveRecords(records);
  renderRecords();
  showMessage(els.recordsMessage, "已删除这条记录。");
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function exportCurrent(format) {
  if (!latestDraft) {
    showMessage(els.saveMessage, "请先生成结果再导出。", true);
    return;
  }
  const fitIssues = getSelectedIssues();
  const record = {
    ...latestDraft,
    fitIssues,
    fitIssueSuggestions: buildIssueSuggestions(fitIssues),
  };
  if (format === "json") {
    downloadJson([record], `moon-fit-${record.measurement.date || "record"}.json`);
  } else {
    downloadCsv([record], `moon-fit-${record.measurement.date || "record"}.csv`);
  }
}

function exportAll(format) {
  const records = loadRecords();
  if (!records.length) {
    showMessage(els.recordsMessage, "没有可导出的记录。", true);
    return;
  }

  if (format === "json") {
    downloadJson(records, "moon-fit-records.json");
  } else {
    downloadCsv(records, "moon-fit-records.csv");
  }
  showMessage(els.recordsMessage, "已准备导出文件。");
}

function downloadJson(records, filename) {
  const payload = {
    app: "Moon Bra Fit Helper",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    records,
  };
  downloadFile(JSON.stringify(payload, null, 2), filename, "application/json;charset=utf-8");
}

function downloadCsv(records, filename) {
  const headers = [
    "id",
    "date",
    "weight",
    "tightUnderbust",
    "snugUnderbust",
    "looseUnderbust",
    "standingBust",
    "leaningBust",
    "lyingBust",
    "leftHalfArc",
    "rightHalfArc",
    "estimatedBust",
    "cupDifference",
    "priorityStartingPoints",
    "expandedStartingPoints",
    "fittingRange",
    "allSuggestedSizes",
    "sisterSizes",
    "bandRange",
    "confidence",
    "arcHints",
    "asymmetryHint",
    "styleSuggestions",
    "fitIssues",
    "hrtNote",
    "currentBra",
    "fitNotes",
    "moodNote",
    "createdAt",
  ];

  const rows = records.map((record) => {
    const m = record.measurement || {};
    const r = record.result || {};
    const priorityStartingPoints = getPriorityStartingPoints(r);
    const expandedStartingPoints = getExpandedStartingPoints(r);
    const fittingRange = getCombinedFittingRange(r);
    const allSuggestedSizes = getAllSuggestedSizes(r);
    return [
      record.id,
      m.date,
      m.weight,
      m.tightUnderbust,
      m.snugUnderbust,
      m.looseUnderbust,
      m.standingBust,
      m.leaningBust,
      m.lyingBust,
      m.leftHalfArc,
      m.rightHalfArc,
      r.estimatedBust,
      r.cupDifference,
      priorityStartingPoints.join(" / "),
      expandedStartingPoints.join(" / "),
      fittingRange.join(" / "),
      allSuggestedSizes.join(" / "),
      (r.sisterSizes || []).join(" / "),
      (r.bandRange?.range || []).join(" / "),
      r.confidence?.level,
      (r.arc?.hints || []).join(" "),
      r.arc?.asymmetry?.text || "",
      (r.styleSuggestions || []).join("、"),
      (record.fitIssues || []).join("、"),
      m.hrtNote,
      m.currentBra,
      m.fitNotes,
      m.moodNote,
      record.createdAt,
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadFile(`\uFEFF${csv}`, filename, "text/csv;charset=utf-8");
}

function importJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const incoming = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(incoming)) {
        throw new Error("No records array");
      }

      const normalized = incoming
        .filter((record) => record && typeof record === "object")
        .map((record) => ({
          ...record,
          id: record.id || makeId(),
          importedAt: new Date().toISOString(),
        }));

      const existing = loadRecords();
      const seen = new Set(existing.map((record) => record.id));
      const merged = [...existing];
      normalized.forEach((record) => {
        if (seen.has(record.id)) {
          merged.push({ ...record, id: `${record.id}-imported-${Date.now()}` });
        } else {
          merged.push(record);
        }
      });

      saveRecords(merged);
      renderRecords();
      showMessage(els.recordsMessage, `已导入 ${normalized.length} 条记录。`);
    } catch {
      showMessage(els.recordsMessage, "JSON 暂时无法导入。请确认文件来自本工具导出的备份，或包含 records 数组。", true);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // Local file previews and restrictive browsers can reject service workers.
    });
  }
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", Boolean(isError && message));
}

function parseNumber(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToNearestFive(value) {
  return Math.round(value / 5) * 5;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatValue(value) {
  return value === null || value === undefined || Number.isNaN(value) ? "" : String(value);
}

function csvEscape(value) {
  const text = formatValue(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateDateButtonText() {
  if (!els.dateButtonText) return;
  els.dateButtonText.textContent = els.date.value || "选择日期";
}

function escapeHtml(value) {
  return formatValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
