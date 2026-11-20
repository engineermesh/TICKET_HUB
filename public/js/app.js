document.getElementById("year").textContent = new Date().getFullYear();

async function loadEvents() {
  const target = document.getElementById("events-list");
  try {
    const response = await fetch("/api/events");
    const events = await response.json();
    if (!response.ok) throw new Error(events.error || "Could not load events.");
    if (!events.length) {
      target.innerHTML = '<div class="event-card"><h3>Events are coming soon</h3><p>Published sports events will appear here.</p></div>';
      return;
    }
    target.innerHTML = events.map(event => {
      const cheapest = event.ticket_types.length
        ? Math.min(...event.ticket_types.map(t => Number(t.price))) : null;
      return `<article class="event-card">
        <p class="eyebrow">${escapeHtml(event.sport_name || "SPORTS EVENT")}</p>
        <h3>${escapeHtml(event.home_team || event.event_name)}${event.away_team ? " vs " + escapeHtml(event.away_team) : ""}</h3>
        <p>${escapeHtml(event.description || "Join the action live.")}</p>
        <div class="event-meta">📍 ${escapeHtml(event.venue)}<br>📅 ${new Date(event.event_date).toLocaleString()}</div>
        <div class="price">${cheapest === null ? "Check back soon" : "From KES " + cheapest.toLocaleString()}</div>
        <a class="button" href="/login.html">Log in to book</a>
      </article>`;
    }).join("");
  } catch (error) {
    target.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
loadEvents();
