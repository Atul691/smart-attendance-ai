const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const db = require("../config/db");
// ==================================
// ==================================
// Mark Attendance
// ==================================
exports.markAttendance = async (req, res) => {

    try {

        const { student_id } = req.body;

        const alreadyMarked = await db.query(
            `
            SELECT *
            FROM attendance
            WHERE student_id=$1
            AND attendance_date=CURRENT_DATE
            `,
            [student_id]
        );

        if (alreadyMarked.rows.length > 0) {

            return res.json({
                success: false,
                message: "Attendance already marked"
            });

        }

        // Attendance Insert
        const attendanceResult = await db.query(
            `
            INSERT INTO attendance(student_id)
            VALUES($1)
            RETURNING *
            `,
            [student_id]
        );

        // Student Details
        const studentResult = await db.query(
            `
            SELECT id,name,erp_id
            FROM students
            WHERE id=$1
            `,
            [student_id]
        );

        const attendance = attendanceResult.rows[0];
        const student = studentResult.rows[0];

      const istTime = new Date(attendance.attendance_time).toLocaleTimeString(
    "en-IN",
    {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }
);

res.json({

    success: true,

    message: "Attendance Marked",

    student: student,

    time: istTime,

    date: attendance.attendance_date,

    status: attendance.status

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
// Today's Attendance
// ==================================
exports.todayAttendance = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT
            attendance.*,
            students.name,
            students.erp_id
            FROM attendance
            JOIN students
            ON students.id = attendance.student_id
            WHERE attendance_date = CURRENT_DATE
            ORDER BY attendance_time DESC
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// Attendance Report Page
// ==================================
exports.attendanceReport = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT
            attendance.*,
            students.name,
            students.erp_id
            FROM attendance
            JOIN students
            ON students.id = attendance.student_id
            ORDER BY attendance_time DESC
            `
        );

        res.render(
            "attendance/report",
            {
                attendance: result.rows
            }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// Attendance Dashboard
// ==================================
exports.dashboard = async (req, res) => {

    try {

        const totalStudentsResult =
            await db.query(
                "SELECT COUNT(*) FROM students"
            );

        const presentResult =
            await db.query(`
                SELECT COUNT(*)
                FROM attendance
                WHERE attendance_date = CURRENT_DATE
            `);

        const totalStudents =
            Number(totalStudentsResult.rows[0].count);

        const presentToday =
            Number(presentResult.rows[0].count);

        const absentToday =
            totalStudents - presentToday;

        const percentage =
            totalStudents === 0
                ? 0
                : (
                    (presentToday / totalStudents) * 100
                ).toFixed(1);

        res.json({

            totalStudents,

            presentToday,

            absentToday,

            percentage

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};
// ==================================
// Export Attendance Excel
// ==================================
exports.exportExcel = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
            attendance.*,
            students.name,
            students.erp_id
            FROM attendance
            JOIN students
            ON students.id = attendance.student_id
            ORDER BY attendance_time DESC
        `);

        const workbook =
        new ExcelJS.Workbook();

        const worksheet =
        workbook.addWorksheet("Attendance");

        worksheet.columns = [

            {
                header: "ERP ID",
                key: "erp_id",
                width: 20
            },

            {
                header: "Name",
                key: "name",
                width: 30
            },

            {
                header: "Date",
                key: "attendance_date",
                width: 20
            },

            {
                header: "Status",
                key: "status",
                width: 15
            }

        ];

        result.rows.forEach(record => {

            worksheet.addRow({
                erp_id: record.erp_id,
                name: record.name,
                attendance_date:
                record.attendance_date,
                status: record.status
            });

        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=attendance.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};

// ==================================
// Export Attendance PDF
// ==================================
exports.exportPDF = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
            attendance.*,
            students.name,
            students.erp_id
            FROM attendance
            JOIN students
            ON students.id = attendance.student_id
            ORDER BY attendance_time DESC
        `);

        const doc =
        new PDFDocument();

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=attendance.pdf"
        );

        doc.pipe(res);

        doc
        .fontSize(20)
        .text("Attendance Report");

        doc.moveDown();

        result.rows.forEach(record => {

            doc.text(
                `${record.erp_id} | ${record.name} | ${record.attendance_date} | ${record.status}`
            );

        });

        doc.end();

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

};
// ==================================
// Get Approved Students
// ==================================
exports.getApprovedStudents = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                id,
                name,
                erp_id,
                photo_url
            FROM students
            WHERE approval_status = 'approved'
            ORDER BY id ASC
        `);

        res.json(result.rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};