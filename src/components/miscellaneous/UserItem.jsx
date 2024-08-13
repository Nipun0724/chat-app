import React, { useEffect, useState } from "react";
import { Avatar } from "@mui/material";
import "../Hero/Hero.css";
import groupPic from "../../assets/2352167.png";

const UserItem = ({ group, currentUser }) => {
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!currentUser || !group || !group.users) return;

      const other = group.users.find((user) => user._id !== currentUser._id);
      setOtherUser(other);
    };

    fetchOtherUser();
  }, [group, currentUser]);

  if (!currentUser) {
    return null;
  }

  const latestMessageText =
    typeof group.latestMessage === "object"
      ? group.latestMessage.content
      : group.latestMessage;

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
        <p>{latestMessageText || "No messages yet"}</p>
      </div>
    </div>
  );
};

export default UserItem;
