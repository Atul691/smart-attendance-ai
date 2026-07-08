const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "uploads/"
});

const studentController =
require("../controllers/studentController");

router.get("/", (req, res) => {
  res.send("Students Route Working");
});

router.post(
  "/register",
  upload.single("photo"),
  studentController.registerStudent
);
// =============================
// Student List
// =============================
router.get(
    "/list",
    studentController.studentList
);

// =============================
// View Student
// =============================
router.get(
    "/view/:id",
    studentController.viewStudent
);

// =============================
// Edit Student
// =============================
router.get(
    "/edit/:id",
    studentController.editStudent
);

// =============================
// Update Student
// =============================
router.post(
    "/update/:id",
    studentController.updateStudent
);

// =============================
// Delete Student
// =============================
router.get(
    "/delete/:id",
    studentController.deleteStudent
);
// =============================
// Student Profile
// =============================
router.get(
    "/profile/:id",
    studentController.studentProfile
);
router.get(
    "/pdf/:id",
    studentController.downloadStudentPDF
);
module.exports = router;