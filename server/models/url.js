const mongoose = require("mongoose")

const urlSchema = new mongoose.Schema({
    long: {
        type: String,
        required: true
    },
    short: {
        type: String,
        required: true,
    },
    clicks: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model("url",urlSchema)