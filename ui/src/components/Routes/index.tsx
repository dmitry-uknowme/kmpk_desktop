// @ts-nocheck
import DashboardPage from "@/pages/Dashboard";
import StartPage from "@/pages/Start";
import StatsPage from "@/pages/Stats";
import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

const CustomRoutes = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, []);
  return (
    <Routes>
      <Route index={true} path="/" element={<StartPage />}></Route>
      <Route path="/dashboard" element={<DashboardPage />}></Route>
      <Route path="/stats" element={<StatsPage />}></Route>
      {/* <Route path="/protocol" element={<ProtocolPage />}></Route> */}
    </Routes>
  );
};

export default CustomRoutes;
