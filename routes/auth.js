const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !phone || !password || password.length < 8) {
      return res.status(400).json({
        error: "Enter your name, email, phone and a password of at least 8 characters."
      });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users(full_name,email,phone,password_hash)
       VALUES($1,$2,$3,$4)
       RETURNING id,full_name,email,phone,role`,
      [full_name.trim(), email.toLowerCase().trim(), phone.trim(), password_hash]
    );
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Email already registered." });
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [(email || "").toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

module.exports = router;
