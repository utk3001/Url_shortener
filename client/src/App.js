import React from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./components/homePage/home";

function App() {
  return (
    <div className="">
      <Routes>
        <Route path='/' element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
