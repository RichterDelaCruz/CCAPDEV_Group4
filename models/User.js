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
    likedPosts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
        // Add a reference to the user's posts
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

// Create and export the 'User' model
const User = mongoose.model('User', userSchema);
module.exports = User;