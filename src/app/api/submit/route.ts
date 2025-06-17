import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.answers) || body.answers.length !== 11) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Read existing data
    let data = [];
    try {
      const file = await fs.readFile(DATA_FILE, 'utf-8');
      data = JSON.parse(file);
    } catch (e) {
      // File may not exist yet
      data = [];
    }

    // Add new entry
    data.push({ answers: body.answers, timestamp: Date.now() });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 