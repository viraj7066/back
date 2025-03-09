const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// Ensure the "uploads" directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Store uploaded files in "uploads/" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const upload = multer({ storage });

// Route to handle quote request submission
router.post("/submit-quote", upload.array("models"), (req, res) => {
  const { userId, userName, userMobile, ...quoteData } = req.body;
  const files = req.files;

  // Check if required fields are provided
  if (!userId || !userName || !userMobile || !files || files.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Prepare the data for insertion
  const quoteRequests = files.map((file, index) => {
    return {
      user_id: userId,
      user_name: userName,
      user_mobile: userMobile,
      material: quoteData[`material${index + 1}`],
      type: quoteData[`type${index + 1}`],
      color: quoteData[`color${index + 1}`],
      process: quoteData[`process${index + 1}`],
      units: quoteData[`units${index + 1}`],
      infill: quoteData[`infill${index + 1}`],
      quantity: quoteData[`quantity${index + 1}`],
      estimated_price: quoteData[`estimatedPrice${index + 1}`],
      model_filename: file.filename,
      model_path: "/uploads/" + file.filename,
    };
  });

  // Insert data into MySQL database
  const sql = `
    INSERT INTO quote_requests 
    (user_id, user_name, user_mobile, material, type, color, process, units, infill, quantity, estimated_price, model_filename, model_path)
    VALUES ?
  `;

  const values = quoteRequests.map((request) => [
    request.user_id,
    request.user_name,
    request.user_mobile,
    request.material,
    request.type,
    request.color,
    request.process,
    request.units,
    request.infill,
    request.quantity,
    request.estimated_price,
    request.model_filename,
    request.model_path,
  ]);

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting quote request:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(200).json({ message: "Quote request submitted successfully" });
  });
});

// ✅ Fetch all quote requests
router.get("/quote-requests", async (req, res) => {
  try {
    const [quoteRequests] = await db.query("SELECT * FROM quote_requests");
    res.status(200).json(quoteRequests);
  } catch (error) {
    console.error("Error fetching quote requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Route for Admins to Download 3D Models
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Send file for download
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ message: "Error downloading file" });
    }
  });
});

module.exports = router;