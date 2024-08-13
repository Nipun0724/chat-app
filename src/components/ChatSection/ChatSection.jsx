import React, { useEffect, useRef } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatHeader from "../miscellaneous/ChatHeader";
import Avatar from "@mui/material/Avatar";
import Lottie from "react-lottie";
import animationData from "../../assets/typing.json";

const ChatSection = ({
  selectedChat,
  setSelectedChat,
  currentUserId,
  updateGroup,
  token,
  messages,
  newMessage,
  typingHandler,
  handleSendMessage,
  isTyping,
}) => {
  const messageContainerRef = useRef(null);
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages, selectedChat]);
  return (
    <div className="chats">
      <div className="chatSection-header">
        {window.innerWidth < 600 && (
          <ArrowBackIcon
            className="back-icon"
            onClick={() => setSelectedChat(null)}
          />
        )}
        <ChatHeader
          selectedChat={selectedChat}
          currentUserId={currentUserId}
          setSelectedChat={updateGroup}
          token={token}
        />
      </div>
      <div className="message-container" ref={messageContainerRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.sender._id === currentUserId ? "sent" : "received"
            }`}
          >
            {message.sender._id !== currentUserId && (
              <Avatar
                src={message.sender.pic}
                alt={message.sender.name}
                style={{ zIndex: "-1" }}
              />
            )}
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      {isTyping ? (
        <Lottie
          options={defaultOptions}
          height={20}
          width={70}
          style={{ marginBottom: 25, marginLeft: 0, borderRadius: "20px" }}
        />
      ) : null}

      <div className="message-input-container">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={typingHandler}
            className="message-input"
            required
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;
