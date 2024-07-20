import React, { useState, useEffect } from "react";
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
import ChatHeader from "../miscellaneous/ChatHeader";

const Hero = () => {
  const [groups, setGroups] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const navigate = useNavigate();

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  const token = localStorage.getItem("token");
  const decodedToken = parseJwt(token);
  const currentUserId = decodedToken.userId;

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8800/chats", {
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
  const updateGroup = (updatedGroup) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group._id === updatedGroup._id ? updatedGroup : group
      )
    );
    setSelectedChat(updatedGroup);
  };
  const fetchUser = async () => {
    const currentUserResponse = await axios.get(
      `http://localhost:8800/user/${currentUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const currentUser = currentUserResponse.data;

    try {
      const profileImageResponse = await axios.get(
        `http://localhost:8800/pic/${currentUser.email}`,
        {
          responseType: "blob",
        }
      );
      const reader = new FileReader();
      reader.onloadend = () => {
        currentUser.pic = reader.result;
        setCurrentUser(currentUser);
      };
      reader.onerror = () => {
        setCurrentUser(currentUser);
      };
      reader.readAsDataURL(profileImageResponse.data);
    } catch (error) {
      console.error("Error fetching profile image:", error);
      setCurrentUser(currentUser);
    }
  };
  useEffect(() => {
    fetchUser();
    fetchChats();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const result = await axios.post(
        `http://localhost:8800/search/${search}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const groupsWithImages = await Promise.all(
        result.data.map(async (group) => {
          try {
            const response = await axios.get(
              `http://localhost:8800/pic/${group.email}`,
              {
                responseType: "blob",
              }
            );
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
              reader.onloadend = () => {
                group.imageSrc = reader.result;
                resolve(group);
              };
              reader.onerror = reject;
              reader.readAsDataURL(response.data);
            });
          } catch (error) {
            console.error("Error fetching image:", error);
            return group;
          }
        })
      );
      setGroups(groupsWithImages);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (group) => {
    setSelectedChat(group);
  };

  const handleUserSearch = async (event) => {
    setUserSearch(event.target.value);
    try {
      const token = localStorage.getItem("token");
      const result = await axios.post(
        `http://localhost:8800/search/${event.target.value}`,
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
        "http://localhost:8800/chats",
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
        "http://localhost:8800/group",
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
        <img src="https://picsum.photos/536/354" alt="Logo" className="logo" />
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
        <div className="chat-box">
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
              <div>Loading...</div>
            ) : (
              groups.map((group, index) => (
                <Button key={index} onClick={() => handleSelectChat(group)}>
                  <UserItem group={group} currentUser={currentUser} />
                </Button>
              ))
            )}
          </div>
          <div className="chats">
            <ChatHeader
              selectedChat={selectedChat}
              currentUserId={currentUserId}
              setSelectedChat={updateGroup} // Pass it here
              token={token}
            />
          </div>
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
                src={currentUser.pic || "/static/images/avatar/default.jpg"}
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
