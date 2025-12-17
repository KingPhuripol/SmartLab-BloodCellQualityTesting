"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Home,
  LayoutDashboard,
  FileSpreadsheet,
  LogIn,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", label: "หน้าหลัก", sub: "Home", icon: Home },
    {
      path: "/dashboard",
      label: "ภาพรวม",
      sub: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/pt-eqa",
      label: "ประเมินผล",
      sub: "PT:EQA",
      icon: FileSpreadsheet,
    },
    {
      path: "/pt-eqa/convert",
      label: "แปลงไฟล์",
      sub: "Converter",
      icon: RefreshCw,
    },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-xl leading-none tracking-tight">
                  SmartLab{" "}
                  <span className="text-[10px] text-slate-400 font-normal">
                    v0.1.3
                  </span>
                </span>
                <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase mt-1">
                  Quality Control
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${
                      isActive
                        ? "text-blue-700 bg-blue-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <div className="flex flex-col leading-none">
                    <span className="mb-0.5">{item.label}</span>
                    <span
                      className={`text-[10px] font-normal ${
                        isActive
                          ? "text-blue-500"
                          : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    >
                      {item.sub}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full transform scale-x-100 transition-transform" />
                  )}
                </Link>
              );
            })}

            <div className="h-8 w-px bg-slate-200 mx-3" />

            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn className="h-4 w-4" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-lg animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block px-4 py-3 rounded-xl text-base font-medium transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`h-5 w-5 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <div>
                      <div className="leading-none mb-1">{item.label}</div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-blue-500" : "text-slate-500"
                        }`}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ (Sign in)
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
