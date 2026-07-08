const db = require("../config/db");
const bcrypt = require("bcrypt");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
// =============================
// Teacher Dashboard
// =============================
exports.dashboard = async (req, res) => {

    try {

        const totalStudents = await db.query(
            "SELECT COUNT(*) FROM students"
        );

        const approvedStudents = await db.query(
            "SELECT COUNT(*) FROM students WHERE approval_status='approved'"
        );

        const pendingStudents = await db.query(
            "SELECT COUNT(*) FROM students WHERE approval_status='pending'"
        );

        res.render("teacher/dashboard", {
            totalStudents:
                totalStudents.rows[0].count,

            approvedStudents:
                approvedStudents.rows[0].count,

            pendingStudents:
                pendingStudents.rows[0].count
        });

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Pending Students
// =============================
exports.getPendingStudents = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM students
            WHERE approval_status='pending'
            ORDER BY id DESC
        `);

        res.render(
            "teacher/pendingStudents",
            {
                students: result.rows
            }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Approve Student
// =============================
exports.approveStudent = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            `
            UPDATE students
            SET approval_status='approved'
            WHERE id=$1
            `,
            [id]
        );

        res.redirect("/teacher/pending");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Reject Student
// =============================
exports.rejectStudent = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM students WHERE id=$1",
            [id]
        );

        res.redirect("/teacher/pending");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Approved Students
// =============================
exports.approvedStudents = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM students
            WHERE approval_status='approved'
            ORDER BY id DESC
        `);

        res.render(
            "teacher/approvedStudents",
            {
                students: result.rows
            }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Student Details
// =============================
exports.studentDetails = async (req, res) => {

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

        res.render(
            "teacher/studentDetails",
            {
                student: result.rows[0]
            }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Search Student
// =============================
exports.searchStudent = async (req, res) => {

    try {

        const { erp } = req.query;

        const result = await db.query(
            `
            SELECT *
            FROM students
            WHERE erp_id=$1
            `,
            [erp]
        );

        res.json(result.rows);

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =======================
// All Students
// =======================
exports.allStudents = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM students
            ORDER BY id DESC
        `);

        res.render(
            "teacher/allStudents",
            {
                students: result.rows
            }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =======================
// Export Excel
// =======================
exports.exportExcel = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM students
            ORDER BY id DESC
        `);

        const workbook = new ExcelJS.Workbook();

        const worksheet =
        workbook.addWorksheet("Students");

        worksheet.columns = [

            {
                header: "ERP ID",
                key: "erp_id"
            },

            {
                header: "Name",
                key: "name"
            },

            {
                header: "Department",
                key: "department"
            },

            {
                header: "Status",
                key: "approval_status"
            }

        ];

        result.rows.forEach(student => {
            worksheet.addRow(student);
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=students.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =======================
// Export PDF
// =======================
exports.exportPDF = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM students
            ORDER BY id DESC
        `);

        const doc = new PDFDocument();

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=students.pdf"
        );

        doc.pipe(res);

        doc.fontSize(20)
        .text("Student Report");

        doc.moveDown();

        result.rows.forEach(student => {

            doc.text(
                `${student.erp_id} | ${student.name} | ${student.department} | ${student.approval_status}`
            );

        });

        doc.end();

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Register Teacher
// =============================
exports.registerTeacher = async (req, res) => {

    try {

        const {
            teacher_id,
            name,
            email,
            department,
            designation,
            phone,
            password
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
            INSERT INTO teachers
            (
                teacher_id,
                name,
                email,
                department,
                designation,
                phone,
                password
            )
            VALUES($1,$2,$3,$4,$5,$6,$7)
            `,
            [
                teacher_id,
                name,
                email,
                department,
                designation,
                phone,
                hashedPassword
            ]
        );

        res.redirect("/teacher/list");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Teacher List
// =============================
exports.teacherList = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM teachers
            ORDER BY id DESC
        `);

        res.render(
            "teacher/teacherList",
            {
                teachers: result.rows
            }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// View Teacher
// =============================
exports.viewTeacher = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(

            `
            SELECT *
            FROM teachers
            WHERE id=$1
            `,

            [id]

        );

        res.render(

            "teacher/viewTeacher",

            {

                teacher: result.rows[0]

            }

        );

    } catch (error) {

        console.log(error);

        res.send(error.message);

    }

};
// =============================
// Edit Teacher
// =============================
exports.editTeacher = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(

            `
            SELECT *
            FROM teachers
            WHERE id=$1
            `,

            [id]

        );

        res.render("teacher/editTeacher", {

            teacher: result.rows[0]

        });

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// =============================
// Update Teacher
// =============================
exports.updateTeacher = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            teacher_id,
            name,
            email,
            department,
            designation,
            phone
        } = req.body;

        await db.query(

            `
            UPDATE teachers
            SET
                teacher_id=$1,
                name=$2,
                email=$3,
                department=$4,
                designation=$5,
                phone=$6
            WHERE id=$7
            `,

            [
                teacher_id,
                name,
                email,
                department,
                designation,
                phone,
                id
            ]

        );

        res.redirect("/teacher/list");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Delete Teacher
// =============================
exports.deleteTeacher = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            `
            DELETE FROM teachers
            WHERE id=$1
            `,
            [id]
        );

        res.redirect("/teacher/list");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Teacher Login
// =============================
const jwt = require("jsonwebtoken");

exports.loginTeacher = async (req, res) => {

    try {

        const { email, password } = req.body;

        const result = await db.query(
            `
            SELECT *
            FROM teachers
            WHERE email=$1
            `,
            [email]
        );

        if (result.rows.length === 0) {

            return res.send("Invalid Email");

        }

        const teacher = result.rows[0];
        console.log("Password from Form:", password);
console.log("Password from DB:", teacher.password);
console.log(teacher);

        const validPassword = await bcrypt.compare(
            password,
            teacher.password
        );

        if (!validPassword) {

            return res.send("Invalid Password");

        }

        const token = jwt.sign(

            {
                id: teacher.id,
                role: "teacher"
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }

        );

       res.cookie(

    "token",

    token,

    {

        httpOnly:true,

        maxAge:24*60*60*1000

    }

);

res.redirect("/teacher/dashboard");

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// =============================
// Logout Teacher
// =============================
exports.logoutTeacher = (req, res) => {

    res.clearCookie("token");

    res.redirect("/teacher/login");

};
// =============================
// Attendance Analytics
// =============================
exports.attendanceAnalytics = async (req, res) => {

    try {

        // Today's Attendance
        const todayAttendance = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance
            WHERE attendance_date = CURRENT_DATE
        `);

        // Total Attendance Records
        const totalAttendance = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance
        `);

        // Low Attendance (<75%)
        const lowAttendance = await db.query(`
            SELECT
                s.erp_id,
                s.name,
                COUNT(a.id) AS present_days
            FROM students s
            LEFT JOIN attendance a
            ON s.id = a.student_id
            GROUP BY s.id
            ORDER BY present_days ASC
            LIMIT 5
        `);

        // Top Regular Students
        const topStudents = await db.query(`
            SELECT
                s.erp_id,
                s.name,
                COUNT(a.id) AS present_days
            FROM students s
            JOIN attendance a
            ON s.id = a.student_id
            GROUP BY s.id
            ORDER BY present_days DESC
            LIMIT 5
        `);

        res.json({

            todayAttendance:
                todayAttendance.rows[0].total,

            totalAttendance:
                totalAttendance.rows[0].total,

            lowAttendance:
                lowAttendance.rows,

            topStudents:
                topStudents.rows

        });

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
