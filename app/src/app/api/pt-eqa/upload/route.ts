import { NextRequest, NextResponse } from "next/server";
import { processUniversalCSV } from "@/lib/universal-csv-processor";
import {
  evaluateMultipleRecordsWithAssignedValues,
  generateSummary,
} from "@/lib/pt-eqa-analysis";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const content = await file.text();
    const filename = file.name;

    const parsed = processUniversalCSV(content, filename);

    if (parsed.validRecords === 0) {
      return NextResponse.json(
        { error: "No valid records found in file" },
        { status: 400 }
      );
    }

    // Evaluate
    const { results: ptEqaResults, assignedValues } =
      evaluateMultipleRecordsWithAssignedValues(parsed.records);

    const summary = generateSummary(ptEqaResults);
    summary.assignedValues = assignedValues;

    return NextResponse.json({
      metadata: {
        filesLoaded: [filename],
        totalRecords: parsed.validRecords,
        uniqueModels: parsed.modelCodes,
        evaluations: ptEqaResults.length,
      },
      files: [
        {
          filename: parsed.filename,
          format: parsed.format,
          totalRecords: parsed.totalRecords,
          validRecords: parsed.validRecords,
          modelCodes: parsed.modelCodes,
          statistics: Object.fromEntries(
            Object.entries(parsed.statistics).map(([key, stats]) => [
              key,
              { mean: stats.mean, std: stats.std, count: stats.count },
            ])
          ),
        },
      ],
      ptEqa: {
        results: ptEqaResults,
        summary,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
