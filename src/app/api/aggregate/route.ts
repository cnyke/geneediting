import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

export async function GET() {
  try {
    let data = [];
    try {
      const file = await fs.readFile(DATA_FILE, 'utf-8');
      data = JSON.parse(file);
    } catch (e) {
      // File may not exist yet
      data = [];
    }

    // Aggregate counts for each question
    const counts = Array(11).fill(null).map(() => ({ yes: 0, no: 0 }));
    for (const entry of data) {
      (entry.answers || []).forEach((ans: boolean | null, idx: number) => {
        if (ans === true) counts[idx].yes++;
        else if (ans === false) counts[idx].no++;
      });
    }

    return NextResponse.json({ counts });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 