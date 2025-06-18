import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface SubmissionEntry {
  answers: boolean[];
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received body:', body);
    
    if (!Array.isArray(body.answers) || body.answers.length !== 11) {
      console.log('Invalid input - answers:', body.answers, 'length:', body.answers?.length);
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const newEntry: SubmissionEntry = { answers: body.answers, timestamp: Date.now() };

    // Use KV database in production if available
    if (process.env.KV_REST_API_URL) {
      try {
        const { kv } = await import('@vercel/kv');
        // Get existing entries count for unique key
        const count = (await kv.get('submissions_count') as number) || 0;
        
        // Store the submission
        await kv.set(`submission_${count}`, newEntry);
        await kv.set('submissions_count', count + 1);
        
        console.log('Successfully stored in KV database');
        return NextResponse.json({ success: true });
      } catch (kvError) {
        console.error('KV database error:', kvError);
        // Fall back to returning success without storage
        return NextResponse.json({ success: true, message: 'Submission received' });
      }
    }

    // Development/fallback: Use file storage
    let data: SubmissionEntry[] = [];
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
      console.log('Successfully read existing data, entries:', data.length);
    } catch (error) {
      console.log('File read error (expected if file doesn\'t exist):', error);
      data = [];
    }

    data.push(newEntry);
    console.log('Adding new entry:', newEntry);
    
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
      console.log('Successfully wrote to file');
    } catch (writeError) {
      console.error('File write error:', writeError);
      // In production environments where file writing fails, still return success
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: true, message: 'Submission received (read-only environment)' });
      }
      throw writeError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Server error', details: errorMessage }, { status: 500 });
  }
} 