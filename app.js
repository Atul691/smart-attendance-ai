require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require("./routes/students");
const teacherRoutes = require("./routes/teachers");
const attendanceRoutes = require("./routes/attendance");

const app = express();

// =============================
// Middlewares
// =============================

// app.use(helmet());

app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

// =============================
// View Engine
// =============================

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

// =============================
// Home Page
// =============================

app.get("/", (req, res) => {

    res.render("index");

});

// =============================
// Student Registration Page
// =============================

app.get("/register", (req, res) => {

    res.render("auth/register");

});

// =============================
// Routes
// =============================

// Authentication API
app.use("/api/auth", authRoutes);

// Dashboard
app.use("/", dashboardRoutes);

// Student API
app.use("/api/students", studentRoutes);

// Teacher Panel
app.use("/teacher", teacherRoutes);

// Attendance
app.use("/attendance", attendanceRoutes);

// =============================
// 404 Page
// =============================

app.use((req, res) => {

    res.status(404).render("errors/404");

});

// =============================
// 500 Error
// =============================

app.use((err, req, res, next) => {

    console.error(err.stack);

    res.status(500).render("errors/500");

});

// =============================
// Server
// =============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("====================================");
    console.log(`🚀 Server Running : http://localhost:${PORT}`);
    console.log("====================================");

});