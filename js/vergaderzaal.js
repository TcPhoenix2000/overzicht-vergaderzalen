// Dagoverzicht vergaderzalen voor de schoonmaak.
// Haalt de slots rechtstreeks in de browser op en ververst elke minuut (de API staat CORS toe).
const API_URL = "https://api.agsoknokke-heist.be/api/v1/booking/slots";
const REFRESH_MS = 60 * 1000;
const TZ = "Europe/Brussels";

const fmtTime = new Intl.DateTimeFormat("nl-BE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fmtDay = new Intl.DateTimeFormat("nl-BE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Opeenvolgende slots met dezelfde status en hetzelfde onderwerp samenvoegen:
// 08:30-12:00 Bezet i.p.v. zeven halve uren; twee vergaderingen na elkaar blijven apart.
function mergeBlocks(slots) {
  const blocks = [];
  for (const slot of slots) {
    const start = new Date(slot.startDate);
    const end = new Date(slot.endDate);
    const last = blocks[blocks.length - 1];
    if (last && last.available === slot.available && last.subject === (slot.subject || "") && last.end.getTime() === start.getTime()) {
      last.end = end;
    } else {
      blocks.push({ available: slot.available, subject: slot.subject || "", start, end });
    }
  }
  return blocks;
}

// Per zaal alle blokken van vandaag, met het onderwerp (zonder namen, zie namenfilter.js) bij "Bezet".
function buildDayView(data, now) {
  if (!data.length) return '<p class="none">Geen vergaderzalen gevonden.</p>';
  return data.map(entry => {
    const roomName = entry.room?.text || "Onbekende locatie";
    const items = mergeBlocks(entry.slots || []).map(b => {
      const subject = zonderNamen(b.subject);
      const when = b.end <= now ? " past" : b.start <= now ? " now" : "";
      return `<li class="${b.available ? "free" : "taken"}${when}">
        <span>${fmtTime.format(b.start)} - ${fmtTime.format(b.end)}</span>
        <span>${b.available ? "Vrij" : "Bezet"}</span>
        ${subject ? `<span class="subject">${escapeHtml(subject)}</span>` : ""}
      </li>`;
    });
    return `<section class="room">
      <h2>${escapeHtml(roomName)}</h2>
      <ul>${items.length ? items.join("") : '<li class="none">Geen slots vandaag</li>'}</ul>
    </section>`;
  }).join("\n");
}

async function fetchSlots(now) {
  const res = await fetch(`${API_URL}?date=${encodeURIComponent(now.toISOString())}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadSlots() {
  const updated = document.getElementById("updated");
  const now = new Date();
  try {
    const data = await fetchSlots(now);
    document.getElementById("dayView").innerHTML = buildDayView(data, now);
    document.getElementById("today").textContent = fmtDay.format(now);
    updated.textContent = `Laatst bijgewerkt: ${fmtTime.format(now)}`;
  } catch (err) {
    // Laat de vorige data staan bij een tijdelijke fout; toon enkel een melding.
    console.error("Fout bij ophalen slots:", err);
    updated.textContent = `Bijwerken mislukt (${err.message}), nieuwe poging binnen een minuut.`;
  }
}

loadSlots();
setInterval(loadSlots, REFRESH_MS);
