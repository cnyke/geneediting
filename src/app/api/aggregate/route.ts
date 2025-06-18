import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Try to import Vercel KV, fallback gracefully if not available
let kv: any = null;
try {
  kv = require('@vercel/kv').kv;
} catch {
  console.log('Vercel KV not available, using file storage');
}

export async function GET() {
  try {
    let data: any[] = [];

    // Try to get data from KV database first
    if (kv && process.env.KV_REST_API_URL) {
      try {
        const count = await kv.get('submissions_count') || 0;
        console.log('Found', count, 'submissions in KV database');
        
        for (let i = 0; i < count; i++) {
          const submission = await kv.get(`submission_${i}`);
          if (submission) {
            data.push(submission);
          }
        }
        console.log('Successfully loaded', data.length, 'entries from KV database');
      } catch (kvError) {
        console.error('KV database error:', kvError);
        // Fall back to file storage
      }
    }

    // Fallback: Use file storage if KV failed or not available
    if (data.length === 0) {
      try {
        const file = await fs.readFile(DATA_FILE, 'utf-8');
        data = JSON.parse(file);
        console.log('Successfully loaded', data.length, 'entries from file');
      } catch (error) {
        console.log('File read error (expected if file doesn\'t exist):', error);
        data = [];
      }
    }

    // Aggregate counts for each question
    const counts = Array(11).fill(null).map(() => ({ yes: 0, no: 0 }));
    for (const entry of data) {
      (entry.answers || []).forEach((ans: boolean | null, idx: number) => {
        if (ans === true) counts[idx].yes++;
        else if (ans === false) counts[idx].no++;
      });
    }

    console.log('Returning aggregated counts:', counts);
    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Aggregate API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 