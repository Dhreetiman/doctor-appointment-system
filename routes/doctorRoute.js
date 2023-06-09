const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
let Gallery = require("../models/Gallery"); 
// let Doctor = require("./models/Doctor"); 


//Sign up for Doctors

router.post("/register", async (req, res) => {
  try {
    const docExists = await Doctor.findOne({ email: req.body.email });
    if (docExists) {
      return res.status(200).send({
        message: "Doctor already exists, Please login",
        success: false,
      });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newDoc = new Doctor(req.body);
    await newDoc.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});

// Login for doctors

router.post("/login", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ email: req.body.email });
    if (!doctor) {
      return res
        .status(200)
        .send({ message: "Doctor does not exist", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, doctor.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Incorrect Password", success: false });
    } else {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res
        .status(200)
        .send({ message: "Login successful", success: true, token: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

// Loggedin doctor profile details - Login Required

router.get("/profile", auth, async (req, res) => {
  try {
    let doctor = await Doctor.findById(req.id).select("-password").lean();
    let appointments = await Appointment.find({doctorInfo: req.id}) .lean()
    doctor.appointmentHistory = appointments
    res.status(200).send({
      success: true,
      message: "info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

// Update profile for Doctor - Login Required

router.put("/update-profile/", auth, async (req, res) => {
  try {
    let {
      name,
      phoneNumber,
      email,
      password,
      website,
      qualification,
      address,
      specialization,
      experience,
      feePerCunsultation,
      timings,
      status,
    } = req.body;

    // let doctor = await Doctor.findById

    let obj = {};

    if (name) {
      obj.name = name;
    }
    if (phoneNumber) {
      obj.phoneNumber = phoneNumber;
    }
    if (email) {
      obj.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      obj.password = hashedPassword;
    }
    if (website) {
      obj.website = website;
    }
    if (qualification) {
      obj.qualification = qualification;
    }
    if (address) {
      obj.address = address;
    }
    if (specialization) {
      obj.specialization = specialization;
    }
    if (experience) {
      obj.experience = experience;
    }
    if (feePerCunsultation) {
      obj.feePerCunsultation = feePerCunsultation;
    }
    if (timings) {
      obj.timings = timings;
    }
    if (status) {
      obj.status = status;
    }

    let doctor = await Doctor.findByIdAndUpdate(
      req.id,
      { $set: obj },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({
        message: "Error getting doctor info",
        success: false,
        error: error.message,
      });
  }
});

// Get Appointment details for doctor - Login Required

router.get(
  "/get-appointments",
  auth,
  async (req, res) => {
    try {
    //   const doctor = await Doctor.findById(req.id );
      const appointments = await Appointment.find({ doctorId: req.id });
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
        error,
      });
    }
  }
);

//Change 


router.post("/change-appointment-status", auth, async (req, res) => {
    try {
      const { appointmentId, status } = req.body;
      const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
        status,
      }, {new: true});
  
      const user = await Patient.findOne({ _id: appointment.userId });
      
      await user.save();
  
      res.status(200).send({
        message: "Appointment status updated successfully",
        success: true
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error changing appointment status",
        success: false,
        error,
      });
    }
  });


  let addData = async () => {
    let doctors = await Doctor.find()
    let galleryData = []
    for (let doctor of doctors) {
      let galleries = {
        doctor : doctor._id
      }
      galleryData.push(galleries)
    }
    await Gallery.insertMany(galleryData)
  }

  router.get("/add-data", async (req, res) => {
    addData()
    return res.status(200).send("Data Added")
  })

module.exports = router;
