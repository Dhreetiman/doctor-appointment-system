const mongoose = require("mongoose");

let gallerySchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model("Gallery", gallerySchema);
