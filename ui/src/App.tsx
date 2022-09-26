// @ts-nocheck
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import DashboardPage from "./pages/Dashboard";
import StartPage from "./pages/Start";
import StatsPage from "./pages/Stats";
import ProtocolPage from "./pages/Protocol";
import { ToastContainer, toast } from "react-toastify";
import { useEffect } from "react";
import CustomRoutes from "./components/Routes";

const App: React.FC = () => {
  return (
    <div className="app">
      <ToastContainer
        position="bottom-center"
        autoClose={7000}
        hideProgressBar={false}
        newestOnTop={false}
        // closeOnClick
        onClick={() => {
          toast.dismiss();
          // setTimeout(() => {
          //   setIsCheckoutModalVisible(true)
          // }, 300)
        }}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <BrowserRouter>
        <CustomRoutes />
        {/* <Link to="/">
          <button className="btn">На главную</button>
        </Link> */}
      </BrowserRouter>
    </div>
  );
};

export default App;
