import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "react-toastify/dist/ReactToastify.min.css";
// import './samples/node-api'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// postMessage({ payload: "removeLoading" }, "*");
