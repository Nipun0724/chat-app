import React, { useState } from 'react';
import axios from 'axios';

const Chats = () => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateGroupChat = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found in localStorage');
        return;
      }

      const response = await axios.post('http://localhost:8800/group', {
        name: groupName,
        users: JSON.stringify(users.split(',').map(user => user.trim())), // Convert comma-separated users to an array
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(response)
      setSuccess('Group chat created successfully');
      setError('');
      setGroupName('');
      setUsers('');
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating group chat');
      setSuccess('');
    }
  };

  return (
    <div>
             <h2>Create Group Chat</h2>
             {error && <p style={{ color: 'red' }}>{error}</p>}
             {success && <p style={{ color: 'green' }}>{success}</p>}
             <input
               type="text"
               placeholder="Group Name"
               value={groupName}
               onChange={(e) => setGroupName(e.target.value)}
             />
             <input
               type="text"
               placeholder="Users (comma-separated emails)"
               value={users}
               onChange={(e) => setUsers(e.target.value)}
             />
             <button onClick={handleCreateGroupChat}>Create Group Chat</button>
           </div>
  )
};
export default Chats;
     
