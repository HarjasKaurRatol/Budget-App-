import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtT5vyC42DwQ0dQ3PIhP53weNXnHQBzgs",
  authDomain: "budget-app-50d20.firebaseapp.com",
  projectId: "budget-app-50d20",
  storageBucket: "budget-app-50d20.firebasestorage.app",
  messagingSenderId: "1044990034588",
  appId: "1:1044990034588:web:2ac9351e66429e9beae359"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const FIRESTORE_DOC = doc(db, "budget", "mydata");

const STORAGE_KEY = "budget-snapshot-state";

const CATEGORY_STYLES = {
  Bills: { color: "#f7c9c1", text: "#8b1e1e" },
  Shopping: { color: "#d8c3f0", text: "#5a3d85" },
  "Food & Drink": { color: "#cde7b7", text: "#1b6d45" },
  Subscriptions: { color: "#ffd5af", text: "#8a4f00" },
  Transportation: { color: "#d0d8ff", text: "#314a9f" },
  Travel: { color: "#8b4b10", text: "#fff3dd" },
  Entertainment: { color: "#ffe7a0", text: "#6f5600" },
  "Credit Card Bill": { color: "#cc1717", text: "#fff2f2" },
  Groceries: { color: "#1e7d4a", text: "#eefcf3" },
  Health: { color: "#bfd9ff", text: "#284e88" },
  Other: { color: "#e6ddd4", text: "#5e514b" }
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_STYLES);
const SOURCE_OPTIONS = ["Checking", "Savings", "Chase", "Zolve", "Cash"];
const PAYMENT_TYPE_OPTIONS = ["Savings to Checking", "Card Payment"];
const PAYMENT_CARD_OPTIONS = ["Chase", "Zolve"];
const SAFETY_BUFFER = 600;
const TREAT_SAFETY_BUFFER = 300;
const TREAT_MODES = {
  Conservative: { percent: 0.05, cap: 25, cardThreshold: 0.25, label: "Small treat okay" },
  Balanced: { percent: 0.1, cap: 50, cardThreshold: 0.4, label: "Small treat okay" },
  Flexible: { percent: 0.15, cap: 75, cardThreshold: 0.55, label: "Healthy room" }
};

const defaultState = {
  checking: "",
  savings: "",
  salaryAmount: "",
  salaryDate: "",
  splitwiseOweAmount: "",
  splitwiseOweDate: "",
  splitwiseOwedAmount: "",
  splitwiseOwedDate: "",
  activePeriod: getCurrentPeriod(),
  budgetCaps: [createBudgetCap({ category: "Shopping", amount: "200" })],
  treatMode: "Balanced",
  treatEnabled: true,
  purchaseName: "",
  purchaseAmount: "",
  paymentEntries: [],
  expenses: []
};

const state = loadState();

const checkingInput = document.querySelector("#checkingInput");
const savingsInput = document.querySelector("#savingsInput");
const chaseCardTotal = document.querySelector("#chaseCardTotal");
const zolveCardTotal = document.querySelector("#zolveCardTotal");
const chaseCardHelper = document.querySelector("#chaseCardHelper");
const zolveCardHelper = document.querySelector("#zolveCardHelper");
const salaryAmountInput = document.querySelector("#salaryAmountInput");
const salaryDateInput = document.querySelector("#salaryDateInput");
const splitwiseOweAmountInput = document.querySelector("#splitwiseOweAmountInput");
const splitwiseOweDateInput = document.querySelector("#splitwiseOweDateInput");
const splitwiseOwedAmountInput = document.querySelector("#splitwiseOwedAmountInput");
const splitwiseOwedDateInput = document.querySelector("#splitwiseOwedDateInput");
const periodFilterInput = document.querySelector("#periodFilterInput");
const periodSummary = document.querySelector("#periodSummary");
const treatModeInput = document.querySelector("#treatModeInput");
const treatEnabledInput = document.querySelector("#treatEnabledInput");
const purchaseNameInput = document.querySelector("#purchaseNameInput");
const purchaseAmountInput = document.querySelector("#purchaseAmountInput");
const addPaymentEntryButton = document.querySelector("#addPaymentEntryButton");
const addExpenseButton = document.querySelector("#addExpenseButton");
const loadScriptDataButton = document.querySelector("#loadScriptDataButton");
const saveSheetDataButton = document.querySelector("#saveSheetDataButton");
const sideNavButtons = document.querySelectorAll(".side-nav-item");
const paymentTableBody = document.querySelector("#paymentTableBody");
const paymentRowTemplate = document.querySelector("#paymentRowTemplate");
const expenseTableBody = document.querySelector("#expenseTableBody");
const expenseRowTemplate = document.querySelector("#expenseRowTemplate");
const chartCanvas = document.querySelector("#expenseChart");
const chartContext = chartCanvas.getContext("2d");
const chartLegend = document.querySelector("#chartLegend");
const dailyChartCanvas = document.querySelector("#dailyChart");
const dailyChartContext = dailyChartCanvas.getContext("2d");
const monthlyPeriodLabel = document.querySelector("#monthlyPeriodLabel");
const monthlyTotal = document.querySelector("#monthlyTotal");
const monthlyPeak = document.querySelector("#monthlyPeak");
const monthlyAverage = document.querySelector("#monthlyAverage");
const monthlyActiveDays = document.querySelector("#monthlyActiveDays");

