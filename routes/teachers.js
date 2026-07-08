const authTeacher = require("../middleware/authTeacher");
const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
    dest: "uploads/"
});

const teacherController =
require("../controllers/teacherController");

// =============================
// Add Teacher Page
// =============================
router.get(
    "/add",
    (req,res)=>{

        res.render("teacher/addTeacher");

    }
);

// =============================
// Register Teacher
// =============================
router.post(
    "/register",
    upload.none(),
    teacherController.registerTeacher
);
 
// =============================
// Teacher List
// =============================
router.get(
    "/list",
    authTeacher,
    teacherController.teacherList
);
// =============================
// View Teacher
// =============================
router.get(

    "/view/:id",

    teacherController.viewTeacher

);
// =============================
// Edit Teacher
// =============================
router.get(
    "/edit/:id",
    teacherController.editTeacher
);

// =============================
// Update Teacher
// =============================
router.post(
    "/update/:id",
    teacherController.updateTeacher
);

// Dashboard
router.get(
    "/dashboard",
    authTeacher,
    teacherController.dashboard
);

// Pending Students
router.get(
    "/pending",
    authTeacher,
    teacherController.getPendingStudents
);

// Approved Students
router.get(
    "/approved",
    authTeacher,
    teacherController.approvedStudents
);

// All Students
router.get(
    "/students",
    authTeacher,
    teacherController.allStudents
);
// Student Details
router.get(
    "/student/:id",
    authTeacher,
    teacherController.studentDetails
);
// Search Student
router.get(
    "/search",
    authTeacher,
    teacherController.searchStudent
);

// Export Excel
router.get(
    "/export/excel",
    authTeacher,
    teacherController.exportExcel
);

// Export PDF
router.get(
    "/export/pdf",
    authTeacher,
    teacherController.exportPDF
);

// Approve Student
router.post(
    "/approve/:id",
    authTeacher,
    teacherController.approveStudent
);

// Reject Student
router.post(
    "/reject/:id",
    authTeacher,
    teacherController.rejectStudent
);
// =============================
// Delete Teacher
// =============================
router.get(
    "/delete/:id",
    authTeacher,
    teacherController.deleteTeacher
);
// =============================
// Teacher Login Page
// =============================
router.get("/login", (req, res) => {

    res.render("auth/teacherLogin");

});

// =============================
// Teacher Login
// =============================
router.post(

    "/login",

    teacherController.loginTeacher

);
// =============================
// Logout
// =============================
router.get(
    "/logout",
    teacherController.logoutTeacher
);
// =============================
// Attendance Analytics API
// =============================
router.get(
    "/analytics",
    authTeacher,
    teacherController.attendanceAnalytics
);

module.exports = router;