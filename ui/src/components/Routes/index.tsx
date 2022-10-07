// @ts-nocheck
import DashboardPage from "@/pages/Dashboard";
import StartPage from "@/pages/Start";
import StatsPage from "@/pages/Stats";
import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

const CustomRoutes = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard");
  }, []);
  return (
    <Routes>
      <Route path="/" element={<StartPage />}></Route>
      <Route index path="/dashboard" element={<DashboardPage />}></Route>
      <Route path="/stats" element={<StatsPage />}></Route>
      {/* <Route path="/protocol" element={<ProtocolPage />}></Route> */}
    </Routes>
  );
};

export default CustomRoutes;
