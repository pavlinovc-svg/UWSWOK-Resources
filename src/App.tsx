import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { OrgPage } from "./pages/OrgPage";
import { Ask } from "./pages/Ask";
import { Login } from "./pages/Login";
import { Demo } from "./pages/Demo";
import { Staff } from "./pages/Staff";
import { Admin } from "./pages/Admin";
import { OnTheWay } from "./pages/OnTheWay";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/org/:slug" element={<OrgPage />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/login" element={<Login />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/on-the-way" element={<OnTheWay />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
