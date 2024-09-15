import React, { useState, useEffect } from "react";
import "./Sign-in.css";
import right from "../../assets/chevron-right.png";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const ENDPOINT =
    process.env.NODE_ENV === "production"
      ? "https://chat-app-0hnv.onrender.com"
      : "http://localhost:8800";
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${ENDPOINT}/login`,
        {
          email,
          password,
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
        navigate("/");
      } else {
        alert("Login failed. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
      console.error("There was an error with the login request:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <form className="login" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <input
            type="email"
            id="email"
            name="email"
            className="input"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            id="password"
            className="input"
            name="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <input className="button input" type="submit" value="Submit" />
            <Link to="/register" style={{ textDecoration: "none" }}>
              Register here <img src={right} alt="" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
