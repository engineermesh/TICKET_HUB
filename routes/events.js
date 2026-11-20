const express = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT e.*, s.name AS sport_name,
        COALESCE(json_agg(json_build_object(
          'id', tt.id, 'ticket_name', tt.ticket_name,
          'price', tt.price, 'available_quantity', tt.available_quantity
        )) FILTER (WHERE tt.id IS NOT NULL), '[]') AS ticket_types
      FROM events e
      LEFT JOIN sports s ON s.id=e.sport_id
      LEFT JOIN ticket_types tt ON tt.event_id=e.id
      WHERE e.status='published' AND e.event_date >= NOW()
      GROUP BY e.id, s.name
      ORDER BY e.event_date ASC
    `);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/", requireAuth, requireRole("admin", "organizer"), async (req, res, next) => {
  const client = await db.connect();
  try {
    const { sport_id, event_name, home_team, away_team, venue, event_date,
      description, image_url, ticket_types = [] } = req.body;

    if (!event_name || !venue || !event_date || !Array.isArray(ticket_types) || !ticket_types.length) {
      return res.status(400).json({ error: "Event name, venue, date and at least one ticket type are required." });
    }

    await client.query("BEGIN");
    const eventResult = await client.query(
      `INSERT INTO events(sport_id,event_name,home_team,away_team,venue,event_date,
       description,image_url,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,'published') RETURNING *`,
      [sport_id || null, event_name, home_team || null, away_team || null,
       venue, event_date, description || null, image_url || null]
    );
    const event = eventResult.rows[0];

    for (const t of ticket_types) {
      const price = Number(t.price), quantity = Number(t.quantity);
      if (!t.ticket_name || !Number.isFinite(price) || price < 0 ||
          !Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Each ticket type needs a name, non-negative price and positive quantity.");
      }
      await client.query(
        `INSERT INTO ticket_types(event_id,ticket_name,price,total_quantity,available_quantity)
         VALUES($1,$2,$3,$4,$4)`,
        [event.id, t.ticket_name, price, quantity]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ event });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.message.startsWith("Each ticket")) return res.status(400).json({ error: error.message });
    next(error);
  } finally { client.release(); }
});

module.exports = router;
