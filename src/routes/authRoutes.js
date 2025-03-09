const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Ensure this is in your .env

// ✅ User Registration Route (with phone number)
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .isMobilePhone()
      .withMessage("Valid phone number is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    try {
      // ✅ Check if email already exists
      const [existingEmailUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (existingEmailUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // ✅ Check if phone number already exists
      const [existingPhoneUser] = await db.query("SELECT * FROM users WHERE phone = ?", [phone]);
      if (existingPhoneUser.length > 0) {
        return res.status(400).json({ error: "Phone number already registered" });
      }

      // ✅ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Insert new user (including phone)
      const [result] = await db.query(
        "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
        [name, email, phone, hashedPassword]
      );

      if (result.affectedRows === 1) {
        res.status(201).json({ message: "User registered successfully" });
      } else {
        res.status(500).json({ error: "User registration failed" });
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ✅ User Login Route (with detailed logging)
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // ✅ Check if user exists
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      console.log("Database Query Result:", users); // Log the result

      if (users.length === 0) {
        console.log("User not found for email:", email); // Log the email
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const user = users[0];
      console.log("User found:", user); // Log the user

      // ✅ Check password
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Password Match Result:", isMatch); // Log the result

      if (!isMatch) {
        console.log("Password does not match for email:", email); // Log the email
        return res.status(400).json({ error: "Invalid email or password" });
      }

      // ✅ Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
      console.log("Token generated:", token); // Log the token

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      });
    } catch (error) {
      console.error("❌ Login error:", error); // Log the error
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ✅ Fetch all users
router.get("/users", async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;