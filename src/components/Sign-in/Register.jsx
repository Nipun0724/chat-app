import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sign-in.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pic, setPic] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const ENDPOINT =
    process.env.NODE_ENV === "production"
      ? "https://chat-app-0hnv.onrender.com"
      : "http://localhost:8800";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${ENDPOINT}/register`,
        { name, email, password, pic },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201) {
        const data = response.data;
        localStorage.setItem("token", data.token);
        alert("Registration successful!");
        navigate("/");
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
      console.error("There was an error with the registration request:", error);
    }
  };

  const postDetails = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const response = await axios.post(`${ENDPOINT}/upload/pic`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPic(response.data.picUrl);
      console.log(response.data.picUrl);
    } catch (error) {
      console.error("There was an error uploading the file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <form className="login" onSubmit={handleSubmit}>
          <h2>Register</h2>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            id="password"
            name="password"
            className="input"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="file"
            id="picture"
            name="picture"
            placeholder="Choose file"
            accept="image/*"
            onChange={(e) => postDetails(e.target.files[0])}
          />
          <div>
            <input
              className="button input"
              type="submit"
              value="Submit"
              disabled={isUploading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
