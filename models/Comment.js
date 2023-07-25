const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for the 'Comment' model
const commentSchema = new Schema({
    post_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
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
module.exports = Comment;
