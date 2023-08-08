const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');

const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

app.set('view engine', 'ejs');

const dbURI = 'mongodb+srv://user:12345@cluster0.hdkzd0w.mongodb.net/homebuddies?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));


// Redirect to the "/login" page when the root URL is accessed
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/homepage', async (req, res) => {
  try {
    if (!req.session.user) {
      // If the user is not authenticated, redirect them to the login page
      return res.redirect('/login');
    }

    // Retrieve the current user's data from the session
    const currentUser = req.session.user;

    // Retrieve all posts from the database
    const posts = await Post.find().populate('user_id').exec();

    // Fetch comments for each post and populate the 'user_id' field to access user data
    for (const post of posts) {
      const user = await User.findById(post.user_id).exec();

      // Add the username of the post creator to each post
      post.username = user.username;

      const comments = await Comment.find({ post_id: post._id }).exec();

      // Fetch the username for each comment using the 'user_id' in the Comment model
      for (const comment of comments) {
        const commentUser = await User.findById(comment.user_id).exec();
        comment.username = commentUser.username; // Add the 'username' field to the comment
        comment.profilePicture = commentUser.profilePicture; // Add the 'profilePicture' field to the comment
      }

      post.comments = comments;
    }

    // Render the 'homepage.ejs' template with the data
    res.render('homepage', { currentUser: currentUser, posts: posts });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

// Route for handling profile picture upload
app.post("/homepage", upload.single("image"), (req, res) => {
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
        res.redirect('/homepage');
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

// Route handler for the profile page
app.get('/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      // User is not authenticated, redirect them to the login page
      return res.redirect('/login');
    }

    // Find all posts for the current user
    const posts = await Post.find({ user_id: req.session.user._id }).exec();

    // Fetch the username for each post using the 'user_id' in the Post model
    for (const post of posts) {
      const user = await User.findById(post.user_id).exec();
      post.username = user.username; // Add the 'username' field to the post
    }

    // Fetch comments for each post and populate the 'user_id' field to access user data
    for (const post of posts) {
      const comments = await Comment.find({ post_id: post._id }).exec();

      // Fetch the username for each comment using the 'user_id' in the Comment model
      for (const comment of comments) {
        const user = await User.findById(comment.user_id).exec();
        comment.username = user.username; // Add the 'username' field to the comment
      }

      post.comments = comments;
    }

    // Render the profile page with the user object and the posts
    res.render('profile', { user: req.session.user, posts: posts });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

app.get('/profile/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    // Find the user with the specified userId in the database
    const visitedUser = await User.findById(userId);

    if (!visitedUser) {
      // If the user with the given userId is not found, return a 404 Not Found error
      return res.status(404).send('User not found.');
    }
    // Find the posts of the user with the specified userId
    const posts = await Post.find({ user_id: userId });

    // Render the 'profile.ejs' template with the user and posts data
    res.render('profile', { currentUser: req.session.user, user: visitedUser, posts });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('Internal Server Error.');
  }
});

app.post('/follow/:userId', async (req, res) => {
  const currentUserId = req.session.user._id; // Get the current user ID from the session
  const visitedUserId = req.params.userId; // Get the user ID of the visited user

  try {
    // Find the user instances for the current user and the visited user
    const currentUser = await User.findById(currentUserId);
    const visitedUser = await User.findById(visitedUserId);

    if (!currentUser || !visitedUser) {
      // If either user is not found, return a 404 Not Found error
      return res.status(404).send('User not found.');
    }

    // Add the visitedUserId to the currentUser's followers array
    currentUser.following.push(visitedUserId);

    // Save the currentUser with the updated followers array
    await currentUser.save();

    // Add the currentUserId to the visitedUser's following array
    visitedUser.followers.push(currentUserId);

    // Save the visitedUser with the updated following array
    await visitedUser.save();

    // After updating the database, fetch the updated user data for the current user
    const updatedCurrentUser = await User.findById(currentUserId);

    // Update req.session.user with the updated user data
    req.session.user = updatedCurrentUser;

    console.log(currentUser);
    console.log(visitedUser);

    res.redirect(`/profile/${visitedUserId}`);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).send('Internal Server Error.');
  }
});

app.post('/unfollow/:userId', async (req, res) => {
  const currentUserId = req.session.user._id; // Get the current user ID from the session
  const visitedUserId = req.params.userId; // Get the user ID of the visited user

  try {
    // Find the user instances for the current user and the visited user
    const currentUser = await User.findById(currentUserId);
    const visitedUser = await User.findById(visitedUserId);

    if (!currentUser || !visitedUser) {
      // If either user is not found, return a 404 Not Found error
      return res.status(404).send('User not found.');
    }

    // Remove the visitedUserId from the currentUser's following array
    currentUser.following = currentUser.following.filter((id) => id.toString() !== visitedUserId.toString());

    // Save the currentUser with the updated following array
    await currentUser.save();

    // Remove the currentUserId from the visitedUser's followers array
    visitedUser.followers = visitedUser.followers.filter((id) => id.toString() !== currentUserId.toString());

    // Save the visitedUser with the updated followers array
    await visitedUser.save();

    // After updating the database, fetch the updated user data for the current user
    const updatedCurrentUser = await User.findById(currentUserId);

    // Update req.session.user with the updated user data
    req.session.user = updatedCurrentUser;

    console.log(currentUser);
    console.log(visitedUser);

    res.redirect(`/profile/${visitedUserId}`);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).send('Internal Server Error.');
  }
});


