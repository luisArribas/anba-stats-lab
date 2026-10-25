import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "generate_dataset.py");
    const pythonExe = "C:\\Users\\luisr\\anaconda3\\python.exe";
    const { stdout } = await execFileAsync(pythonExe, [scriptPath], {
      timeout: 60000,
    });
    return NextResponse.json({ ok: true, output: stdout });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error sincronizando datos" },
      { status: 500 }
    );
  }
}
