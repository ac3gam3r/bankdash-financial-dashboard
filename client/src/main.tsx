import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import TransactionsPage from "@/pages/Transactions";
import AccountsPage from "@/pages/Accounts";
import BonusesPage from "@/pages/Bonuses";
import Sidebar from "@/components/Sidebar";

function Protected({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
        <Route path="/accounts" element={<Protected><AccountsPage /></Protected>} />
        <Route path="/bonuses" element={<Protected><BonusesPage /></Protected>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
