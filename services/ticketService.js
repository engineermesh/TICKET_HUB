const crypto = require("crypto");
const QRCode = require("qrcode");

async function issueTickets(client, orderId) {
  const { rows: items } = await client.query(
    "SELECT id, quantity FROM order_items WHERE order_id = $1",
    [orderId]
  );

  const issued = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const token = crypto.randomBytes(32).toString("hex");
      const { rows } = await client.query(
        `INSERT INTO tickets(order_item_id, qr_token)
         VALUES($1, $2)
         RETURNING id, ticket_code, qr_token, status`,
        [item.id, token]
      );
      const ticket = rows[0];
      ticket.qr_data_url = await QRCode.toDataURL(
        JSON.stringify({ ticket: ticket.ticket_code, token: ticket.qr_token })
      );
      issued.push(ticket);
    }
  }
  return issued;
}

module.exports = { issueTickets };
