# Wattrix — EV Charge Planner

*The EV charging matrix.*

Wattrix is a single-file web app that estimates **energy to charge (kWh)**, **session time**, and **cost** for any EV. It works from a few simple inputs (battery size, efficiency, charger power, price) and supports both **km/mi** and **comma/dot** decimals.

**No backend. No build step. Just open `index.html`.**

---

## Features

* **Instant estimates:** energy (kWh), time (h:mm), and cost
* **Unit-aware:** Wh/km or Wh/mi, km or mi; automatic conversion
* **Decimal-friendly:** accepts `0.20` and `0,20`
* **Safety buffer:** quick chips (+5%, +10%, +15%)
* **Clean UI:** responsive grid, accessible labels, consistent field sizing
* **Branding:** inline SVG logo + gradient wordmark (no image assets)
* **Zero dependencies:** pure HTML/CSS/JS

> Current build intentionally keeps things simple. There’s no account, storage, taper modeling, or fee engine (see roadmap in issues).

---

## How it works

Wattrix computes two energies and charges the **greater** of the two.

**Trip energy**
$$
\text{trip_kWh}=\frac{\text{distance_km}\times \text{eff_WhPerKm}}{1000}\times (1+\text{buffer})
$$

**SOC window energy**
$$
\text{soc_kWh}=\text{usable_kWh}\times \frac{\text{target}%-\text{current}%}{100}
$$

**Then:**

* **Energy to add** = `max(trip_kWh, soc_kWh)`
* **Time** = `energy / chargerPower (kW)`
* **Cost** = `energy * pricePerKWh`

**Conversions**

* If **Wh/mi** is chosen: `eff_WhPerKm = eff_WhPerMi / 1.60934`
* If **mi** distance is chosen: `distance_km = distance_mi * 1.60934`

**Validation**

* `battery > 0`, `efficiency > 0`, `power > 0`, `target% > current%`
