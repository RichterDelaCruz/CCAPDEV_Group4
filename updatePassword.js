const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User'); // Adjust the path to your User model file

const dbURI = 'mongodb+srv://user:12345@cluster0.hdkzd0w.mongodb.net/homebuddies?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to the database');
    // Call the function to update passwords here
    updatePasswords()
      .then(() => {
        console.log('Password update completed');
        // Close the database connection after the update is complete
        mongoose.disconnect();
      })
      .catch((err) => {
        console.error('Password update error:', err);
        mongoose.disconnect();
      });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

  async function updatePasswords() {
    try {
      // Retrieve all users from the database
      const users = await User.find();
  
      // Loop through each user and update their password with the hashed version
      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10); // Hash the password
        user.password = hashedPassword; // Update the password with the hashed version
        await user.save(); // Save the updated user to the database
      }
    } catch (error) {
      console.error('Error updating passwords:', error);
      throw error;
    }
  }
  