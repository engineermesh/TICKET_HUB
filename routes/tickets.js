const express = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT t.ticket_code,t.status,t.issued_at,e.event_name,e.venue,e.event_date,
              tt.ticket_name, t.qr_token
       FROM tickets t
       JOIN order_items oi ON oi.id=t.order_item_id
       JOIN orders o ON o.id=oi.order_id
       JOIN ticket_types tt ON tt.id=oi.ticket_type_id
       JOIN events e ON e.id=tt.event_id
       WHERE o.user_id=$1 AND o.status='paid'
       ORDER BY t.issued_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/verify", requireAuth, requireRole("admin", "inspector"), async (req, res, next) => {
  const token = req.body.qr_token;
  if (!token) return res.status(400).json({ error: "QR token is required." });
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT t.id,t.status,e.event_name,e.event_date,tt.ticket_name,o.status AS order_status
       FROM tickets t
       JOIN order_items oi ON oi.id=t.order_item_id
       JOIN orders o ON o.id=oi.order_id
       JOIN ticket_types tt ON tt.id=oi.ticket_type_id
       JOIN events e ON e.id=tt.event_id
       WHERE t.qr_token=$1 FOR UPDATE OF t`,
      [token]
    );
    const ticket = result.rows[0];
    if (!ticket || ticket.order_status !== "paid" || ticket.status !== "valid") {
      await client.query("ROLLBACK");
      return res.status(409).json({ valid: false, error: "Ticket is invalid, unpaid or already used." });
    }
    await client.query("UPDATE tickets SET status='used' WHERE id=$1", [ticket.id]);
    await client.query(
      "INSERT INTO check_ins(ticket_id,inspector_id) VALUES($1,$2)",
      [ticket.id, req.user.id]
    );
    await client.query("COMMIT");
    res.json({ valid: true, message: "Ticket accepted.", event: ticket.event_name });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally { client.release(); }
});

module.exports = router;