const totalCash = document.querySelector("#totalCash");
const totalMoneyLeft = document.querySelector("#totalMoneyLeft");
const plannedFromChecking = document.querySelector("#plannedFromChecking");
const totalCardPayments = document.querySelector("#totalCardPayments");
const checkingAfterCards = document.querySelector("#checkingAfterCards");
const incomingSoon = document.querySelector("#incomingSoon");
const splitwiseIncoming = document.querySelector("#splitwiseIncoming");
const settlementDue = document.querySelector("#settlementDue");
const projectedAvailable = document.querySelector("#projectedAvailable");
const nextMoneyDate = document.querySelector("#nextMoneyDate");
const transferTotal = document.querySelector("#transferTotal");
const paymentsTotal = document.querySelector("#paymentsTotal");
const totalExpenses = document.querySelector("#totalExpenses");
const topCategory = document.querySelector("#topCategory");
const nextBill = document.querySelector("#nextBill");
const checkingAfterExpenses = document.querySelector("#checkingAfterExpenses");
const safeToSpend = document.querySelector("#safeToSpend");
const visualTotalMoneyLeft = document.querySelector("#visualTotalMoneyLeft");
const healthLabel = document.querySelector("#healthLabel");
const saveStatus = document.querySelector("#saveStatus");
const toastNotification = document.querySelector("#toastNotification");
const afterPurchase = document.querySelector("#afterPurchase");
const purchaseImpactText = document.querySelector("#purchaseImpactText");
const decisionText = document.querySelector("#decisionText");
const decisionCard = document.querySelector("#decisionCard");
const treatBudget = document.querySelector("#treatBudget");
const treatStatus = document.querySelector("#treatStatus");
const treatReason = document.querySelector("#treatReason");
const treatPurchaseFit = document.querySelector("#treatPurchaseFit");
const treatCard = document.querySelector("#treatCard");
let saveStatusTimeout = null;
let toastTimeout = null;
let lastManualSaveSnapshot = serializeState(state);

hydrateInputs();
renderPeriodFilter();
renderPaymentEntries();
renderExpenses();
updateSummary();

// Load from Firestore and override local state if cloud data exists
getDoc(FIRESTORE_DOC).then((snap) => {
  if (!snap.exists()) return;
  const data = snap.data();
  Object.assign(state, {
    ...cloneDefaultState(),
    ...data,
    budgetCaps: normalizeBudgetCaps(data.budgetCaps),
    treatMode: TREAT_MODES[data.treatMode] ? data.treatMode : "Balanced",
    treatEnabled: data.treatEnabled !== false,
    expenses: Array.isArray(data.expenses) ? data.expenses.map((e) => ({ ...e, category: normalizeCategory(e) })) : cloneDefaultState().expenses
  });
  lastManualSaveSnapshot = serializeState(state);
  hydrateInputs();
  renderPeriodFilter();
  renderPaymentEntries();
  renderExpenses();
  updateSummary();
  showSaveStatus("Synced from cloud.");
}).catch(() => {
  // Firestore unavailable — local state already loaded, carry on
});

checkingInput.addEventListener("input", (event) => {
  state.checking = event.target.value;
  persistAndRefresh();
});

savingsInput.addEventListener("input", (event) => {
  state.savings = event.target.value;
  persistAndRefresh();
});

salaryAmountInput.addEventListener("input", (event) => {
  state.salaryAmount = event.target.value;
  persistAndRefresh();
});

salaryDateInput.addEventListener("input", (event) => {
  state.salaryDate = event.target.value;
  persistAndRefresh();
});

splitwiseOweAmountInput.addEventListener("input", (event) => {
  state.splitwiseOweAmount = event.target.value;
  persistAndRefresh();
});

splitwiseOweDateInput.addEventListener("input", (event) => {
  state.splitwiseOweDate = event.target.value;
  persistAndRefresh();
});

splitwiseOwedAmountInput.addEventListener("input", (event) => {
  state.splitwiseOwedAmount = event.target.value;
  persistAndRefresh();
});

splitwiseOwedDateInput.addEventListener("input", (event) => {
  state.splitwiseOwedDate = event.target.value;
  persistAndRefresh();
});

periodFilterInput.addEventListener("input", (event) => {
  state.activePeriod = event.target.value;
  persistAndRefresh();
});

treatModeInput.addEventListener("input", (event) => {
  state.treatMode = event.target.value;
  persistAndRefresh();
});

treatEnabledInput.addEventListener("input", (event) => {
  state.treatEnabled = event.target.checked;
  persistAndRefresh();
});

purchaseNameInput.addEventListener("input", (event) => {
  state.purchaseName = event.target.value;
  persistAndRefresh();
});

purchaseAmountInput.addEventListener("input", (event) => {
  state.purchaseAmount = event.target.value;
  persistAndRefresh();
});

addExpenseButton.addEventListener("click", () => {
  addExpenseRow();
});

addPaymentEntryButton.addEventListener("click", () => {
  state.paymentEntries.push(createPaymentEntry({ date: getDefaultDateForPeriod(state.activePeriod) }));
  persistAndRefresh(false, true);
  scrollToNewestPaymentRow();
});

loadScriptDataButton.addEventListener("click", () => {
  state.expenses = cloneDefaultState().expenses;
  persistAndRefresh(true);
  showSaveStatus("Expense sheet reloaded from script.js sample data.");
});

saveSheetDataButton.addEventListener("click", async () => {
  await saveCurrentSheetData();
});

async function saveCurrentSheetData() {
  const preview = buildExpenseSeedPreview();
  const currentSnapshot = serializeState(state);

  if (currentSnapshot === lastManualSaveSnapshot) {
    showSaveStatus("No changes to save.");
    showToast("No changes to save.", "info");
    return;
  }

  localStorage.setItem(STORAGE_KEY, currentSnapshot);
  updateScriptPreview();

  await setDoc(FIRESTORE_DOC, JSON.parse(currentSnapshot));
  lastManualSaveSnapshot = currentSnapshot;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(preview);
      showSaveStatus("Saved to cloud and copied sheet data.");
      showToast("Saved to cloud and copied the current sheet data.", "success");
      return;
    }
  } catch {
    // Fall back to cloud-only message below.
  }

  showSaveStatus("Saved to cloud.");
  showToast("Saved to cloud.", "success");
}

window.addEventListener("resize", () => {
  drawChart(getCategoryTotals(getFilteredExpenses(normalizeExpenses(state.expenses), state.activePeriod)));
  updateMonthlyChart();
});

sideNavButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const action = button.dataset.navAction;
    const targetId = button.dataset.navTarget;

    if (action === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "add-expense") {
      addExpenseRow();
      return;
    }

    if (action === "save-data") {
      await saveCurrentSheetData();
      return;
    }

    if (targetId) {
      const target = document.querySelector(`#${targetId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

function hydrateInputs() {
  checkingInput.value = state.checking;
  savingsInput.value = state.savings;
  salaryAmountInput.value = state.salaryAmount;
  salaryDateInput.value = state.salaryDate;
  splitwiseOweAmountInput.value = state.splitwiseOweAmount;
  splitwiseOweDateInput.value = state.splitwiseOweDate;
  splitwiseOwedAmountInput.value = state.splitwiseOwedAmount;
  splitwiseOwedDateInput.value = state.splitwiseOwedDate;
  treatModeInput.value = state.treatMode;
  treatEnabledInput.checked = Boolean(state.treatEnabled);
  purchaseNameInput.value = state.purchaseName;
  purchaseAmountInput.value = state.purchaseAmount;
  updateScriptPreview();
}

function renderPaymentEntries() {
  paymentTableBody.innerHTML = "";
  const visibleEntries = getFilteredEntries(state.paymentEntries, state.activePeriod);

  if (!visibleEntries.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="empty-state">${state.activePeriod ? "No payment entries in this period yet." : "Add a transfer or payment entry to plan how you will pay your cards."}</td>`;
    paymentTableBody.append(row);
    return;
  }

  visibleEntries.forEach((entry) => {
    const fragment = paymentRowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");
    const fields = {
      date: row.querySelector('[data-field="date"]'),
      type: row.querySelector('[data-field="type"]'),
      card: row.querySelector('[data-field="card"]'),
      amount: row.querySelector('[data-field="amount"]')
    };
    const removeButton = row.querySelector('[data-action="remove"]');

    fillSelect(fields.type, PAYMENT_TYPE_OPTIONS, entry.type);
    fillSelect(fields.card, PAYMENT_CARD_OPTIONS, entry.card);
    updatePaymentRowState(fields.type.value, fields.card);

    Object.entries(fields).forEach(([fieldName, input]) => {
      input.value = entry[fieldName] || "";
      input.addEventListener("input", (event) => {
        entry[fieldName] = event.target.value;

        if (fieldName === "type") {
          updatePaymentRowState(event.target.value, fields.card);
        }

        persistAndRefresh(false, true);
      });
    });

    removeButton.addEventListener("click", () => {
      state.paymentEntries = state.paymentEntries.filter((item) => item.id !== entry.id);
      persistAndRefresh(false, true);
    });

    paymentTableBody.append(fragment);
  });
}

function renderExpenses() {
  expenseTableBody.innerHTML = "";
  const visibleExpenses = getFilteredEntries(state.expenses, state.activePeriod);

  if (visibleExpenses.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6" class="empty-state">${state.activePeriod ? "No expenses in this period yet. Add a dated row to start tracking." : "No expenses yet. Add a row to start tracking."}</td>`;
    expenseTableBody.append(row);
    return;
  }

  visibleExpenses.forEach((expense) => {
    const fragment = expenseRowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");
    const fields = {
      date: row.querySelector('[data-field="date"]'),
      description: row.querySelector('[data-field="description"]'),
      amount: row.querySelector('[data-field="amount"]'),
      category: row.querySelector('[data-field="category"]'),
      source: row.querySelector('[data-field="source"]')
    };
    const removeButton = row.querySelector('[data-action="remove"]');

    fillSelect(fields.category, CATEGORY_OPTIONS, expense.category);
    fillSelect(fields.source, SOURCE_OPTIONS, expense.source);

    Object.entries(fields).forEach(([fieldName, input]) => {
      input.value = expense[fieldName] || "";
      input.addEventListener("input", (event) => {
        expense[fieldName] = event.target.value;

        if (fieldName === "category") {
          tintSelect(input, event.target.value);
        }

        persistAndRefresh(fieldName === "category");
      });

      if (fieldName === "date") {
        input.addEventListener("focus", () => {
          if (!input.value) {
            const today = new Date().toLocaleDateString("en-CA");
            input.value = today;
            expense.date = today;
            persistAndRefresh();
          }
        });
      }

      if (input.tagName === "SELECT" && fieldName === "category") {
        tintSelect(input, expense.category);
        input.classList.add("category-pill");
      }
    });

    removeButton.addEventListener("click", () => {
      state.expenses = state.expenses.filter((entry) => entry.id !== expense.id);
      persistAndRefresh(true);
    });

    expenseTableBody.append(fragment);
  });
}

function addExpenseRow() {
  state.expenses.push(createExpense({ date: getDefaultDateForPeriod(state.activePeriod) }));
  persistAndRefresh(true);
  scrollToNewestExpenseRow();
}

