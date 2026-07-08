const video = document.getElementById("video");
const status = document.getElementById("status");
const successSound = new Audio("/sounds/success.mp3");
const attendanceTable =
    document.querySelector("#attendanceTable tbody");
    const searchAttendance =
document.getElementById("searchAttendance");
    const pieCanvas =
document.getElementById("attendancePie");

const barCanvas =
document.getElementById("attendanceBar");

let pieChart;
let barChart;
    const totalStudents =
    document.getElementById("totalStudents");

const presentToday =
    document.getElementById("presentToday");

const absentToday =
    document.getElementById("absentToday");

const attendancePercentage =
    document.getElementById("attendancePercentage");

let labeledFaceDescriptors = [];
let faceMatcher = null;
let markedStudents = [];
// ==========================
// Load Models
// ==========================
async function loadModels() {

    await Promise.all([

        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models")

    ]);

    console.log("✅ Models Loaded");

    await loadLabeledImages();

    startVideo();

}

// ==========================
// Start Camera
// ==========================

function startVideo() {

    navigator.mediaDevices
        .getUserMedia({
            video: true
        })
        .then(stream => {

            video.srcObject = stream;

        })
        .catch(err => {

            console.log(err);

        });

}

// ==========================
// Load Approved Students
// ==========================
async function loadLabeledImages() {

    const response =
        await fetch("/attendance/approved-students");

    const students =
        await response.json();

    console.log("Approved Students:", students);

    const descriptors = [];

    for (const student of students) {

        console.log("Loading:", student.name);

        try {

            const img =
                await faceapi.fetchImage(student.photo_url);
                console.log("Photo URL:", student.photo_url);
console.log("Image Size:", img.width, img.height);

          const detection = await faceapi
    .detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.2
        })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
            if (!detection) {

                console.log("❌ No Face Found:", student.name);
                continue;

            }

           const label = `${student.id}|${student.name}`;

descriptors.push(

    new faceapi.LabeledFaceDescriptors(

        label,

        [detection.descriptor]

    )

);

            console.log("✅ Descriptor Created:", student.name);

        } catch (err) {

            console.log(err);

        }

    }

    labeledFaceDescriptors = descriptors;
    console.log("Total Descriptors:", descriptors.length);

    if (descriptors.length > 0) {

        faceMatcher = new faceapi.FaceMatcher(
            descriptors,
            0.55
        );

        console.log("✅ Face Matcher Ready");

    } else {

        console.log("❌ No Valid Faces Found");

    }

}
async function markAttendance(studentId) {

    try {

        const response = await fetch("/attendance/mark", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                student_id: studentId
            })

        });

  const data = await response.json();

console.log(data);

console.log(data.message);

