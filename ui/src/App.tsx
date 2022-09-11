import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/Dashboard";
import StartPage from "./pages/Start";
import StatsPage from "./pages/Stats";
import ProtocolPage from "./pages/Protocol";
import { ToastContainer, toast } from "react-toastify";

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
        <Routes>
          <Route path="/" element={<StartPage />}></Route>
          <Route path="/dashboard" element={<DashboardPage />}></Route>
          <Route path="/stats" element={<StatsPage />}></Route>
          <Route path="/protocol" element={<ProtocolPage />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
