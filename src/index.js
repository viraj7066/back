require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quoteRoutes = require("./routes/quoteRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // ✅ Support for form data

// ✅ Serve uploaded files statically so admins can access 3D models
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Authentication Routes
app.use("/api/auth", authRoutes);

// ✅ Quote Request Routes
app.use("/api/quotes", quoteRoutes);

// ✅ Test route to check if backend is working
app.get("/", (req, res) => {
  res.send("✅ Backend is working!");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
