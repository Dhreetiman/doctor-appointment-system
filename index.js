const express = require("express");
let connectDB = require("./database");
const app = express();

connectDB();
app.use(express.json({ extended: false }));

app.use('/api/doctor', require('./routes/doctorRoute'))
app.use('/api/patient', require('./routes/patientRoute'))

app.listen(process.env.PORT, () => {
  console.log(`Server is running on Port ${process.env.PORT}`);
});
