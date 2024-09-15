import React, { useState, useEffect } from "react";
import groupPic from "../../assets/2352167.png";
import {
  Avatar,
  Modal,
  Box,
  TextField,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Menu,
} from "@mui/material";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

const ChatHeader = ({
  selectedChat,
  currentUserId,
  setSelectedChat,
  token,
  notifications,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const ENDPOINT =
    process.env.NODE_ENV === "production"
      ? "https://chat-app-0hnv.onrender.com"
      : "http://localhost:8800";

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (selectedChat?.chatName) {
      setNewGroupName(selectedChat.chatName);
    }
  }, [selectedChat]);

  if (!selectedChat) {
    return (
      <div className="chats-header">
        <div className="chatSection-header">
          <div className="bell-icon">
            <Button
              id="basic-button"
              aria-controls={open ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
            >
              <NotificationsActiveIcon />
            </Button>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
            >
              {notifications.length === 0 ? (
                <MenuItem disabled>No messages to display</MenuItem>
              ) : (
                notifications.map((notification) => (
                  <MenuItem
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.sender.name}: {notification.content}{" "}
                    {/* Display message content */}
                  </MenuItem>
                ))
              )}
            </Menu>
          </div>
        </div>
      </div>
    );
  }

  const otherUser = selectedChat.users.find(
    (user) => user._id !== currentUserId
  );

  const isGroupAdmin =
    selectedChat.isGroupChat && selectedChat.groupAdmin._id === currentUserId;

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleUserSearch = async (event) => {
    const searchValue = event.target.value;
    setUserSearch(searchValue);

    if (searchValue.trim() === "") {
      setUserResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${ENDPOINT}/search/${searchValue}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const filtered = response.data.filter((user) => {
        return (
          !selectedChat.users.some((chatUser) => chatUser._id === user._id) &&
          !selectedUsers.some((selectedUser) => selectedUser._id === user._id)
        );
      });

      setUserResults(filtered);
    } catch (error) {
      console.error("Error during user search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (user) => {
    setSelectedUsers((prev) => [...prev, user]);
    setUserResults([]);
    setUserSearch("");
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((user) => user._id !== userId));
  };

  const handleChangeGroupName = async () => {
    if (newGroupName.trim() === "") return;

    try {
      const response = await axios.put(
        `${ENDPOINT}/rename-group`,
        {
          chatId: selectedChat._id,
          chatName: newGroupName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedChat(response.data);
    } catch (error) {
      console.error("Error renaming group:", error);
    }
  };

  const handleAddUsersToGroup = async () => {
    let userIds = selectedUsers.map((user) => user._id);
    userIds.push(currentUserId);

    try {
      const response = await axios.put(
        `${ENDPOINT}/add-group`,
        {
          chatId: selectedChat._id,
          userIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedChat(response.data);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error adding users to group:", error);
    }
  };

  const handleRemoveUserFromGroup = async (userId) => {
    console.log("Attempting to remove user:", userId);
    try {
      const response = await axios.put(
        `${ENDPOINT}/remove-group`,
        {
          chatId: selectedChat._id,
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("User removed successfully:", response.data);
      setSelectedChat(response.data);
    } catch (error) {
      console.error("Error removing user from group:", error);
    }
  };

  // New function to handle notification click
  const handleNotificationClick = (notification) => {
    setSelectedChat(notification.chat); // Open the chat associated with the notification
    handleClose(); // Close the dropdown menu
  };

  return (
    <div className="chats-header">
      <div className="chatSection-header">
        {selectedChat.isGroupChat ? (
          <Button onClick={handleOpenModal} sx={{ textTransform: "none" }}>
            <h3 style={{ color: "white" }} className="chat-name">
              {selectedChat.chatName}
            </h3>
          </Button>
        ) : (
          <Button onClick={handleOpenModal} sx={{ textTransform: "none" }}>
            <h3 style={{ color: "white" }} className="chat-name">
              {otherUser?.name}
            </h3>
          </Button>
        )}
        <div className="bell-icon">
          <Button
            id="basic-button"
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            <NotificationsActiveIcon />
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            {notifications.length === 0 ? (
              <MenuItem disabled>No messages to display</MenuItem>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.content} {/* Display message content */}
                </MenuItem>
              ))
            )}
          </Menu>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          className="modal-box"
          sx={{
            width: "50%",
            maxHeight: "80vh", // Limits the height to 80% of the viewport
            overflowY: "auto", // Ensures scrolling when content exceeds height
          }}
        >
          <Avatar
            alt={selectedChat.chatName}
            src={selectedChat.isGroupChat ? groupPic : otherUser?.pic}
            className="profile-avatar"
          />
          <h2 style={{ marginBottom: "20px" }}>
            {selectedChat.isGroupChat ? selectedChat.chatName : otherUser?.name}
          </h2>
          <p style={{ marginBottom: "20px" }}>
            Created: {new Date(selectedChat.createdAt).toLocaleDateString()}
          </p>
          {selectedChat.isGroupChat && (
            <p style={{ marginBottom: "20px" }}>
              Group Admin: {selectedChat.groupAdmin.name}
            </p>
          )}
          {isGroupAdmin && selectedChat.isGroupChat && (
            <>
              <TextField
                label="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                fullWidth
                style={{ marginBottom: "10px" }}
              />
              <Button
                onClick={handleChangeGroupName}
                style={{ marginBottom: "10px" }}
              >
                Change Group Name
              </Button>
              <TextField
                label="Search Users"
                value={userSearch}
                onChange={handleUserSearch}
                fullWidth
              />
              {loading ? (
                <CircularProgress />
              ) : (
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
              )}

              <div className="selected-users">
                {selectedUsers.map((user) => (
                  <Chip
                    key={user._id}
                    avatar={<Avatar src={user.pic} alt={user.name} />}
                    label={user.name}
                    onDelete={() => handleRemoveUser(user._id)}
                    sx={{ marginBottom: "20px" }}
                  />
                ))}
              </div>
              <Button onClick={handleAddUsersToGroup}>Add Users</Button>
              <div className="group-users">
                {selectedChat.users.map((user) => (
                  <div
                    className="user-item"
                    key={user._id}
                    style={{ marginBottom: "10px" }}
                  >
                    <Avatar src={user.pic} alt={user.name} />
                    <h2>{user.name}</h2>
                    {isGroupAdmin && user._id !== currentUserId ? (
                      <Button
                        onClick={() => handleRemoveUserFromGroup(user._id)}
                      >
                        <DeleteIcon />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
          {selectedChat.isGroupChat && (
            <Button onClick={() => handleRemoveUserFromGroup(currentUserId)}>
              Leave Group
            </Button>
          )}
          <Button onClick={handleCloseModal}>Close</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default ChatHeader;
