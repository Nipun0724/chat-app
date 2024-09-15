import React, { useState, useEffect, useRef } from "react";
import "./Hero.css";
import { Avatar, Modal, Box, TextField, Button, Chip } from "@mui/material";
import { Dropdown } from "@mui/base/Dropdown";
import { MenuButton } from "@mui/base/MenuButton";
import { Menu } from "@mui/base/Menu";
import { MenuItem } from "@mui/base/MenuItem";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserItem from "../miscellaneous/UserItem";
import ChatSection from "../ChatSection/ChatSection";
import { io } from "socket.io-client";
import logo from "../../assets/chat.png";
import CircularProgress from "@mui/material/CircularProgress";

const Hero = () => {
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const selectedChatCompareRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const ENDPOINT =
    process.env.NODE_ENV === "production"
      ? "https://chat-app-0hnv.onrender.com"
      : "http://localhost:8800";

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  const token = localStorage.getItem("token");
  useEffect(() => {
    let token_ = localStorage.getItem("token");
    if (!token_) {
      navigate("/login");
    } else {
      const decodedToken = parseJwt(token_);
      setCurrentUserId(decodedToken.userId);
    }
  }, [navigate]);
  useEffect(() => {
    const socketInstance = io("https://chat-app-0hnv.onrender.com");
    setSocket(socketInstance);

    socketInstance.on("connected", () => setSocketConnected(true));
    socketInstance.on("typing", () => setIsTyping(true));
    socketInstance.on("stop typing", () => setIsTyping(false));

    return () => {
      socketInstance.disconnect();
    };
  }, [ENDPOINT]);

  useEffect(() => {
    if (socket && currentUser) {
      socket.emit("setup", currentUser);
    }
  }, [currentUser, socket]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(
        `${ENDPOINT}/messages`,
        { chatId: selectedChat._id, content: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newMessageData = response.data;

      // Emit the message through socket
      socket.emit("new message", newMessageData);

      // Update the messages state with the new message
      setMessages((prevMessages) => [...prevMessages, newMessageData]);

      // Update the specific chat in groups with the latest message
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === selectedChat._id
            ? { ...group, latestMessage: newMessageData }
            : group
        )
      );

      // Clear the input field
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected || !selectedChat) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    const lastTypingTime = new Date().getTime();

    // Clear the previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set a new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastTypingTime;

      if (timeDiff >= 3000 && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 3000);
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ENDPOINT}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    // setLoading(true);
    try {
      const response = await axios.get(`${ENDPOINT}/messages/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(response.data);
      if (socket) {
        socket.emit("join chat", chatId);
        selectedChatCompareRef.current = chatId;
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      // setLoading(false);
    }
  };

  const updateGroup = (updatedGroup) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group._id === updatedGroup._id ? updatedGroup : group
      )
    );
    setSelectedChat(updatedGroup);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUserResponse = await axios.get(
          `${ENDPOINT}/user/${currentUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const currentUser = currentUserResponse.data;
        setCurrentUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error.message);
      }
    };

    fetchUser();
    fetchChats();
  }, [currentUserId, token]);

  useEffect(() => {
    const messageHandler = (newMessageReceived) => {
      console.log("New message received:", newMessageReceived);
      if (selectedChatCompareRef.current !== newMessageReceived.chat._id) {
        if (!notifications.includes(newMessageReceived)) {
          setNotifications([newMessageReceived, ...notifications]);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
      }
      fetchChats();
    };

    socket?.on("message received", messageHandler);

    return () => {
      socket?.off("message received", messageHandler);
    };
  }, [socket]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const result = await axios.post(
        `${ENDPOINT}/search/${search}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (group) => {
    // Filter out the notification for the selected chat
    const updatedNotifications = notifications.filter(
      (notification) => notification.chat._id !== group._id
    );

    // Update the notifications state
    setNotifications(updatedNotifications);

    // Set the selected chat and fetch its messages
    setSelectedChat(group);
    fetchMessages(group._id);
  };

  const handleUserSearch = async (event) => {
    setUserSearch(event.target.value);
    try {
      const token = localStorage.getItem("token");
      const result = await axios.post(
        `${ENDPOINT}/search/${event.target.value}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserResults(result.data);
    } catch (error) {
      console.error("Error during user search:", error);
    }
  };

  const handleAddUser = (user) => {
    setSelectedUsers((prev) => [...prev, user]);
    setUserResults([]);
    setUserSearch("");
  };

  const handleAddChat = async (user) => {
    try {
      const response = await axios.post(
        `${ENDPOINT}/chats`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchChats();
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((user) => user._id !== userId));
  };

  const handleCreateGroup = async () => {
    console.log("Clicked");
    try {
      if (!groupName || selectedUsers.length < 2) {
        throw new Error(
          "Please enter a group name and select at least two users."
        );
      }

      const response = await axios.post(
        `${ENDPOINT}/group`,
        {
          name: groupName,
          users: JSON.stringify(selectedUsers.map((user) => user._id)),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchChats();
      handleCloseGroupModal();
    } catch (error) {
      console.error("Error creating group:", error.message);
    }
  };
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off("typing");
        socket.off("stop typing");
        socket.off("connected");
        socket.off("message received");
      }
    };
  }, [socket]);

  const handleOpenProfileModal = () => setProfileModalOpen(true);
  const handleCloseProfileModal = () => setProfileModalOpen(false);
  const handleOpenGroupModal = () => setGroupModalOpen(true);
  const handleCloseGroupModal = () => setGroupModalOpen(false);
  const handleOpenChatModal = () => setChatModalOpen(true);
  const handleCloseChatModal = () => setChatModalOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <div className="hero-container">
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />

        <h1 className="title">Chatter</h1>
        <Dropdown>
          <MenuButton className="menu-button">
            <Avatar
              alt="Profile"
              src={currentUser?.pic || "/static/images/avatar/3.jpg"}
            />
          </MenuButton>
          <Menu className="menu-root">
            <MenuItem className="menu-item" onClick={handleOpenProfileModal}>
              Profile
            </MenuItem>
            <MenuItem className="menu-item" onClick={handleLogout}>
              Log out
            </MenuItem>
          </Menu>
        </Dropdown>
      </div>
      <div className="chat-container">
        <div className={`chat-box ${selectedChat ? "chat-selected" : ""}`}>
          <div className="groups">
            <div className="search-wrapper">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  className="search"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <SearchIcon className="search-icon" onClick={handleSearch} />
              </form>
              <button onClick={handleOpenChatModal}>
                <PersonAddAltIcon />
              </button>
              <button onClick={handleOpenGroupModal}>
                <GroupAddIcon />
              </button>
            </div>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </div>
            ) : (
              Array.isArray(groups) &&
              groups.length > 0 &&
              groups.map((group, index) => {
                const otherUser = group.users.find(
                  (user) => user._id !== currentUser._id
                );
                return (
                  <Button
                    key={index}
                    onClick={() => handleSelectChat(group)}
                    sx={{ textTransform: "none" }}
                  >
                    <UserItem group={group} otherUser={otherUser} />
                  </Button>
                );
              })
            )}
          </div>
          <ChatSection
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            currentUserId={currentUserId}
            updateGroup={updateGroup}
            token={token}
            messages={messages}
            newMessage={newMessage}
            typingHandler={typingHandler}
            handleSendMessage={handleSendMessage}
            isTyping={isTyping}
            notifications={notifications}
          />
        </div>
      </div>

      <Modal
        open={profileModalOpen}
        onClose={handleCloseProfileModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="profile-modal-box">
          {currentUser && (
            <div className="profile-content">
              <Avatar
                alt={currentUser.name}
                src={
                  currentUser.pic
                    ? `${currentUser.pic}`
                    : "/static/images/avatar/default.jpg"
                }
                className="profile-avatar"
              />
              <h2>{currentUser.name}</h2>
              <p>
                Created: {new Date(currentUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <button onClick={handleCloseProfileModal} className="close-button">
            Close
          </button>
        </Box>
      </Modal>

      <Modal
        open={groupModalOpen}
        onClose={handleCloseGroupModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="group-modal-box">
          <div className="group-content">
            <h2>Create Group</h2>
            <TextField
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Search Users"
              value={userSearch}
              onChange={handleUserSearch}
              fullWidth
            />
            <div className="user-results">
              {userResults.map((user) => (
                <div
                  key={user._id}
                  className="user-result-item"
                  onClick={() => handleAddUser(user)}
                >
                  <Avatar src={user.pic} alt={user.name} />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
            <div className="selected-users">
              {selectedUsers.map((user) => (
                <Chip
                  key={user._id}
                  avatar={<Avatar src={user.pic} alt={user.name} />}
                  label={user.name}
                  onDelete={() => handleRemoveUser(user._id)}
                />
              ))}
            </div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateGroup}
            >
              Create
            </Button>
          </div>
        </Box>
      </Modal>
      <Modal
        open={chatModalOpen}
        onClose={handleCloseChatModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="group-modal-box">
          <div className="group-content">
            <h2>Find Users</h2>
            <TextField
              label="Search Users"
              value={userSearch}
              onChange={handleUserSearch}
              fullWidth
            />
            <div className="user-results">
              {userResults.map((user) => (
                <div
                  key={user._id}
                  className="user-result-item"
                  onClick={() => handleAddChat(user)}
                >
                  <Avatar src={user.pic} alt={user.name} />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default Hero;