function updateSummary() {
  const checking = toNumber(state.checking);
  const savings = toNumber(state.savings);
  const salaryAmount = toNumber(state.salaryAmount);
  const splitwiseOweAmount = toNumber(state.splitwiseOweAmount);
  const splitwiseOwedAmount = toNumber(state.splitwiseOwedAmount);
  const purchaseAmount = toNumber(state.purchaseAmount);
  const expenses = getFilteredExpenses(normalizeExpenses(state.expenses), state.activePeriod);
  const paymentEntries = getFilteredEntries(normalizePaymentEntries(state.paymentEntries), state.activePeriod);
  const categoryTotals = getCategoryTotals(expenses);

  const totalCashValue = checking + savings;
  const totalExpensesValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const checkingExpenses = expenses
    .filter((expense) => expense.source === "Checking")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const chaseSheetCharges = expenses
    .filter((expense) => expense.source === "Chase")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const zolveSheetCharges = expenses
    .filter((expense) => expense.source === "Zolve")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const transferPlannedValue = paymentEntries
    .filter((entry) => entry.type === "Savings to Checking")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const chasePaidValue = paymentEntries
    .filter((entry) => entry.type === "Card Payment" && entry.card === "Chase")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const zolvePaidValue = paymentEntries
    .filter((entry) => entry.type === "Card Payment" && entry.card === "Zolve")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalPaymentsRecordedValue = chasePaidValue + zolvePaidValue;
  const totalChaseDueValue = Math.max(0, chaseSheetCharges - chasePaidValue);
  const totalZolveDueValue = Math.max(0, zolveSheetCharges - zolvePaidValue);
  const totalCardPaymentsValue = totalChaseDueValue + totalZolveDueValue;
  const totalMoneyLeftValue = totalCashValue - totalCardPaymentsValue;
  const safeToSpendValue = checking + transferPlannedValue - checkingExpenses - totalCardPaymentsValue;
  const projectedAvailableValue = safeToSpendValue + salaryAmount + splitwiseOwedAmount - splitwiseOweAmount;
  const afterPurchaseValue = totalMoneyLeftValue - purchaseAmount;
  const treatPlan = getTreatPlan({
    totalMoneyLeftValue,
    safeToSpendValue,
    totalCardPaymentsValue,
    splitwiseOweAmount,
    purchaseAmount
  });

  totalCash.textContent = formatCurrency(totalCashValue);
  totalMoneyLeft.textContent = formatCurrency(totalMoneyLeftValue);
  visualTotalMoneyLeft.textContent = formatCurrency(totalMoneyLeftValue);
  chaseCardTotal.textContent = formatCurrency(totalChaseDueValue);
  zolveCardTotal.textContent = formatCurrency(totalZolveDueValue);
  transferTotal.textContent = formatCurrency(transferPlannedValue);
  paymentsTotal.textContent = formatCurrency(totalPaymentsRecordedValue);
  plannedFromChecking.textContent = formatCurrency(checkingExpenses);
  totalCardPayments.textContent = formatCurrency(totalCardPaymentsValue);
  checkingAfterCards.textContent = formatCurrency(safeToSpendValue);
  chaseCardHelper.textContent = `Sheet charges: ${formatCurrency(chaseSheetCharges)}. Paid: ${formatCurrency(chasePaidValue)}. Remaining: ${formatCurrency(totalChaseDueValue)}.`;
  zolveCardHelper.textContent = `Sheet charges: ${formatCurrency(zolveSheetCharges)}. Paid: ${formatCurrency(zolvePaidValue)}. Remaining: ${formatCurrency(totalZolveDueValue)}.`;
  incomingSoon.textContent = formatCurrency(salaryAmount);
  splitwiseIncoming.textContent = formatCurrency(splitwiseOwedAmount);
  settlementDue.textContent = formatCurrency(splitwiseOweAmount);
  projectedAvailable.textContent = formatCurrency(projectedAvailableValue);
  nextMoneyDate.textContent = getNextMoneyDateLabel(state.salaryDate, state.splitwiseOweDate, state.splitwiseOwedDate);
  totalExpenses.textContent = formatCurrency(totalExpensesValue);
  checkingAfterExpenses.textContent = formatCurrency(safeToSpendValue);
  safeToSpend.textContent = formatCurrency(safeToSpendValue);
  afterPurchase.textContent = formatCurrency(afterPurchaseValue);
  purchaseImpactText.textContent = `Total money left minus this purchase: ${formatCurrency(totalMoneyLeftValue)} - ${formatCurrency(purchaseAmount)}.`;
  nextBill.textContent = getNextBillLabel(expenses);
  topCategory.textContent = getTopCategoryLabel(categoryTotals);
  treatBudget.textContent = formatCurrency(treatPlan.budget);
  treatStatus.textContent = treatPlan.status;
  treatReason.textContent = treatPlan.reason;
  treatPurchaseFit.textContent = treatPlan.purchaseFit;
  periodSummary.textContent = state.activePeriod ? `Viewing ${formatPeriodLabel(state.activePeriod)}` : "Viewing all periods";

  updateHealthLabel(safeToSpendValue);
  updateDecision(purchaseAmount, afterPurchaseValue);
  updateTreatCard(treatPlan.tone);
  renderPeriodFilter();
  renderLegend(categoryTotals);
  drawChart(categoryTotals);
  updateMonthlyChart();
  updateScriptPreview();
}

function updateHealthLabel(remaining) {
  healthLabel.className = "";

  if (remaining > SAFETY_BUFFER) {
    healthLabel.textContent = "You still have room after your checking expenses.";
    healthLabel.classList.add("good");
    return;
  }

  if (remaining >= 0) {
    healthLabel.textContent = "Your checking balance covers the plan, but the cushion is small.";
    healthLabel.classList.add("caution");
    return;
  }

  healthLabel.textContent = "Your planned checking expenses are higher than your checking balance.";
  healthLabel.classList.add("bad");
}

function updateDecision(purchaseAmount, afterPurchaseValue) {
  decisionCard.classList.remove("good", "caution", "bad");

  if (!purchaseAmount) {
    decisionText.textContent = "Enter an item above to compare it with your remaining money.";
    return;
  }

  const itemName = state.purchaseName.trim() || "This purchase";

  if (afterPurchaseValue > SAFETY_BUFFER) {
    decisionText.textContent = `${itemName} still leaves you with a healthy cushion above your ${formatCurrency(SAFETY_BUFFER)} safety buffer.`;
    decisionCard.classList.add("good");
    return;
  }

  if (afterPurchaseValue >= SAFETY_BUFFER) {
    decisionText.textContent = `${itemName} is possible, but it would leave you close to your ${formatCurrency(SAFETY_BUFFER)} safety buffer.`;
    decisionCard.classList.add("caution");
    return;
  }

  decisionText.textContent = `${itemName} would push you below your ${formatCurrency(SAFETY_BUFFER)} safety buffer.`;
  decisionCard.classList.add("bad");
}

