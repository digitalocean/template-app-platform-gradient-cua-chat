"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  CameraIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigationItems = [
  { name: "Screenshotter", href: "/screenshotter", icon: CameraIcon },
  { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="ml-auto flex items-center">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-white/30 text-white shadow-sm font-semibold"
                    : "text-white hover:bg-white/20 hover:text-white hover:shadow-sm"
                }
              `}
              style={{ color: "white", textDecoration: "none" }}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Mobile Navigation Button */}
      <div className="md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="text-white hover:text-white p-2 rounded-md hover:bg-white/20 transition-colors"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-gradient-to-r from-[#1a82fa] to-[#1464d2] border-t border-white/20 md:hidden animate-in slide-in-from-top duration-200">
          <div className="px-6 py-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors block
                    ${
                      isActive
                        ? "bg-white/30 text-white shadow-sm font-semibold"
                        : "text-white hover:bg-white/20 hover:text-white hover:shadow-sm"
                    }
                  `}
                  style={{ color: "white", textDecoration: "none" }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
