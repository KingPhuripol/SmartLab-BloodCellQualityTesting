"use client";

import {
  BookOpenCheck,
  Settings2,
  FileSpreadsheet,
  ArrowLeft,
  Calculator,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Collapsible from "@/components/Collapsible";
import Link from "next/link";

export default function PTEQAMethodPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/pt-eqa"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          กลับสู่หน้าประเมินผล (Back to Wizard)
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-start gap-5 mb-6">
            <div className="p-4 bg-blue-100 rounded-xl">
              <BookOpenCheck className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                คู่มือวิธีการประเมินคุณภาพ (Evaluation Method)
              </h1>
              <p className="text-slate-600 mt-2 text-lg leading-relaxed">
                รายละเอียดขั้นตอนการประเมินคุณภาพห้องปฏิบัติการ (PT:EQA)
                ตามมาตรฐานสากล ที่ระบบใช้ในการคำนวณและวิเคราะห์ผล
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-5 border border-blue-100 rounded-xl bg-blue-50/50">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  เกณฑ์การตัดเกรด
                </div>
              </div>
              <div className="text-sm font-bold text-blue-900">
                |Z| ≤ 0.5 / 1.0 / 2.0 / 3.0
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Excellent → Serious
              </div>
            </div>
            <div className="p-5 border border-green-100 rounded-xl bg-green-50/50">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider">
                  การจัดการข้อมูล
                </div>
              </div>
              <div className="text-sm font-bold text-green-900">
                CSV Import & Export
              </div>
              <div className="text-xs text-green-600 mt-1">
                รองรับไฟล์จากเครื่องวิเคราะห์
              </div>
            </div>
            <div className="p-5 border border-purple-100 rounded-xl bg-purple-50/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  การแก้ไข (CAPA)
                </div>
              </div>
              <div className="text-sm font-bold text-purple-900">
                Review & Sign-off
              </div>
              <div className="text-xs text-purple-600 mt-1">
                บันทึกสาเหตุและการแก้ไข
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Collapsible
              title="1. เตรียมและเลือกข้อมูล (Prepare & Select Data)"
              defaultOpen
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-4 bg-slate-50 text-sm text-slate-700 space-y-3">
                <p>
                  ขั้นตอนแรกคือการนำเข้าข้อมูลผลการตรวจวิเคราะห์จากห้องปฏิบัติการ
                  โดยระบบรองรับไฟล์ CSV ที่มีโครงสร้างดังนี้:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-bold text-slate-900">
                      คอลัมน์ที่จำเป็น:
                    </span>{" "}
                    Lab Code, Brand code, Model code, และพารามิเตอร์ต่างๆ (RBC,
                    WBC, PLT, Hb, Hct, MCV, MCH, MCHC)
                  </li>
                  <li>
                    <span className="font-bold text-slate-900">
                      การทำความสะอาดข้อมูล (Data Cleaning):
                    </span>{" "}
                    ระบบจะตรวจสอบและแจ้งเตือนหากพบค่าว่าง (Null) หรือค่าศูนย์
                    (Zero) ที่ผิดปกติ
                  </li>
                  <li>
                    <span className="font-bold text-slate-900">
                      การจัดกลุ่ม (Grouping):
                    </span>{" "}
                    ระบบจะแยกกลุ่มการประเมินตามรุ่นเครื่อง (Model code)
                    โดยอัตโนมัติ เพื่อให้เกิดการเปรียบเทียบที่ยุติธรรม
                    (Like-for-like evaluation)
                  </li>
                </ul>
              </div>
            </Collapsible>

            <Collapsible
              title="2. ตรวจสอบโครงสร้างและกำหนดเกณฑ์ (Validate & Criteria)"
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-4 bg-slate-50 text-sm text-slate-700 space-y-3">
                <p>
                  ผู้ใช้งานสามารถตรวจสอบความถูกต้องของข้อมูลและปรับแต่งเกณฑ์การประเมินได้:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-bold text-slate-900">
                      ค่าความคลาดเคลื่อนที่ยอมรับได้ (Allowable Error - TEa):
                    </span>{" "}
                    กำหนดค่าความคลาดเคลื่อนสูงสุดที่ยอมรับได้สำหรับแต่ละพารามิเตอร์
                    (เช่น RBC = 0.2, WBC = 1.2)
                  </li>
                  <li>
                    <span className="font-bold text-slate-900">
                      เกณฑ์การตัดเกรด (Z-Score Thresholds):
                    </span>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                        <span className="font-bold text-green-700">
                          Excellent (ดีเยี่ยม)
                        </span>
                        <span className="font-mono">|Z| ≤ 0.5</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                        <span className="font-bold text-blue-700">
                          Good (ดี)
                        </span>
                        <span className="font-mono">|Z| ≤ 1.0</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200">
                        <span className="font-bold text-yellow-700">
                          Satisfactory (พอใช้)
                        </span>
                        <span className="font-mono">|Z| ≤ 2.0</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-orange-200">
                        <span className="font-bold text-orange-700">
                          Unsatisfactory (ไม่ผ่าน)
                        </span>
                        <span className="font-mono">|Z| ≤ 3.0</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border border-red-200 col-span-1 sm:col-span-2">
                        <span className="font-bold text-red-700">
                          Serious (ร้ายแรง)
                        </span>
                        <span className="font-mono">|Z| &gt; 3.0</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </Collapsible>

            <Collapsible
              title="3. คำนวณ Z-Score และตัดเกรด (Calculate & Grade)"
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-4 bg-slate-50 text-sm text-slate-700 space-y-3">
                <p>ระบบจะทำการคำนวณค่าทางสถิติสำหรับทุกรายการทดสอบ:</p>
                <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-center my-2">
                  Z-Score = (Measured Value − Reference Value) / Allowable Error
                </div>
                <p>
                  จากนั้นนำค่าสัมบูรณ์ <strong>|Z|</strong>{" "}
                  ไปเทียบกับเกณฑ์ที่กำหนดในขั้นตอนที่ 2
                  เพื่อระบุเกรดคุณภาพและสถานะ (Pass/Fail)
                </p>
              </div>
            </Collapsible>

            <Collapsible
              title="4. ตรวจสอบและแก้ไข (Review & CAPA)"
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-4 bg-slate-50 text-sm text-slate-700 space-y-3">
                <p>ขั้นตอนสำคัญในการควบคุมคุณภาพ:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    ระบบจะคัดกรองรายการที่ไม่ผ่านเกณฑ์ (
                    <span className="text-orange-600 font-bold">
                      Unsatisfactory
                    </span>{" "}
                    หรือ <span className="text-red-600 font-bold">Serious</span>
                    ) มาแสดงให้เห็นชัดเจน
                  </li>
                  <li>
                    ผู้ใช้งานต้องบันทึก{" "}
                    <strong>CAPA (Corrective and Preventive Actions)</strong>{" "}
                    หรือการปฏิบัติการแก้ไขและป้องกัน สำหรับทุกรายการที่มีปัญหา
                  </li>
                  <li>
                    สามารถระบุข้อคิดเห็นเพิ่มเติม (Comments)
                    และยืนยันความถูกต้อง (Approval) ก่อนปิดงาน
                  </li>
                </ul>
              </div>
            </Collapsible>

            <Collapsible
              title="5. อนุมัติและส่งออก (Approve & Export)"
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-4 bg-slate-50 text-sm text-slate-700 space-y-3">
                <p>ขั้นตอนสุดท้ายของกระบวนการ:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>สรุปผลภาพรวม (Pass Rate, Total Evaluations)</li>
                  <li>
                    ดาวน์โหลดรายงานผลฉบับสมบูรณ์ในรูปแบบ CSV
                    เพื่อนำไปจัดเก็บหรือส่งต่อ
                  </li>
                  <li>ข้อมูลจะถูกบันทึกในประวัติการทำงานของระบบ (Audit Log)</li>
                </ul>
              </div>
            </Collapsible>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span>
              กระบวนการนี้อ้างอิงตามมาตรฐาน ISO 15189 และเอกสารคู่มือ PT:EQA
              Evaluation Chart
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