function updateTreatCard(tone) {
  treatCard.classList.remove("good", "caution", "bad");

  if (tone) {
    treatCard.classList.add(tone);
  }
}

function renderLegend(categoryTotals) {
  chartLegend.innerHTML = "";

  if (categoryTotals.length === 0) {
    const empty = document.createElement("div");
    empty.className = "legend-item";
    empty.textContent = "Add expenses to build the chart";
    chartLegend.append(empty);
    return;
  }

  categoryTotals.forEach((entry) => {
    const item = document.createElement("div");
    const capAmount = getCategoryCapAmount(entry.category);
    const isOverCap = capAmount > 0 && entry.total > capAmount;
    const legendTone = isOverCap ? "legend-item over-cap" : "legend-item";
    const helperText = capAmount > 0
      ? `${formatCurrency(Math.abs(capAmount - entry.total))} ${isOverCap ? "over" : "left"}`
      : "No cap";

    item.className = legendTone;
    item.innerHTML = `
      <span class="legend-swatch" style="background:${isOverCap ? "#c74444" : CATEGORY_STYLES[entry.category].color}"></span>
      <div class="legend-copy">
        <span class="legend-title">${entry.category}: ${formatCurrency(entry.total)}</span>
        <small class="legend-helper">${helperText}</small>
      </div>
      <label class="legend-cap-input">
        <span>Cap</span>
        <input type="number" min="0" step="0.01" value="${capAmount || ""}" placeholder="0.00" data-category-cap="${entry.category}" />
      </label>
    `;

    const capInput = item.querySelector(`[data-category-cap="${entry.category}"]`);
    capInput.addEventListener("input", (event) => {
      upsertCategoryCap(entry.category, event.target.value);
      persistAndRefresh();
    });

    chartLegend.append(item);
  });
}

function drawChart(categoryTotals) {
  const dpr = window.devicePixelRatio || 1;
  const width = chartCanvas.clientWidth || 720;
  const height = 280;

  chartCanvas.width = width * dpr;
  chartCanvas.height = height * dpr;
  chartContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  chartContext.clearRect(0, 0, width, height);

  if (categoryTotals.length === 0) {
    chartContext.fillStyle = "#8b7d77";
    chartContext.font = "600 16px Manrope";
    chartContext.fillText("Your category chart will appear here.", 24, 40);
    return;
  }

  const chartWidth = width - 80;
  const chartHeight = height - 70;
  const barGap = 16;
  const barWidth = Math.max(36, (chartWidth - barGap * (categoryTotals.length - 1)) / categoryTotals.length);
  const maxValue = Math.max(...categoryTotals.map((entry) => entry.total), 1);

  chartContext.strokeStyle = "rgba(72, 47, 40, 0.12)";
  chartContext.lineWidth = 1;

  for (let index = 0; index < 4; index += 1) {
    const y = 20 + (chartHeight / 3) * index;
    chartContext.beginPath();
    chartContext.moveTo(24, y);
    chartContext.lineTo(width - 24, y);
    chartContext.stroke();
  }

  chartContext.font = "600 12px Manrope";
  chartContext.textAlign = "center";

  categoryTotals.forEach((entry, index) => {
    const x = 40 + index * (barWidth + barGap);
    const barHeight = (entry.total / maxValue) * (chartHeight - 20);
    const y = height - 36 - barHeight;
    const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.Other;
    const capAmount = getCategoryCapAmount(entry.category);
    const isOverCap = capAmount > 0 && entry.total > capAmount;

    chartContext.fillStyle = isOverCap ? "#e15b5b" : style.color;
    roundRect(chartContext, x, y, barWidth, barHeight, 14);
    chartContext.fill();

    chartContext.fillStyle = isOverCap ? "#8b1e1e" : "#5f524b";
    chartContext.fillText(shortLabel(entry.category), x + barWidth / 2, height - 14);

    chartContext.fillStyle = isOverCap ? "#8b1e1e" : style.text;
    chartContext.fillText(formatCompactCurrency(entry.total), x + barWidth / 2, Math.max(16, y - 8));
  });
}

function getCategoryTotals(expenses) {
  const totals = new Map();

  expenses.forEach((expense) => {
    const current = totals.get(expense.category) || 0;
    totals.set(expense.category, current + expense.amount);
  });

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => right.total - left.total);
}

function getDailyTotals(expenses, activePeriod) {
  if (!activePeriod) return [];
  const [year, month] = activePeriod.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const totals = new Array(daysInMonth).fill(0);
  expenses.forEach((expense) => {
    if (!expense.date || !expense.amount) return;
    const day = parseInt(expense.date.split("-")[2], 10);
    if (day >= 1 && day <= daysInMonth) {
      totals[day - 1] += expense.amount;
    }
  });
  return totals;
}

function updateMonthlyChart() {
  const expenses = getFilteredExpenses(normalizeExpenses(state.expenses), state.activePeriod);
  const dailyTotals = getDailyTotals(expenses, state.activePeriod);

  monthlyPeriodLabel.textContent = state.activePeriod ? `Viewing ${formatPeriodLabel(state.activePeriod)}` : "Viewing all periods";

  const activeDays = dailyTotals.filter((v) => v > 0).length;
  const total = dailyTotals.reduce((sum, v) => sum + v, 0);
  const peak = Math.max(...dailyTotals, 0);
  const peakDay = dailyTotals.indexOf(peak) + 1;
  const average = activeDays > 0 ? total / activeDays : 0;

  monthlyTotal.textContent = formatCurrency(total);
  monthlyPeak.textContent = peak > 0 ? `${formatCurrency(peak)} (day ${peakDay})` : "—";
  monthlyAverage.textContent = formatCurrency(average);
  monthlyActiveDays.textContent = activeDays;

  drawDailyChart(dailyTotals);
}

