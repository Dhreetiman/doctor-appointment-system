const express = require("express");
let connectDB = require("./database"); 
var CronJob = require('cron').CronJob
const cors = require('cors')
const app = express();
app.use(cors())
app.use(express.json({ extended: false }));

connectDB();

const cronJob = new CronJob('30 9 * * 1-6', function () {
  console.log('Cron job started');

}, "Asia/Kolkata");
cronJob.start()

app.use('/api/doctor', require('./routes/doctorRoute'))
app.use('/api/patient', require('./routes/patientRoute'))

app.listen(process.env.PORT, () => {
  console.log(`Server is running on Port ${process.env.PORT}`);
});
