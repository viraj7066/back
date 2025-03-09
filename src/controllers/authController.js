const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length > 0) return res.status(400).json({ message: "User already exists" });

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: err.message });

      // Insert user into database
      db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hash], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "User registered successfully" });
      });
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(400).json({ message: "Invalid email or password" });

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ message: "Login successful", token });
    });
  });
};
