import React, { useState } from "react";
import "./Sign-in.css";
import axios from "axios";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pic, setPic] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(pic);
    try {
      const response = await axios.post(
        "http://localhost:8800/register",
        {
          name,
          email,
          password,
          pic,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        const data = response.data;
        localStorage.setItem("token", data.token);
        alert("Registration successful!");
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
      console.error("There was an error with the registration request:", error);
    }
  };

  const postDetails = async (pics) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPic(reader.result);
    };
    reader.readAsDataURL(pics);
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
            <input className="button input" type="submit" value="Submit" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
