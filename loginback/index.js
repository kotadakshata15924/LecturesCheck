const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());

const corspolicy = { origin: "http://localhost:3000" };
app.use(cors(corspolicy));

// Connect to MongoDB Atlas
const db = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017//uploadvideo', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected!');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};
db();

// Define User schema and model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    emojiUrl: {
        type: String,
        required: true,
    }
});

const User = mongoose.model("User", userSchema);

// Route to get all users (for testing purposes)
app.get('/users', async (req, res) => {
    try {
        const allUsers = await User.find({}, 'username'); // Only retrieve usernames
        res.send(allUsers);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username, password });

        if (!existingUser) {
            return res.status(400).send('Invalid credentials');
        }

        // Send emojiUrl along with the success response
        res.status(200).json({ message: 'Login successful', emojiUrl: existingUser.emojiUrl, username: existingUser.username });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error logging in. Please try again.');
    }
});

// Save user info endpoint
app.post("/save-user-info", async (req, res) => {
    try {
        const { username, password, emojiUrl } = req.body;

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists. Please choose a different username." });
        }

        // If username is unique, save the new user
        const newUser = new User({ username, password, emojiUrl });
        await newUser.save();

        // Log success message
        console.log(`User "${username}" saved successfully!`);

        // Return a 201 Created response with a success message and the newly created user
        res.status(201).json({ message: "Username saved successfully!", user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Start the server
app.listen(5000, () => console.log("Listening at port 5000"));
