const authTeacher = require("../middleware/authTeacher");
const express = require("express");
const router = express.Router();

const attendanceController =
require("../controllers/attendanceController");

// Dashboard
router.get("/dashboard", (req, res) => {

    res.render("attendance/dashboard");

});
//Analytics
router.get(
    "/analytics",
    attendanceController.dashboard
);
// Camera Page
router.get(
    "/camera",
    authTeacher,
    (req, res) => {
        res.render("attendance/camera");
    }
);

// Approved Students API
router.get(
    "/approved-students",
    attendanceController.getApprovedStudents
);

// Mark Attendance
router.post(
    "/mark",
    attendanceController.markAttendance
);

// Today's Attendance
router.get(
    "/today",
    authTeacher,
    attendanceController.todayAttendance
);

// Attendance Report
router.get(
    "/report",
    authTeacher,
    attendanceController.attendanceReport
);

// Export Excel
router.get(
    "/export/excel",
    authTeacher,
    attendanceController.exportExcel
);

// Export PDF
router.get(
    "/export/pdf",
    authTeacher,
    attendanceController.exportPDF
);

module.exports = router;