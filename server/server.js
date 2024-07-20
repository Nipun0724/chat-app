import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDB } from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../src/models/userModel.js";
import Chat from "../src/models/chatModel.js";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
connectDB();

const secretKey = "X41romc$4F";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Failed to authenticate token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

app.get("/user/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ _id: id });
    res.json(user);
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/pic/:email", async (req, res, next) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });

    if (!user || !user.pic) {
      return res
        .status(404)
        .json({ message: "User not found or image not available" });
    }
    res.set("Content-Type", "image/*");
    res.send(user.pic);
  } catch (error) {
    console.error("Error fetching user image:", error);
    next(error);
  }
});

app.post("/search/:user", verifyToken, async (req, res) => {
  const userParam = req.params.user;

  const key = userParam
    ? {
        $or: [
          { name: { $regex: userParam, $options: "i" } },
          { email: { $regex: userParam, $options: "i" } },
        ],
      }
    : {};

  try {
    const users = await User.find(key).find({ _id: { $ne: req.userId } });
    res.json(users);
  } catch (error) {
    console.error("Error querying database:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(401).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, userExists.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ userId: userExists._id }, secretKey, {
      expiresIn: "1h",
    });

    res.status(201).json({ user: userExists, token });
  } catch (error) {
    next(error);
  }
});

app.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert the base64 image string to a Buffer
    let picBuffer = null;
    if (pic) {
      const base64Data = pic.split(",")[1]; // Remove the data URL prefix if present
      picBuffer = Buffer.from(base64Data, "base64");
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      pic: picBuffer,
    });

    if (user) {
      const token = jwt.sign({ userId: user._id }, secretKey, {
        expiresIn: "1h",
      });
      return res.status(201).json({ user, token });
    } else {
      return res.status(500).json({ message: "Error registering user" });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    next(error);
  }
});

app.post("/chats", verifyToken, async (req, res) => {
  const { userId } = req.body;
  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.userId } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });
  if (isChat.length > 0) {
    res.json(isChat[0]);
  } else {
    let chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.userId, userId],
    };
    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.json(fullChat);
    } catch (error) {
      console.log("Error: ", error.message);
    }
  }
});

app.get("/chats", verifyToken, async (req, res) => {
  const userId = req.userId; // Retrieve userId from verified token

  try {
    const chats = await Chat.find({ users: { $elemMatch: { $eq: userId } } })
      .populate("users", "-password") // Populate 'users' field, excluding 'password' field
      .populate("groupAdmin", "-password") // Populate 'groupAdmin' field, excluding 'password' field
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name pic email" }, // Populate 'sender' field in 'latestMessage'
      })
      .sort({ updatedAt: -1 }); // Sort by 'updatedAt' in descending order

    res.json(chats); // Send fetched chats as JSON response
  } catch (error) {
    console.error("Error fetching chats:", error.message); // Log any errors that occur
    res.status(500).json({ error: "Internal server error" }); // Send 500 status and error message to client
  }
});

app.post("/group", verifyToken, async (req, res) => {
  // Validate input
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  // Parse users from the request body
  let users;
  try {
    users = JSON.parse(req.body.users);
  } catch (error) {
    return res.status(400).json({ message: "Invalid users format" });
  }

  // Validate users
  if (users.length < 2) {
    return res.status(400).json({ message: "At least 2 members required" });
  }

  // Add the current user to the group
  users.push(req.userId);

  try {
    // Create group chat
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.userId,
    });

    // Populate group chat details
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(fullGroupChat);
  } catch (error) {
    console.error("Error creating group chat:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/rename-group", verifyToken, async (req, res) => {
  const { chatId, chatName } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: chatName,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (updatedChat) {
      res.json(updatedChat);
    } else {
      res.status(400).json({ message: "Not able to update" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/add-group", verifyToken, async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (updatedChat) {
      res.json(updatedChat);
    } else {
      res.status(400).json({ message: "Not able to update" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/remove-group", verifyToken, async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (updatedChat) {
      res.json(updatedChat);
    } else {
      res.status(400).json({ message: "Not able to update" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = 8800;
app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