function drawDailyChart(dailyTotals) {
  const dpr = window.devicePixelRatio || 1;
  const width = dailyChartCanvas.clientWidth || 720;
  const height = 320;

  dailyChartCanvas.width = width * dpr;
  dailyChartCanvas.height = height * dpr;
  dailyChartContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  dailyChartContext.clearRect(0, 0, width, height);

  if (!dailyTotals.length || dailyTotals.every((v) => v === 0)) {
    dailyChartContext.fillStyle = "#8b7d77";
    dailyChartContext.font = "600 16px Manrope";
    dailyChartContext.fillText("Add expenses to see your daily spending.", 24, 40);
    return;
  }

  const today = new Date();
  const todayDay = today.getDate();
  const todayPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentPeriod = state.activePeriod === todayPeriod;

  const maxValue = Math.max(...dailyTotals, 1);
  const daysCount = dailyTotals.length;
  const padLeft = 24;
  const padRight = 24;
  const padTop = 36;
  const padBottom = 32;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const barGap = Math.max(2, Math.floor((chartWidth / daysCount) * 0.25));
  const barWidth = Math.max(4, (chartWidth - barGap * (daysCount - 1)) / daysCount);

  // Grid lines
  dailyChartContext.strokeStyle = "rgba(72, 47, 40, 0.1)";
  dailyChartContext.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padTop + (chartHeight / 3) * i;
    dailyChartContext.beginPath();
    dailyChartContext.moveTo(padLeft, y);
    dailyChartContext.lineTo(width - padRight, y);
    dailyChartContext.stroke();
  }

  dailyChartContext.textAlign = "center";

  dailyTotals.forEach((amount, index) => {
    const day = index + 1;
    const x = padLeft + index * (barWidth + barGap);
    const barHeight = amount > 0 ? Math.max(4, (amount / maxValue) * (chartHeight - 20)) : 0;
    const y = padTop + chartHeight - barHeight;
    const isToday = isCurrentPeriod && day === todayDay;

    if (barHeight > 0) {
      dailyChartContext.fillStyle = isToday ? "rgba(201, 95, 55, 0.9)" : "rgba(201, 95, 55, 0.35)";
      roundRect(dailyChartContext, x, y, barWidth, barHeight, Math.min(8, barWidth / 2));
      dailyChartContext.fill();

      if (barWidth >= 22) {
        dailyChartContext.fillStyle = isToday ? "#933a1f" : "#8b7d77";
        dailyChartContext.font = `${isToday ? "700" : "600"} 10px Manrope`;
        dailyChartContext.fillText(formatCompactCurrency(amount), x + barWidth / 2, Math.max(padTop - 4, y - 6));
      }
    }

    if (day === 1 || day % 5 === 0 || isToday) {
      dailyChartContext.fillStyle = isToday ? "#c95f37" : "#8b7d77";
      dailyChartContext.font = `${isToday ? "800" : "600"} 10px Manrope`;
      dailyChartContext.fillText(String(day), x + barWidth / 2, height - padBottom + 16);
    }
  });
}

function getTopCategoryLabel(categoryTotals) {
  if (categoryTotals.length === 0) {
    return "No expenses yet";
  }

  const top = categoryTotals[0];
  return `${top.category} ${formatCurrency(top.total)}`;
}

function getNextBillLabel(expenses) {
  const upcoming = expenses
    .filter((expense) => expense.category === "Bills" && expense.date)
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  if (upcoming.length === 0) {
    return "No dated bills yet";
  }

  const next = upcoming[0];
  const formattedDate = new Date(`${next.date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });

  return `${next.description || "Bill"} on ${formattedDate}`;
}

function normalizeExpenses(expenses) {
  return expenses.map((expense) => ({
    ...expense,
    amount: toNumber(expense.amount),
    category: normalizeCategory(expense),
    source: normalizeSource(expense.source)
  }));
}

function fillSelect(select, options, selected) {
  select.innerHTML = options
    .map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`)
    .join("");
}

function tintSelect(select, category) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
  select.style.backgroundColor = style.color;
  select.style.color = style.text;
}

function persistAndRefresh(renderExpensesList = false, renderPaymentsList = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setDoc(FIRESTORE_DOC, JSON.parse(JSON.stringify(state))).catch(() => {});
  const dirty = serializeState(state) !== lastManualSaveSnapshot;
  showSaveStatus(dirty ? "Changes saved locally. Tap save when you want confirmation." : "Saved locally on this device.");

  if (renderExpensesList) {
    renderExpenses();
  }

  if (renderPaymentsList) {
    renderPaymentEntries();
  }

  updateSummary();
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return cloneDefaultState();
  }

  try {
    const parsed = JSON.parse(stored);
    const legacySplitwiseAmount = parsed.splitwiseAmount ?? "";
    const legacySplitwiseDate = parsed.splitwiseDate ?? "";
    return {
      ...cloneDefaultState(),
      ...parsed,
      splitwiseOweAmount: parsed.splitwiseOweAmount ?? legacySplitwiseAmount,
      splitwiseOweDate: parsed.splitwiseOweDate ?? legacySplitwiseDate,
      splitwiseOwedAmount: parsed.splitwiseOwedAmount ?? "",
      splitwiseOwedDate: parsed.splitwiseOwedDate ?? "",
      activePeriod: typeof parsed.activePeriod === "string" ? parsed.activePeriod : getCurrentPeriod(),
      budgetCaps: normalizeBudgetCaps(parsed.budgetCaps),
      treatMode: TREAT_MODES[parsed.treatMode] ? parsed.treatMode : "Balanced",
      treatEnabled: parsed.treatEnabled !== false,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map((expense) => ({
        ...expense,
        category: normalizeCategory(expense)
      })) : cloneDefaultState().expenses
    };
  } catch {
    return cloneDefaultState();
  }
}

