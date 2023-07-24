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
    },
    Photo: {
        type: String
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
module.exports = Post;
