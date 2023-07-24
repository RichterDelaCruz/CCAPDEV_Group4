const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();

const dbURI =  'mongodb+srv://user:12345@cluster0.hdkzd0w.mongodb.net/homebuddies?retryWrites=true&w=majority';
mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));

app.use(express.urlencoded({ extended: true }));

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

// get
app.get('/add-user', (req, res) => {
  const user = new User({
    username: "paul",
    password: "123"
  });

  user.save()
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log(err)
    })
});

app.get('/all-users', (req, res) => {
  User.find()
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log(err)
    })
});

app.get('/single-user', (req, res) => {
  User.findById('64bd68ad50a4458e8d362963')
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.log(err)
    })
});

// Route for handling user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Validate the user against the database
  User.findOne({ username: username, password: password })
    .then((user) => {
      if (user) {
        // User is found, handle successful login here (e.g., redirect to their profile page)
        res.redirect('/profile');
      } else {
        // User is not found or password is incorrect, handle login failure
        res.send('Invalid username or password');
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Server error');
    });
});

// Route for handling user registration
app.post('/register', (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  // Check if the username already exists in the database
  User.findOne({ username: username })
    .then((existingUser) => {
      if (existingUser) {
        // Username already exists, handle registration failure
        res.send('Username already exists. Please choose a different username.');
      } else {
        // Create a new user and save it to the database
        const newUser = new User({
          username: username,
          password: password
        });
        newUser.save()
          .then((result) => {
            // User is successfully registered, handle successful registration (e.g., redirect to login page)
            res.redirect('/login');
          })
          .catch((err) => {
            console.log(err);
            res.status(500).send('Server error');
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Server error');
    });
});
