const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for the 'User' model
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String, // Store the URL or path to the profile picture
        default: '../images/default-profile-picture.jpg' // Set the default path to the profile picture
    },
});

// Create and export the 'User' model
const User = mongoose.model('User', userSchema);
module.exports = User;