const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path to your User model file

const dbURI = 'mongodb+srv://user:12345@cluster0.hdkzd0w.mongodb.net/homebuddies?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to the database.');

    try {
      // Find users who don't have the 'followers' and 'following' fields
      const usersToUpdate = await User.find({ followers: { $exists: false }, following: { $exists: false } });

      // Update each user to include the 'followers' and 'following' fields with default values
      for (const user of usersToUpdate) {
        user.followers = [];
        user.following = [];
        await user.save();
        console.log(`Updated user: ${user._id}`);
      }

      console.log('All users updated successfully.');
    } catch (err) {
      console.error('Error updating users:', err);
    } finally {
      // Close the database connection when done
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });
