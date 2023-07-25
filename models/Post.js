const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for the 'Post' model
const postSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
        },
    content: {
        type: String,
        required: true,
    },
    photo: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
});

// Create and export the 'Post' model
const Post = mongoose.model('Post', postSchema);
module.exports = Post;