function createExpense(overrides = {}) {
  return {
    id: createId(),
    date: "",
    description: "",
    amount: "",
    category: "Bills",
    source: "Checking",
    ...overrides
  };
}

function createPaymentEntry(overrides = {}) {
  return {
    id: createId(),
    date: "",
    type: "Savings to Checking",
    card: "Chase",
    amount: "",
    ...overrides
  };
}

function createBudgetCap(overrides = {}) {
  return {
    id: createId(),
    category: "Shopping",
    amount: "200",
    ...overrides
  };
}

function cloneDefaultState() {
  return {
    ...defaultState,
    activePeriod: defaultState.activePeriod || getCurrentPeriod(),
    budgetCaps: (defaultState.budgetCaps || []).map((entry) => ({ ...entry })),
    treatMode: TREAT_MODES[defaultState.treatMode] ? defaultState.treatMode : "Balanced",
    treatEnabled: defaultState.treatEnabled !== false,
    paymentEntries: (defaultState.paymentEntries || []).map((entry) => ({ ...entry })),
    expenses: defaultState.expenses.map((expense) => ({ ...expense }))
  };
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toNumber(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0
  }).format(value);
}

function shortLabel(label) {
  if (label.length <= 12) {
    return label;
  }

  return `${label.slice(0, 10)}...`;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function showSaveStatus(message = "Saved locally on this device.") {
  if (!saveStatus) {
    return;
  }

  saveStatus.textContent = message;

  if (saveStatusTimeout) {
    window.clearTimeout(saveStatusTimeout);
  }

  saveStatusTimeout = window.setTimeout(() => {
    saveStatus.textContent = serializeState(state) !== lastManualSaveSnapshot
      ? "Changes saved locally. Tap save when you want confirmation."
      : "Your entries will stay here on this browser.";
  }, 1600);
}

function showToast(message, tone = "info") {
  if (!toastNotification) {
    return;
  }

  toastNotification.textContent = message;
  toastNotification.classList.remove("success", "info", "visible");
  toastNotification.classList.add(tone);

  // Force transition restart.
  void toastNotification.offsetWidth;
  toastNotification.classList.add("visible");

  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    toastNotification.classList.remove("visible");
  }, 2200);
}

function serializeState(value) {
  return JSON.stringify(value);
}

function scrollToNewestExpenseRow() {
  const rows = expenseTableBody.querySelectorAll("tr");
  const lastRow = rows[rows.length - 1];

  if (!lastRow) {
    return;
  }

  lastRow.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  const firstInput = lastRow.querySelector("input, select");
  if (firstInput) {
    window.setTimeout(() => {
      firstInput.focus();
    }, 220);
  }
}

function updateScriptPreview() {
  return buildExpenseSeedPreview();
}

function buildExpenseSeedPreview() {
  const lines = state.expenses.map((expense) => {
    const fields = [
      `date: ${quoteValue(expense.date)}`,
      `description: ${quoteValue(expense.description)}`,
      `amount: ${quoteValue(expense.amount)}`,
      `category: ${quoteValue(expense.category)}`,
      `source: ${quoteValue(expense.source)}`
    ];

    return `createExpense({ ${fields.join(", ")} })`;
  });

  return `expenses: [\n  ${lines.join(",\n  ")}\n]`;
}

function quoteValue(value) {
  return JSON.stringify(value || "");
}

function normalizeSource(source) {
  if (SOURCE_OPTIONS.includes(source)) {
    return source;
  }

  if (source === "Credit Card") {
    return "Chase";
  }

  return "Checking";
}

function normalizeCategory(expense) {
  const description = (expense.description || "").toLowerCase();

  if (expense.category === "Travel" && /(uber|lyft|cab|subway)/.test(description)) {
    return "Transportation";
  }

  if (CATEGORY_OPTIONS.includes(expense.category)) {
    return expense.category;
  }

  return "Other";
}

function normalizePaymentEntries(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    ...entry,
    amount: toNumber(entry.amount),
    type: PAYMENT_TYPE_OPTIONS.includes(entry.type) ? entry.type : "Savings to Checking",
    card: PAYMENT_CARD_OPTIONS.includes(entry.card) ? entry.card : "Chase"
  }));
}

function normalizeBudgetCaps(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return cloneDefaultState().budgetCaps;
  }

  return entries.map((entry) => ({
    id: entry.id || createId(),
    category: CATEGORY_OPTIONS.includes(entry.category) ? entry.category : "Shopping",
    amount: entry.amount ?? "200"
  }));
}

function getCategoryCapAmount(category) {
  const match = state.budgetCaps.find((entry) => entry.category === category);
  return match ? toNumber(match.amount) : 0;
}

function upsertCategoryCap(category, amount) {
  const existing = state.budgetCaps.find((entry) => entry.category === category);

  if (!amount) {
    state.budgetCaps = state.budgetCaps.filter((entry) => entry.category !== category);
    return;
  }

  if (existing) {
    existing.amount = amount;
    return;
  }

  state.budgetCaps.push(createBudgetCap({ category, amount }));
}

