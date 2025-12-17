import { NavLink } from "react-router-dom";
import type { ReactElement } from "react";
import "./Navbar.css";

type NavItem = {
  label: string;
  to: string;
  icon?: ReactElement;      
  end?: boolean;            
};

const NAV_ITEMS: NavItem[] = [
  { label: "Chat", to: "/chats", end: true },
  { label: "Settings", to: "/settings" },
];

const Navbar = () => {
  return (
    <nav className="navbar" aria-label="Primary">
      <div className="header-container">
        <h1 className="title">Chat Offline with your AI Personal Coach</h1>
        <div className="nav-list">
          {NAV_ITEMS.map(({ label, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
