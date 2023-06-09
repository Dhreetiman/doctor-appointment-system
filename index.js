const express = require("express");
let connectDB = require("./database"); 
let Gallery = require("./models/Gallery"); 
let Doctor = require("./models/Doctor"); 
var CronJob = require('cron').CronJob
const cors = require('cors')
const app = express();
app.use(cors())
app.use(express.json({ extended: false }));

connectDB();

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

const cronJob = new CronJob('0 47 13 * * *', function () {
  console.log('Cron job started');
  addData()
  console.log("Data Added");

}, "Asia/Kolkata");
cronJob.start()

app.use('/api/doctor', require('./routes/doctorRoute'))
app.use('/api/patient', require('./routes/patientRoute'))

app.listen(5000, () => {
  console.log(`Server is running on Port ${5000}`);
});