function getTreatPlan({
  totalMoneyLeftValue,
  safeToSpendValue,
  totalCardPaymentsValue,
  splitwiseOweAmount,
  purchaseAmount
}) {
  const mode = TREAT_MODES[state.treatMode] || TREAT_MODES.Balanced;
  const trueFreeMoney = totalMoneyLeftValue - TREAT_SAFETY_BUFFER;
  const upcomingObligations = totalCardPaymentsValue + splitwiseOweAmount;

  if (!state.treatEnabled) {
    return {
      budget: 0,
      status: "Suggestions off",
      reason: "Treat guidance is turned off right now.",
      purchaseFit: "Turn this on when you want a spending suggestion tied to your current plan.",
      tone: ""
    };
  }

  if (safeToSpendValue < 0) {
    return {
      budget: 0,
      status: "No treat today",
      reason: "Checking is already under pressure, so extras are not recommended yet.",
      purchaseFit: getTreatPurchaseFit(0, purchaseAmount, false),
      tone: "bad"
    };
  }

  if (trueFreeMoney <= 0) {
    return {
      budget: 0,
      status: "No treat today",
      reason: `Your total money left does not clear the ${formatCurrency(TREAT_SAFETY_BUFFER)} treat buffer yet.`,
      purchaseFit: getTreatPurchaseFit(0, purchaseAmount, false),
      tone: "bad"
    };
  }

  if (safeToSpendValue <= TREAT_SAFETY_BUFFER) {
    return {
      budget: 0,
      status: "No treat today",
      reason: "Your checking cushion is too tight after planned expenses and card payments.",
      purchaseFit: getTreatPurchaseFit(0, purchaseAmount, false),
      tone: "bad"
    };
  }

  let budget = Math.min(trueFreeMoney * mode.percent, mode.cap);
  let status = mode.label;
  let reason = `Using ${state.treatMode.toLowerCase()} mode, only a portion of money above your ${formatCurrency(TREAT_SAFETY_BUFFER)} treat buffer is available for a treat.`;
  let tone = "good";

  if (totalCardPaymentsValue > safeToSpendValue * mode.cardThreshold) {
    if (state.treatMode === "Conservative") {
      budget = 0;
      status = "No treat today";
      reason = "Card payments are still heavy compared with your checking cushion, so rewards should wait.";
      tone = "bad";
    } else {
      budget *= 0.5;
      status = "Small treat okay";
      reason = "Card payments are still a meaningful part of your plan, so the treat budget is reduced.";
      tone = "caution";
    }
  }

  if (budget > 0 && upcomingObligations > totalMoneyLeftValue * 0.45) {
    budget *= 0.7;
    status = "Small treat okay";
    reason = "You have room for a reward, but upcoming obligations are still high enough to keep it modest.";
    tone = tone === "bad" ? "bad" : "caution";
  }

  budget = Math.max(0, Math.round(budget * 100) / 100);

  return {
    budget,
    status: budget > 0 ? status : "No treat today",
    reason: budget > 0 ? reason : "Your plan needs more cushion before extras are a good idea.",
    purchaseFit: getTreatPurchaseFit(budget, purchaseAmount, totalMoneyLeftValue - purchaseAmount >= TREAT_SAFETY_BUFFER),
    tone: budget > 0 ? tone : "bad"
  };
}

function getTreatPurchaseFit(treatBudgetValue, purchaseAmount, staysSafe) {
  if (!purchaseAmount) {
    return "Enter something in Purchase planner to compare it with your treat budget.";
  }

  if (purchaseAmount <= treatBudgetValue) {
    return "This fits inside your treat budget.";
  }

  if (staysSafe) {
    return "This is affordable, but it is above your treat budget.";
  }

  return "This would push you below your safe buffer.";
}

function updatePaymentRowState(type, cardSelect) {
  const isCardPayment = type === "Card Payment";
  cardSelect.disabled = !isCardPayment;
  cardSelect.style.opacity = isCardPayment ? "1" : "0.5";

  if (!isCardPayment) {
    cardSelect.value = "Chase";
  }
}

function getDefaultDateForPeriod(activePeriod) {
  if (!activePeriod) {
    return "";
  }

  const today = new Date().toLocaleDateString("en-CA");
  if (today.startsWith(activePeriod)) {
    return today;
  }

  return `${activePeriod}-01`;
}

function getNextMoneyDateLabel(salaryDate, splitwiseOweDate, splitwiseOwedDate) {
  const entries = [
    salaryDate ? { label: "Salary", date: salaryDate } : null,
    splitwiseOwedDate ? { label: "Splitwise in", date: splitwiseOwedDate } : null,
    splitwiseOweDate ? { label: "Splitwise out", date: splitwiseOweDate } : null
  ].filter(Boolean).sort((left, right) => new Date(left.date) - new Date(right.date));

  if (entries.length === 0) {
    return "No date yet";
  }

  const next = entries[0];
  const formattedDate = new Date(`${next.date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });

  return `${next.label} on ${formattedDate}`;
}

function scrollToNewestPaymentRow() {
  const rows = paymentTableBody.querySelectorAll("tr");
  const lastRow = rows[rows.length - 1];

  if (!lastRow) {
    return;
  }

  lastRow.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function renderPeriodFilter() {
  const availablePeriods = getAvailablePeriods();
  const currentValue = state.activePeriod || "";
  const options = ['<option value="">All periods</option>']
    .concat(availablePeriods.map((period) => `<option value="${period}" ${period === currentValue ? "selected" : ""}>${formatPeriodLabel(period)}</option>`));

  periodFilterInput.innerHTML = options.join("");
  periodFilterInput.value = currentValue;
}

function getAvailablePeriods() {
  const periods = new Set();

  state.expenses.forEach((expense) => {
    const period = toPeriod(expense.date);
    if (period) {
      periods.add(period);
    }
  });

  state.paymentEntries.forEach((entry) => {
    const period = toPeriod(entry.date);
    if (period) {
      periods.add(period);
    }
  });

  if (state.activePeriod) {
    periods.add(state.activePeriod);
  }

  return Array.from(periods).sort().reverse();
}

function getFilteredExpenses(expenses, activePeriod) {
  return expenses.filter((expense) => matchesPeriod(expense.date, activePeriod));
}

function getFilteredEntries(entries, activePeriod) {
  return (Array.isArray(entries) ? entries : []).filter((entry) => matchesPeriod(entry.date, activePeriod));
}

function matchesPeriod(date, activePeriod) {
  if (!activePeriod) {
    return true;
  }

  if (!date) {
    return false;
  }

  return toPeriod(date) === activePeriod;
}

function toPeriod(date) {
  return typeof date === "string" && date.length >= 7 ? date.slice(0, 7) : "";
}

function formatPeriodLabel(period) {
  if (!period) {
    return "All periods";
  }

  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
