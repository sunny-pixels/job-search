require('dotenv').config(); // Load env variables

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const appliedJobRoutes = require("./routes/appliedJobRoutes");
const embeddingResumeRoutes = require("./routes/embeddingResumeRoutes"); // Embedding-based routes
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ✅ MongoDB Connection with proper options
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
    console.log("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Exit if MongoDB fails
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Health check endpoint (doesn't require MongoDB)
app.get("/health", (req, res) => {
    res.json({ 
        status: "ok", 
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected" 
    });
});

// Routes
app.use("/api/applied-jobs", appliedJobRoutes);
app.use("/api/embedding-matcher", embeddingResumeRoutes); // Embedding-based matching

// Error handling middleware
app.use(errorHandler);

module.exports = app;