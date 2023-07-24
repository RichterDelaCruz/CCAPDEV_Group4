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
    posts: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Post'
    }],
});

// Create and export the 'User' model
const User = mongoose.model('User', userSchema);
module.exports = User;
