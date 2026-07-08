const PDFDocument = require("pdfkit");
const db = require("../config/db");
const cloudinary = require("../config/cloudinary");

exports.registerStudent = async (req, res) => {

  try {

    const {
      erp_id,
      name,
      email,
      department,
      semester
    } = req.body;

    let photo_url = "";

    if (req.file) {

      const uploadResult =
      await cloudinary.uploader.upload(
        req.file.path,
        {
          folder: "attendance_faces"
        }
      );

      photo_url =
      uploadResult.secure_url;
    }

    const result =
    await db.query(
      `
      INSERT INTO students
      (
        erp_id,
        name,
        email,
        department,
        semester,
        photo_url
      )
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        erp_id,
        name,
        email,
        department,
        semester,
        photo_url
      ]
    );

    res.json({
      success: true,
      student: result.rows[0]
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};
// ==================================
// Student List
// ==================================
exports.studentList = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM students
            ORDER BY id DESC
        `);

        res.render("student/index", {
            students: result.rows
        });

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// View Student
// ==================================
exports.viewStudent = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(
            `
            SELECT *
            FROM students
            WHERE id=$1
            `,
            [id]
        );

        res.render("student/view", {
            student: result.rows[0]
        });

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// Delete Student
// ==================================
exports.deleteStudent = async (req, res) => {

    try {

        const { id } = req.params;

        // Delete attendance first
        await db.query(
            `
            DELETE FROM attendance
            WHERE student_id=$1
            `,
            [id]
        );

        // Delete student
        await db.query(
            `
            DELETE FROM students
            WHERE id=$1
            `,
            [id]
        );

        res.redirect("/api/students/list");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// Edit Student Page
// ==================================
exports.editStudent = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(
            `
            SELECT *
            FROM students
            WHERE id=$1
            `,
            [id]
        );

        res.render("student/edit", {
            student: result.rows[0]
        });

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// Update Student
// ==================================
exports.updateStudent = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            erp_id,
            name,
            email,
            department,
            semester,
            approval_status
        } = req.body;

        await db.query(
            `
            UPDATE students
            SET
            erp_id=$1,
            name=$2,
            email=$3,
            department=$4,
            semester=$5,
            approval_status=$6
            WHERE id=$7
            `,
            [
                erp_id,
                name,
                email,
                department,
                semester,
                approval_status,
                id
            ]
        );

        res.redirect("/students");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Student Profile
// =============================
exports.studentProfile = async (req, res) => {

    try {

        const { id } = req.params;

        // Student Details
        const student = await db.query(
            `
            SELECT *
            FROM students
            WHERE id=$1
            `,
            [id]
        );

        // Attendance History
        const attendance = await db.query(
            `
            SELECT *
            FROM attendance
            WHERE student_id=$1
            ORDER BY attendance_date DESC
            `,
            [id]
        );

        // Present Count
        const present = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM attendance
            WHERE student_id=$1
            `,
            [id]
        );
        // Total Attendance Records
const totalAttendance = await db.query(`
    SELECT COUNT(*) AS total
    FROM attendance
`);

// Last Attendance
const lastAttendance = await db.query(`
    SELECT attendance_date,
           attendance_time
    FROM attendance
    WHERE student_id=$1
    ORDER BY attendance_date DESC,
             attendance_time DESC
    LIMIT 1
`, [id]);

const presentCount =
parseInt(present.rows[0].total);

const totalDays =
parseInt(totalAttendance.rows[0].total);

const absentCount =
Math.max(totalDays - presentCount, 0);

const percentage =
totalDays === 0
?
0
:
((presentCount / totalDays) * 100).toFixed(1);

        res.render("student/profile", {

    student: student.rows[0],

    attendance: attendance.rows,

    present: presentCount,

    absent: absentCount,

    percentage: percentage,

    lastAttendance:
    lastAttendance.rows[0]

});

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Download Student PDF
// =============================
exports.downloadStudentPDF = async (req, res) => {

    try {

        const { id } = req.params;

        const student = await db.query(
            "SELECT * FROM students WHERE id=$1",
            [id]
        );

        const attendance = await db.query(
            `
            SELECT attendance_date,
                   attendance_time,
                   status
            FROM attendance
            WHERE student_id=$1
            ORDER BY attendance_date DESC
            `,
            [id]
        );

        const doc = new PDFDocument();

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${student.rows[0].name}.pdf`
        );

        doc.pipe(res);

        doc.fontSize(22).text("Student Attendance Report");

        doc.moveDown();

        doc.fontSize(14).text(`Name : ${student.rows[0].name}`);
        doc.text(`ERP ID : ${student.rows[0].erp_id}`);
        doc.text(`Email : ${student.rows[0].email}`);
        doc.text(`Department : ${student.rows[0].department}`);
        doc.text(`Semester : ${student.rows[0].semester}`);

        doc.moveDown();

        doc.fontSize(18).text("Attendance History");

        doc.moveDown();

        attendance.rows.forEach(item => {

            doc.fontSize(12).text(

                `${item.attendance_date} | ${item.attendance_time} | ${item.status}`

            );

        });

        doc.end();

    } catch (error) {

        console.log(error);

        res.send(error.message);

    }

};