const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for the 'User' model
const userSchema = new Schema({
    user_id: {
        type: Number,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Post'
    }],
});

// Create and export the 'User' model
const User = mongoose.model('User', userSchema);

//module.exports = { User, Post, Comment };
