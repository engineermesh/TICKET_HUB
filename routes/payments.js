const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { isConfigured } = require("../services/mpesaService");
const { issueTickets } = require("../services/ticketService");
const router = express.Router();

/*
 * This endpoint intentionally does not pretend to process a real payment.
 * Connect the official Daraja STK Push flow and authenticated callback here.
 */
router.post("/stk-push", requireAuth, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error: "M-Pesa is not configured yet. Add authorized Daraja sandbox credentials to .env."
    });
  }
  return res.status(501).json({
    error: "Daraja credentials detected, but the STK Push and callback integration must be completed and tested before accepting payments."
  });
});

/*
 * Development-only manual confirmation is deliberately disabled.
 * Never expose an endpoint that lets a browser mark an order as paid.
 */
router.post("/callback", (req, res) => {
  res.status(501).json({ error: "Configure and secure the official Daraja callback before use." });
});

module.exports = router;
