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

const App: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, []);
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
        <Link to="/">
          <button className="btn">На главную</button>
        </Link>
        <Routes>
          <Route index={true} path="/" element={<StartPage />}></Route>
          <Route path="/dashboard" element={<DashboardPage />}></Route>
          <Route path="/stats" element={<StatsPage />}></Route>
          <Route path="/protocol" element={<ProtocolPage />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
