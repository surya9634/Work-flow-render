import React from "react";
import { Menu } from "lucide-react";
import UserDropdown from "./UserDropdown";
import NotificationDropdown from "./NotificationDropDown";

const Navbar = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg "
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Left side - Empty div to maintain layout */}
          <div className="flex-1 flex items-center">
            {/* Search bar removed */}
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown />

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;