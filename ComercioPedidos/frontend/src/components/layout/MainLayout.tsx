import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import SessionBoundary from "../SessionBoundary";

function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <Header />

        <main className="main-content">
          <SessionBoundary>
            <Outlet />
          </SessionBoundary>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
