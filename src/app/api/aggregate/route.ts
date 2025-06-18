import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface SubmissionEntry {
  answers: boolean[];
  timestamp: number;
}

export async function GET() {
  try {
    let data: SubmissionEntry[] = [];
    let dataSource = 'none';

    console.log('Aggregate request - Environment check:');
    console.log('- KV_REST_API_URL exists:', !!process.env.KV_REST_API_URL);
    console.log('- KV_REST_API_TOKEN exists:', !!process.env.KV_REST_API_TOKEN);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    // Try to get data from KV database first if running on Vercel
    if (process.env.KV_REST_API_URL) {
      console.log('Attempting to read from KV database...');
      try {
        const { kv } = await import('@vercel/kv');
        console.log('KV module imported successfully');
        
        const count = (await kv.get('submissions_count') as number) || 0;
        console.log('Found', count, 'submissions in KV database');
        
        for (let i = 0; i < count; i++) {
          const submission = await kv.get(`submission_${i}`) as SubmissionEntry | null;
          if (submission && submission.answers && Array.isArray(submission.answers)) {
            data.push(submission);
          }
        }
        console.log('Successfully loaded', data.length, 'entries from KV database');
        dataSource = 'kv';
      } catch (kvError) {
        console.error('KV database error details:', kvError);
        console.error('KV error message:', kvError instanceof Error ? kvError.message : 'Unknown KV error');
        // Fall back to file storage
        dataSource = 'kv_failed';
      }
    }

    // Fallback: Use file storage if KV failed or not available
    if (data.length === 0) {
      console.log('Attempting to read from file storage...');
      try {
        const file = await fs.readFile(DATA_FILE, 'utf-8');
        const parsedData = JSON.parse(file);
        if (Array.isArray(parsedData)) {
          data = parsedData.filter(entry => 
            entry && 
            entry.answers && 
            Array.isArray(entry.answers) && 
            typeof entry.timestamp === 'number'
          );
        }
        console.log('Successfully loaded', data.length, 'entries from file');
        dataSource = dataSource === 'kv_failed' ? 'file_fallback' : 'file';
      } catch (error) {
        console.log('File read error (expected if file doesn\'t exist):', error);
        data = [];
        dataSource = 'no_data';
      }
    }

    // Aggregate counts for each question
    const counts = Array(11).fill(null).map(() => ({ yes: 0, no: 0 }));
    for (const entry of data) {
      if (entry.answers && Array.isArray(entry.answers)) {
        entry.answers.forEach((ans: boolean | null, idx: number) => {
          if (idx < counts.length) {
            if (ans === true) counts[idx].yes++;
            else if (ans === false) counts[idx].no++;
          }
        });
      }
    }

    console.log('Returning aggregated counts:', counts);
    console.log('Data source:', dataSource, 'Total entries:', data.length);
    
    return NextResponse.json({ 
      counts, 
      metadata: { 
        totalEntries: data.length, 
        dataSource,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Aggregate API error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 