"use client";

import Link from "next/link";
import {
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  ClipboardList,
  ArrowRight,
  Activity,
  FileText,
  CheckCircle2,
  Zap,
  LayoutDashboard,
  FileCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
                <Activity className="w-4 h-4 mr-2" />
                SmartLab • ระบบบริหารคุณภาพห้องปฏิบัติการ
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                ระบบประเมินคุณภาพห้องปฏิบัติการโลหิตวิทยา
                <span className="block text-blue-600 mt-2 text-3xl lg:text-4xl">
                  (Laboratory Quality Assessment)
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                ระบบช่วยตรวจสอบความถูกต้องของผลแล็บ เปรียบเทียบค่ามาตรฐาน
                วิเคราะห์ผลทางสถิติ (Z-Score) และออกรายงานผลให้อัตโนมัติ
                ใช้งานง่าย แม่นยำ ลดความผิดพลาด
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/pt-eqa"
                  className="inline-flex justify-center items-center px-6 py-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  เริ่มการประเมิน (Start Evaluation)
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center items-center px-6 py-4 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  ดูภาพรวมผลงาน (Dashboard)
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                  อ้างอิงมาตรฐานสากล
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  รายงานผลอัตโนมัติ
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-50 rounded-tr-full -ml-12 -mb-12 opacity-50"></div>

                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
                  ขั้นตอนการทำงาน (Workflow)
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "นำเข้าข้อมูล (Import)",
                      desc: "อัปโหลดไฟล์ผลแล็บ (CSV) เข้าสู่ระบบ",
                      color: "bg-blue-100 text-blue-700",
                    },
                    {
                      step: 2,
                      title: "ตรวจสอบ (Validate)",
                      desc: "ระบบช่วยเช็คความถูกต้องของข้อมูลเบื้องต้น",
                      color: "bg-indigo-100 text-indigo-700",
                    },
                    {
                      step: 3,
                      title: "ประเมินผล (Evaluate)",
                      desc: "คำนวณคะแนนและตัดเกรดคุณภาพอัตโนมัติ",
                      color: "bg-purple-100 text-purple-700",
                    },
                    {
                      step: 4,
                      title: "รายงาน (Report)",
                      desc: "สรุปผลการประเมินพร้อมพิมพ์รายงานส่งได้เลย",
                      color: "bg-green-100 text-green-700",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${item.color} mr-4`}
                      >
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            จุดเด่นของระบบ (Highlights)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 border rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
              <CheckCircle2 className="h-8 w-8 text-blue-600 mb-3" />
              <div className="font-semibold text-gray-900 text-lg">
                มาตรฐานสากล
              </div>
              <div className="text-sm text-gray-600 mt-2">
                อ้างอิงเกณฑ์การประเมินที่เป็นที่ยอมรับ (ISO/EQA Charts)
              </div>
            </div>
            <div className="p-5 border rounded-lg bg-gray-50 hover:bg-green-50 transition-colors">
              <Zap className="h-8 w-8 text-green-600 mb-3" />
              <div className="font-semibold text-gray-900 text-lg">
                รวดเร็ว & แม่นยำ
              </div>
              <div className="text-sm text-gray-600 mt-2">
                ลดเวลาการคำนวณด้วยระบบอัตโนมัติจากไฟล์ CSV
              </div>
            </div>
            <div className="p-5 border rounded-lg bg-gray-50 hover:bg-purple-50 transition-colors">
              <LayoutDashboard className="h-8 w-8 text-purple-600 mb-3" />
              <div className="font-semibold text-gray-900 text-lg">
                ดูง่าย เข้าใจง่าย
              </div>
              <div className="text-sm text-gray-600 mt-2">
                แสดงผลในรูปแบบกราฟและตารางสรุปผลที่ชัดเจน
              </div>
            </div>
            <div className="p-5 border rounded-lg bg-gray-50 hover:bg-orange-50 transition-colors">
              <FileCheck className="h-8 w-8 text-orange-600 mb-3" />
              <div className="font-semibold text-gray-900 text-lg">ครบวงจร</div>
              <div className="text-sm text-gray-600 mt-2">
                ตั้งแต่รับข้อมูล ตรวจสอบ แก้ไข (CAPA) จนถึงปิดงาน
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
