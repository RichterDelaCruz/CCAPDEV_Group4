const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');

const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({storage: storage});

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const path = require('path');

const app = express();

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/images", express.static('images'));
app.use(express.static('public'));

app.set('view engine', 'ejs');

const dbURI = 'mongodb+srv://user:12345@cluster0.hdkzd0w.mongodb.net/homebuddies?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));

// Route for handling profile picture upload
app.post("/profile", upload.single("image"), (req, res) => {
  // Check if the user is authenticated by checking the session
  if (req.session.user) {
    const userId = req.session.user._id;
    const profilePicturePath = "/images/" + req.file.filename; // Assuming 'path' is the field where multer stores the image path

    // Update the profilePicture field for the logged-in user in the database
    User.findByIdAndUpdate(userId, { profilePicture: profilePicturePath }, { new: true })
      .then((user) => {
        // Update the user data in the session with the new data from the database
        req.session.user = user;
        // Redirect back to the profile page after the update
        res.redirect('/profile');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Server error');
      });
  } else {
    // User is not authenticated, redirect them to the login page
    res.redirect('/login');
  }
});

app.get('/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      // User is not authenticated, redirect them to the login page
      return res.redirect('/login');
    }

    // Find all posts for the current user
    const posts = await Post.find({ user_id: req.session.user._id }).exec();

    // Find all comments for the posts and populate them
    for (const post of posts) {
      const comments = await Comment.find({ post_id: post._id }).exec();
      post.comments = comments;
    }

    // Render the profile page with the user object and the posts
    res.render('profile', { user: req.session.user, posts: posts });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

// Route to handle the form submission for creating a new post
app.post('/create-post', upload.single('photo'), (req, res) => {
  if (req.session.user) {
    // Extract the necessary data from the request
    const { content } = req.body;
    const timestamp = new Date();
    const photoPath = req.file ? `/images/${req.file.filename}` : null;
    const user_id = req.session.user._id;

    // Assuming the 'user_id' is a valid MongoDB ObjectId
    const newPost = new Post({
      user_id: user_id, // Use the user_id from the session
      content: content,
      timestamp: timestamp,
      photo: photoPath, // Use the 'photoPath' variable containing the uploaded image path
    });

    // Save the new post to the database
    newPost.save()
      .then((post) => {
        console.log('New Post:', post); // Check if the new post data is correct

        // ... (rest of the code, e.g., redirecting or rendering a page)
        res.redirect('/profile'); // Redirecting to the profile page after creating a new post
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Server error');
      });
  } else {
    // User is not authenticated, redirect them to the login page
    res.redirect('/login');
  }
});

app.get('/profile', (req, res) => {
    // Check if the user is authenticated by checking the session
    if (req.session.user) {
        // User is authenticated, display the profile page with the user object
        // Fetch all the posts for the specific user and populate the 'user_id' field
        Post.find({ user_id: req.session.user._id })
            .populate('user_id')
            .then((posts) => {
                res.render('profile', { user: req.session.user, posts: posts });
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Server error');
            });
    } else {
        // User is not authenticated, redirect them to the login page
        res.redirect('/login');
    }
});

app.post('/add-comment', (req, res) => {
  if (req.session.user) {
    const { post_id, content } = req.body;
    const user_id = req.session.user._id;
    const username = req.session.user.username;
    const timestamp = new Date();

    // Create a new comment using the Comment model
    const newComment = new Comment({
      post_id: post_id,
      user_id: user_id,
      username: username,
      content: content,
      timestamp: timestamp,
    });

    // Save the new comment to the database
    newComment.save()
      .then((comment) => {
        console.log('New Comment:', comment);
        // Redirect back to the profile page after posting the comment
        res.redirect('/profile');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Server error');
      });
  } else {
    // User is not authenticated, redirect them to the login page
    res.redirect('/login');
  }
});



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

// Login route
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});


// Route for handling user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Validate the user against the database
  User.findOne({ username: username, password: password })
    .then((user) => {
      if (user) {
        // User is found, store user information in the session
        req.session.user = user;
        console.log(req.session.user); // Add this line to check session data
        // Handle successful login here (e.g., redirect to their profile page)
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

// Route for user profile page
app.get('/profile', (req, res) => {
  // Check if the user is authenticated by checking the session
  if (req.session.user) {
    // User is authenticated, display the profile page with the user object
    res.render('profile', { user: req.session.user });
  } else {
    // User is not authenticated, redirect them to the login page
    res.redirect('/login');
  }
});

// Route for rendering the posts page for a specific user
app.get('/user/:userId/posts', (req, res) => {
  const userId = req.params.userId;
  // Find the user by their ID and populate the 'posts' field
  User.findById(userId)
    .populate('posts') // Assuming 'posts' is the field that contains the user's posts
    .then((user) => {
      if (user) {
        // User found, render the posts page with the user's information
        res.render('posts', { user: user });
      } else {
        // User not found
        res.status(404).send('User not found');
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Server error');
    });
});