app.post('/add-comment', async (req, res) => {
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

    try {
      // Save the new comment to the database
      const savedComment = await newComment.save();

      // Find the corresponding post using the Post model and the post_id
      const post = await Post.findById(post_id);

      // Push the comment's ID to the 'comments' array of the post
      post.comments.push(savedComment._id);

      // Save the updated post with the new comment reference
      await post.save();

      // Redirect back to the post page after posting the comment
      res.redirect(`/post/${post_id}`);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
    }
  } else {
    // User is not authenticated, redirect them to the login page
    res.redirect('/login');
  }
});



// Login route
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});


// Route for handling user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Validate the user against the database
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      // User is not found or password is incorrect, handle login failure
      return res.send('Invalid username or password');
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // User is found and password matches, store user information in the session
      req.session.user = user;
      // Handle successful login here (e.g., redirect to their profile page)
      res.redirect('/homepage');
    } else {
      // Password is incorrect, handle login failure
      res.send('Invalid username or password');
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});


// Route for handling user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  // Check if the username already exists in the database
  try {
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      // Username already exists, handle registration failure
      return res.send('Username already exists. Please choose a different username.');
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

    // Create a new user and save it to the database
    const newUser = new User({
      username: username,
      password: hashedPassword // Save the hashed password
    });

    const savedUser = await newUser.save();

    // User is successfully registered, handle successful registration (e.g., redirect to login page)
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

// Add this route to display the list of users
app.get('/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Render the 'users.ejs' template and pass the users data to it
    res.render('users', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
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

app.get('/posts', async (req, res) => {
  try {
    // Fetch all posts from the database using the Post model
    const posts = await Post.find();

    // Render the 'index.ejs' template and pass the posts data to it
    res.render('index', { posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
  }
});

app.get('/post/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    // Fetch the post from the database using the Post model and the provided postId,
    // and populate the 'user' and 'comments' fields to get the user and comments details
    const post = await Post.findById(postId).populate([
      { path: 'user_id' },
      {
        path: 'comments',
        populate: {
          path: 'user_id',
          model: 'User'
        }
      }
    ]);

    // Check if the post with the provided postId exists
    if (post) {
      // Render the 'post.ejs' template and pass the post data to it
      res.render('post', { post, currentUser: req.session.user });
    } else {
      // If the post doesn't exist, redirect to the list of all posts
      res.redirect('/posts');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
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

        // Update the user's 'posts' array with the ObjectId of the newly created post
        User.findByIdAndUpdate(user_id, { $push: { posts: post._id } })
          .then((user) => {
            console.log('User updated:', user); // Check if the user data is updated correctly

            // ... (rest of the code, e.g., redirecting or rendering a page)
            res.redirect('/homepage'); // Redirecting to the profile page after creating a new post
          })
          .catch((err) => {
            console.log(err);
            res.status(500).send('Server error');
          });
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


// Server-side route to check if the user has liked the post
app.get('/check-like/:postId', async (req, res) => {
  const postId = req.params.postId;
  const userId = req.session.user._id;

  try {
    // Find the post and check if the user's ID is in the likes array
    const post = await Post.findById(postId);
    const isLiked = post.likes.includes(userId);

    // Send the JSON response with the like status
    res.json({ isLiked });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// app.js (or whatever your server entry point is)
app.post('/toggle-like', async (req, res) => {
  const { postId } = req.body;

  try {
    // Find the post by its ID
    const post = await Post.findById(postId);

    // Check if the user has already liked the post
    const isLiked = post.likes.includes(req.session.user._id);

    if (isLiked) {
      // If the user has liked the post, remove their like
      post.likes.pull(req.session.user._id);
    } else {
      // If the user has not liked the post, add their like
      post.likes.push(req.session.user._id);
    }

    // Save the updated post with the new like status
    await post.save();

    // Respond with the updated like count and like status
    res.json({
      likesCount: post.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/comments/:commentId', async (req, res) => {
  const commentId = req.params.commentId;

  try {
    // Use Mongoose to find and delete the comment by its _id
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      // If the comment with the provided commentId is not found, respond with an error message
      return res.status(404).send(`Comment with ID ${commentId} not found.`);
    }

    // Respond with a success message or appropriate response
    res.send(`Comment with ID ${commentId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/posts/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    // Use Mongoose to find and delete the post by its _id
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      // If the post with the provided postId is not found, respond with an error message
      return res.status(404).send(`Post with ID ${postId} not found.`);
    }

    // Redirect the user to the homepage
    res.redirect('/after-delete-homepage');
  } catch (error) {
    console.error('Error deleting post:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/after-delete-homepage', async (req, res) => {
  try {
    if (!req.session.user) {
      // If the user is not authenticated, redirect them to the login page
      return res.redirect('/login');
    }

    // Retrieve the current user's data from the session
    const currentUser = req.session.user;

    // Retrieve all posts from the database
    const posts = await Post.find().populate('user_id').exec();

    // Fetch comments for each post and populate the 'user_id' field to access user data
    for (const post of posts) {
      const user = await User.findById(post.user_id).exec();

      // Add the username of the post creator to each post
      post.username = user.username;

      const comments = await Comment.find({ post_id: post._id }).exec();

      // Fetch the username for each comment using the 'user_id' in the Comment model
      for (const comment of comments) {
        const commentUser = await User.findById(comment.user_id).exec();
        comment.username = commentUser.username; // Add the 'username' field to the comment
        comment.profilePicture = commentUser.profilePicture; // Add the 'profilePicture' field to the comment
      }

      post.comments = comments;
    }

    // Render the 'homepage.ejs' template with the data
    res.render('homepage', { currentUser: currentUser, posts: posts });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});