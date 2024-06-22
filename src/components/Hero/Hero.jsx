import axios from "axios";
import React from "react";

const Hero = () => {
  async function fetchUsers() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await axios.get('http://localhost:8800/search/Nipun', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const users = response.data;
    console.log(users);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

fetchUsers();

  return (
    <div>
      <h1>Hero Page</h1>
    </div>
  );
};

export default Hero;
