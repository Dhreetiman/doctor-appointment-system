const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");

router.post("/register", async (req, res) => {
  try {
    const userExists = await Patient.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "Patient already registered", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newuser = new Patient(req.body);
    await newuser.save();
    res
      .status(200)
      .send({ message: "patient registered successfully",data: newuser, success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error creating patient's profile",
      success: false,
      error,
    });
  }
});

// Login Patient

router.post("/login", async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.body.email });
    if (!patient) {
      return res
        .status(200)
        .send({ message: "Patient does not exist", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, patient.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login successful", success: true, data: token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error logging in",
      success: false,
      error: error.message,
    });
  }
});

// Loggedin Patient profile details - Login Required

router.get("/profile", auth, async (req, res) => {
  try {
    let patient = await Patient.findById(req.id).select("-password").lean();
    let appointments = await Appointment.find({patientInfo: req.id})
    patient.appointmentHistory = appointments
    if (!patient) {
      return res
        .status(200)
        .send({ message: "patient does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: patient,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Error getting patient info",
      success: false,
      error: error.message,
    });
  }
});

// Update Patient profile - Login Required

router.put("/update-profile", auth, async (req, res) => {
  try {
    let { name, email, password, address } = req.body;

    let obj = {};

    if (name) {
      obj.name = name;
    }
    if (email) {
      obj.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      obj.password = hashedPassword;
    }
    if (address) {
      obj.address = address;
    }

    let patient = await Patient.findByIdAndUpdate(
      req.id,
      { $set: obj },
      { new: true }
    ).select("-password");
    res.status(200).send({
      success: true,
      message: "Patient profile updated successfully",
      data: patient,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error getting doctor info",
      success: false,
      error: error.message,
    });
  }
});

// Get Doctors List - Login not required

router.get("/get-doctors-list", async (req, res) => {
  try {
    let { byDocterName, Byspecialization, byPlace } = req.query;
    let obj = {};
    if (byDocterName) {
      obj.name = { $regex: byDocterName };
    }
    if (Byspecialization) {
      obj.specialization = { $regex: Byspecialization };
    }
    if (byPlace) {
      obj.address = { $regex: byPlace };
    }
    const doctors = await Doctor.find(obj).select("-password");
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

// Appointment Booking for patient - Login Required

router.post("/book-appointment", auth, async (req, res) => {
  try {
    req.body.patientInfo = req.id;
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    let doctor = await Doctor.findById(req.body.doctorInfo);
    if (!doctor)
      return res.status(404).send({
        message: "Doctor not found",
        success: false,
      });
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();

    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error: error.message,
    });
  }
});

// Check Availability for appointment

router.post("/check-booking-avilability", auth, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    const doctorInfo = req.body.doctorInfo;
    const appointments = await Appointment.find({
      doctorInfo,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

// Get Appointment details

router.get("/appointment-details", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientInfo: req.id,
    }).populate(
      "doctorInfo",
      "name email specialization qualification feePerCunsultation"
    );
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching appointments",
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
