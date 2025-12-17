import { NextRequest, NextResponse } from "next/server";
import {
  processUniversalCSV,
  exportToStandardCSV,
} from "@/lib/universal-csv-processor";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name;
    let content: string;

    // Handle Excel files
    if (
      filename.toLowerCase().endsWith(".xlsx") ||
      filename.toLowerCase().endsWith(".xls")
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      content = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      content = await file.text();
    }

    const parsed = processUniversalCSV(content, filename);
    const standardCSV = exportToStandardCSV(parsed.records);

    return NextResponse.json({
      originalFilename: filename,
      parsed,
      standardCSV,
    });
  } catch (error: any) {
    console.error("Conversion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
