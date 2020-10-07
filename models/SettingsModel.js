const mongoose = require('mongoose');
let Settings = {
    guild: {
        type: String,
        required: true,
        index: true
    },
    generalChannel: String,
    breakoutChannels: [String],
    commandPrefix: {
        type: String,
        required: false,
        default: "~"
    },
    adminRole: String
}

module.exports = mongoose.model('Settings', Settings);