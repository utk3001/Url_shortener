import React from "react";
import AppRoutes from "./routes";
import Navbar from "../components/layout/Navbar";

const App = () => {
  return (
    <>
      <Navbar />
      <AppRoutes />
    </>
  );
};

export default App;
