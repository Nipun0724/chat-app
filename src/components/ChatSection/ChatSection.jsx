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
  notifications,
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
          notifications={notifications}
        />
      </div>
      {selectedChat ? (
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
      ) : (
        <div className="placeholder-text">
          <p>Your Messages will be displayed here</p>
        </div>
      )}
      {isTyping ? (
        <Lottie
          options={defaultOptions}
          height={20}
          width={70}
          style={{
            marginBottom: "35px",
            marginTop: "-30px",
            marginLeft: 0,
            borderRadius: "20px",
          }}
        />
      ) : null}

      {selectedChat ? (
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
      ) : null}
    </div>
  );
};

export default ChatSection;
