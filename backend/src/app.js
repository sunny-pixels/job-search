require('dotenv').config(); // Load env variables

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const resumeRoutes = require("./routes/resumeRoutes");
const appliedJobRoutes = require("./routes/appliedJobRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
    console.log("❌ MongoDB Connection Failed:", err.message);
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/resume", resumeRoutes);
app.use("/api/applied-jobs", appliedJobRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;