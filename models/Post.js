const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for the 'Post' model
const postSchema = new Schema({
    post_id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
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
    comments: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Comment'
    }],
});

// Create and export the 'Post' model
const Post = mongoose.model('Post', postSchema);