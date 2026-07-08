const express = require("express");
const router = express.Router();

const auth =
require("../middleware/auth");

const roles =
require("../middleware/roles");
const dashboardController =
require("../controllers/dashboardController");

router.get("/", (req, res) => {

    res.render("index");

});

router.get("/dashboard", dashboardController.dashboard);
module.exports = router;