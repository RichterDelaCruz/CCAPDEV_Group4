const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for the 'Comment' model
const commentSchema = new Schema({
    post_id: {
        type: Number,
        required: true
    },
    comment_id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
});


// Create and export the 'Comment' model
const Comment = mongoose.model('Comment', commentSchema);