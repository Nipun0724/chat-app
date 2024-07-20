import React, { useEffect, useState } from "react";
import { Avatar } from "@mui/material";
import axios from "axios";
import "../Hero/Hero.css";
import groupPic from "../../assets/2352167.png";

const UserItem = ({ group, currentUser }) => {
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      // Ensure currentUser exists before accessing _id
      if (!currentUser) return;

      const otherUser = group.users.find(
        (user) => user._id !== currentUser._id
      );
      if (otherUser) {
        try {
          const profileImageResponse = await axios.get(
            `http://localhost:8800/pic/${otherUser.email}`,
            {
              responseType: "blob",
            }
          );
          const reader = new FileReader();
          reader.onloadend = () => {
            setOtherUser({
              ...otherUser,
              pic: reader.result,
            });
          };
          reader.onerror = () => {
            setOtherUser(otherUser);
          };
          reader.readAsDataURL(profileImageResponse.data);
        } catch (error) {
          console.error("Error fetching profile image:", error);
          setOtherUser(otherUser);
        }
      } else {
        setOtherUser(null);
      }
    };

    fetchOtherUser();
  }, [group.users, currentUser]);

  if (!currentUser) {
    return null; // or render a loading state or placeholder
  }

  return (
    <div className="group-item">
      <Avatar
        alt={group.isGroupChat ? group.name : otherUser?.name}
        src={group.isGroupChat ? groupPic : otherUser?.pic}
      />
      <div className="group-text">
        {group.isGroupChat ? (
          <h3>{group.chatName}</h3>
        ) : (
          <h3>{otherUser?.name}</h3>
        )}
        <p>{group.latestMessage || "No messages yet"}</p>
      </div>
    </div>
  );
};

export default UserItem;
