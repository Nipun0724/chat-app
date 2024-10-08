import { Route, Routes } from "react-router-dom";
import Home from "./components/Hero/Hero.jsx";
import Login from "./components/Sign-in/Login.jsx";
import Register from "./components/Sign-in/Register.jsx";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;
