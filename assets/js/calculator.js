/* =========================================================
   WATTRIX / CALCULATOR LOGIC (2026 Revamp)
   =======================================================*/

/* Constants */
const LIMITS = {
    capMin: 1, capMax: 250,
    effMin: 10, effMax: 1000,
    pwrMin: 1, pwrMax: 500,
    priceMin: 0, priceMax: 5,
    distMin: 1, distMax: 5000,
    bufMin: 0, bufMax: 50,
    socMin: 0, socMax: 100,
    hoursMin: 0, hoursMax: 48
};

const STORAGE_KEY = 'wattrixInputs';

/* Helpers */
const $ = id => document.getElementById(id);
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
const num = (v, def = 0) => {
    if (v == null || v === '') return def;
    const n = parseFloat(String(v).replace(/\s+/g, '').replace(',', '.'));
    return isFinite(n) ? n : def;
};
const fmt = (n, d = 1) => isFinite(n) ? Number(n).toFixed(d) : '–';

/* Main Calculation */
function recompute() {
    // 1. Gather Inputs
    const cap = num($('usableKWh').value);
    const effIn = num($('whPerKm').value);
    const effUnit = $('unitDist').value; // 'km' or 'mi'
    const effWhPerKm = effUnit === 'mi' ? (effIn / 1.60934) : effIn;

    const pwr = num($('chargerPower').value);
    const price = num($('pricePerKWh').value);
    const currency = $('currency').value;

    const tripVal = num($('tripKm').value);
    const distUnit = $('distUnit').value; // 'km' or 'mi'
    const distanceKm = distUnit === 'mi' ? (tripVal * 1.60934) : tripVal;

    const bufPct = num($('bufferPct').value);
    const buf = clamp(bufPct, 0, 50) / 100;

    const from = clamp(num($('socFrom').value), 0, 100);
    const to = clamp(num($('socTo').value), 0, 100);
    const plannedChargeHours = num($('plannedChargeHours').value);

    // 2. Compute
    const tripKWh = (distanceKm * effWhPerKm / 1000) * (1 + buf);
    const availableKWh = cap * from / 100;

    // How much we need to ADD to reach destination
    const neededKWh = Math.max(tripKWh - availableKWh, 0);
    const neededChargeHours = pwr > 0 ? neededKWh / pwr : 0;

    // Cost of the needed energy
    const neededCost = neededKWh * price;

    // Planned charge specific logic
    const plannedAddedKWh = plannedChargeHours > 0 ? plannedChargeHours * pwr : 0;
    const potentialKWh = availableKWh + plannedAddedKWh;
    const actualKWhAfterCharge = Math.min(potentialKWh, cap); // Can't go over 100%
    const socAfterCharge = cap > 0 ? (actualKWhAfterCharge / cap) * 100 : 0;

    const destKWh = actualKWhAfterCharge - tripKWh;
    const destSOC = cap > 0 ? Math.max((destKWh / cap) * 100, 0) : 0;

    // Cost of planned charge (only what fits in battery)
    const chargeAmountKWh = actualKWhAfterCharge - availableKWh;
    const plannedCost = chargeAmountKWh * price;

    // 3. Update DOM

    // KPIs
    $('kpiEnergy').textContent = `${fmt(neededKWh)} kWh`;
    $('kpiTime').textContent = formatTime(neededChargeHours);
    $('kpiCost').textContent = `${currency}${fmt(neededCost, 2)}`;

    // Update colors based on severity
    $('kpiCost').className = neededCost > 50 ? 'kpi-val text-warn' : 'kpi-val text-ok';

    // Detailed Breakdown List
    const lines = [];

    // TRIP DETAILS
    lines.push(`<li class="group-header">Trip Requirements</li>`);
    lines.push(`<li>Distance: <span>${fmt(distanceKm)} km</span></li>`);
    lines.push(`<li>Energy (w/ ${fmt(bufPct, 0)}% buffer): <span class="mono">${fmt(tripKWh)} kWh</span></li>`);

    // CHARGING NEEDS
    lines.push(`<li class="group-header">Required Charging</li>`);
    if (neededKWh > 0) {
        lines.push(`<li class="warn"><b>Shortfall: ${fmt(neededKWh)} kWh</b></li>`);
        lines.push(`<li>Charge time: <span>${formatTime(neededChargeHours)} @ ${fmt(pwr)} kW</span></li>`);
    } else {
        lines.push(`<li class="ok">No mid-trip charging needed!</li>`);
        lines.push(`<li>Surplus: <span>${fmt(availableKWh - tripKWh)} kWh</span></li>`);
    }

    // PLANNED CHARGE (If user entered hours)
    if (plannedChargeHours > 0) {
        lines.push(`<li class="group-header">Planned Stop (${fmt(plannedChargeHours)}h)</li>`);
        lines.push(`<li>Added: <span>${fmt(chargeAmountKWh)} kWh</span></li>`);
        lines.push(`<li>SoC after charge: <span>${fmt(socAfterCharge)}%</span></li>`);
        lines.push(`<li>Arrival SoC: <span class="${destKWh < 0 ? 'text-danger' : 'text-ok'}">${fmt(destSOC)}%</span></li>`);
    } else {
        lines.push(`<li class="group-header">Arrival Status</li>`);
        if (availableKWh - tripKWh < 0) {
            lines.push(`<li class="text-danger">Warning: You will run out of battery.</li>`);
        } else {
            const arrivalSoC = cap > 0 ? ((availableKWh - tripKWh) / cap) * 100 : 0;
            lines.push(`<li>Arrival SoC: <span class="text-ok">${fmt(arrivalSoC)}%</span></li>`);
        }
    }

    if ($('breakdownList')) {
        $('breakdownList').innerHTML = lines.join('');
    }
}

function formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/* Storage & Events */
function save() {
    const ids = ['usableKWh', 'whPerKm', 'unitDist', 'chargerPower', 'pricePerKWh', 'currency', 'tripKm', 'distUnit', 'bufferPct', 'socFrom', 'socTo', 'plannedChargeHours'];
    const data = {};
    ids.forEach(id => { const el = $(id); if (el) data[id] = el.value; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function load() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (data) Object.entries(data).forEach(([id, val]) => { const el = $(id); if (el) el.value = val; });
    } catch (e) { }
}

/* Initialization */
window.addEventListener('DOMContentLoaded', () => {
    load();
    recompute();

    // Bind all inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', () => { recompute(); save(); });
        el.addEventListener('change', () => { recompute(); save(); });
    });

    // Reset Button
    const resetBtn = $('resetBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        };
    }
});
