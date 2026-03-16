const express = require("express");
const cors = require("cors");
const resumeRoutes = require("./routes/resumeRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/resume", resumeRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;