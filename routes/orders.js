const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.post("/", requireAuth, async (req, res, next) => {
  const client = await db.connect();
  try {
    const ticketTypeId = Number(req.body.ticket_type_id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(ticketTypeId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: "Choose a valid ticket type and quantity (1–10)." });
    }

    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT tt.*, e.event_date, e.status AS event_status
       FROM ticket_types tt JOIN events e ON e.id=tt.event_id
       WHERE tt.id=$1 FOR UPDATE OF tt`,
      [ticketTypeId]
    );
    const type = rows[0];
    if (!type || type.event_status !== "published" ||
        new Date(type.event_date) <= new Date() || type.available_quantity < quantity) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This ticket is unavailable." });
    }

    const total = Number(type.price) * quantity;
    const orderResult = await client.query(
      "INSERT INTO orders(user_id,total_amount,status) VALUES($1,$2,'pending') RETURNING *",
      [req.user.id, total]
    );
    const order = orderResult.rows[0];
    await client.query(
      "INSERT INTO order_items(order_id,ticket_type_id,quantity,unit_price) VALUES($1,$2,$3,$4)",
      [order.id, ticketTypeId, quantity, type.price]
    );
    await client.query(
      "UPDATE ticket_types SET available_quantity=available_quantity-$1 WHERE id=$2",
      [quantity, ticketTypeId]
    );
    await client.query("COMMIT");
    res.status(201).json({
      message: "Order created. Complete payment to receive your tickets.",
      order
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally { client.release(); }
});

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, json_agg(json_build_object(
        'ticket_name',tt.ticket_name,'quantity',oi.quantity,'event_name',e.event_name
      )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id=o.id
       JOIN ticket_types tt ON tt.id=oi.ticket_type_id
       JOIN events e ON e.id=tt.event_id
       WHERE o.user_id=$1
       GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

module.exports = router;