if (data.success) {

    addAttendanceRow(data);

    loadDashboard();

}
    } catch (err) {

        console.log(err);

    }

}
function addAttendanceRow(data) {
    console.log("✅ addAttendanceRow Called");
console.log(data);

    const row = document.createElement("tr");

    row.innerHTML = `

        <td>${data.student.name}</td>

        <td>${data.student.erp_id}</td>

        <td>${data.time}</td>

        <td style="color:green;font-weight:bold;">

            ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}

        </td>

    `;

    attendanceTable.prepend(row);

}
async function loadDashboard() {

    const response =
        await fetch("/attendance/dashboard");

    const data =
        await response.json();

    totalStudents.innerHTML =
        data.totalStudents;

    presentToday.innerHTML =
        data.presentToday;

    absentToday.innerHTML =
        data.absentToday;

    attendancePercentage.innerHTML =
        data.percentage + "%";
        updateCharts(
    data.presentToday,
    data.absentToday
);

}
function updateCharts(present, absent) {

    // ================= Pie Chart =================

    if (!pieChart) {

        pieChart = new Chart(pieCanvas, {

            type: "doughnut",

            data: {

                labels: ["Present", "Absent"],

                datasets: [{

                    data: [present, absent],

                    backgroundColor: [

                        "#28a745",

                        "#dc3545"

                    ],

                    borderWidth: 2

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

    } else {

        pieChart.data.datasets[0].data = [

            present,

            absent

        ];

        pieChart.update();

    }

    // ================= Bar Chart =================

    if (!barChart) {

        barChart = new Chart(barCanvas, {

            type: "bar",

            data: {

                labels: ["Present", "Absent"],

                datasets: [{

                    label: "Students",

                    data: [present, absent],

                    backgroundColor: [

                        "#28a745",

                        "#dc3545"

                    ]

                }]

            },

            options: {

                responsive: true,

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        });

    } else {

        barChart.data.datasets[0].data = [

            present,

            absent

        ];

        barChart.update();

    }

}

loadModels();
loadDashboard();


setInterval(() => {

    loadDashboard();

},5000);

video.addEventListener("play", () => {
   const oldCanvas = document.querySelector("#video-container canvas");

if (oldCanvas) {
    oldCanvas.remove();
}

const canvas = faceapi.createCanvasFromMedia(video);

document
    .getElementById("video-container")
    .append(canvas);

   const displaySize = {
    width: video.videoWidth,
    height: video.videoHeight
};

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {

    const detections = await faceapi
    .detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.2
        })
    )
    .withFaceLandmarks()
    .withFaceDescriptors();
        const resizedDetections =
    faceapi.resizeResults(
        detections,
        displaySize
    );

const ctx =
    canvas.getContext("2d");

ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
);

if (faceMatcher) {

    const results =
        resizedDetections.map(d =>
            faceMatcher.findBestMatch(d.descriptor)
        );
console.log("Face Results:", results);
    results.forEach((result, i) => {

        const box =
            resizedDetections[i].detection.box;

        let label = result.label;
        console.log("Label:", result.label);
console.log("Distance:", result.distance);

        if (label !== "unknown" && result.distance <= 0.55) {

            const parts = label.split("|");

            const studentId = parts[0];
            const studentName = parts[1];

            label = studentName;

            if (!markedStudents.includes(studentId)) {

                markedStudents.push(studentId);

                markAttendance(studentId);
                successSound.play();

                status.innerHTML =
    `🎉 Welcome ${studentName}`;
    const speech = new SpeechSynthesisUtterance();

speech.text =
`Welcome ${studentName}. Your attendance has been marked successfully.`;

speech.lang = "en-IN";

speech.rate = 1;

speech.pitch = 1;

window.speechSynthesis.cancel();

window.speechSynthesis.speak(speech);

setTimeout(() => {

    status.innerHTML = "";

}, 3000);

            }

        } else {

            label = "Unknown";

            status.innerHTML =
    "❌ Face Not Registered";

setTimeout(() => {

    status.innerHTML = "";

}, 2000);

        }

        const confidence =
            ((1 - result.distance) * 100).toFixed(1);

        const drawBox =
            new faceapi.draw.DrawBox(box, {

                label:
                    `${label} (${confidence}%)`,

                boxColor:
                    result.label === "unknown"
                        ? "red"
                        : "green"

            });

        drawBox.draw(canvas);

    });

}
}, 1000);

});
function updateClock(){

    const now = new Date();

    document.getElementById("liveClock").innerHTML =
        now.toLocaleString("en-IN",{
            dateStyle:"full",
            timeStyle:"medium"
        });

}

updateClock();

setInterval(updateClock,1000);
    searchAttendance.addEventListener("keyup", () => {

    const value =
        searchAttendance.value.toLowerCase();

    const rows =
        attendanceTable.querySelectorAll("tr");

    rows.forEach(row => {

        searchAttendance.addEventListener("keyup", () => {

    const value = searchAttendance.value.toLowerCase();

    const rows = attendanceTable.querySelectorAll("tr");

    rows.forEach(row => {

        const text = row.innerText.toLowerCase();

        row.style.display = text.includes(value) ? "" : "none";

    });

});

        if (text.includes(value)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

});