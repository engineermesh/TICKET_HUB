/*
 * M-Pesa Daraja integration placeholder.
 * Add the official Daraja OAuth + STK Push implementation after creating
 * your own authorized Daraja sandbox application. Never trust a browser
 * response as proof of payment; only verified provider callbacks can mark
 * an order paid.
 */
function isConfigured() {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_SHORTCODE &&
    process.env.MPESA_PASSKEY &&
    process.env.MPESA_CALLBACK_URL
  );
}

module.exports = { isConfigured };
