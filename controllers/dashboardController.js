const db = require("../config/db");

exports.dashboard = async (req, res) => {

    try {

        // Total Students
        const students = await db.query(`
            SELECT COUNT(*) AS total
            FROM students
        `);

        // Total Teachers


        // Present Today
        const attendance = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance
            WHERE attendance_date = CURRENT_DATE
        `);

        const totalStudents =
            Number(students.rows[0].total);

        const presentToday =
            Number(attendance.rows[0].total);

        const percentage =
            totalStudents === 0
                ? 0
                : ((presentToday / totalStudents) * 100).toFixed(1);

        // Recent Attendance
        const recentAttendance = await db.query(`
            SELECT
                s.name,
                a.attendance_time,
                a.status
            FROM attendance a
            JOIN students s
            ON s.id = a.student_id
            ORDER BY a.id DESC
            LIMIT 10
        `);

        res.render("dashboard/index", {

            totalStudents,

            totalTeachers: 0,

            presentToday,

            percentage,

            recentAttendance:
                recentAttendance.rows

        });

    } catch (err) {

        console.log(err);

        res.send(err.message);

    }

};