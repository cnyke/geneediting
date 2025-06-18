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
    console.log('Processing submission:', newEntry);

    // Check environment variables for debugging
    console.log('Environment check:');
    console.log('- KV_REST_API_URL exists:', !!process.env.KV_REST_API_URL);
    console.log('- KV_REST_API_TOKEN exists:', !!process.env.KV_REST_API_TOKEN);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    // Use KV database in production if available
    if (process.env.KV_REST_API_URL) {
      console.log('Attempting to use KV database...');
      try {
        const { kv } = await import('@vercel/kv');
        console.log('KV module imported successfully');
        
        // Get existing entries count for unique key
        console.log('Getting submissions count...');
        const count = (await kv.get('submissions_count') as number) || 0;
        console.log('Current submissions count:', count);
        
        // Store the submission
        console.log('Storing submission...');
        await kv.set(`submission_${count}`, newEntry);
        console.log('Submission stored successfully');
        
        console.log('Updating count...');
        await kv.set('submissions_count', count + 1);
        console.log('Count updated successfully');
        
        console.log('Successfully stored in KV database');
        return NextResponse.json({ success: true, storage: 'kv', count: count + 1 });
      } catch (kvError) {
        console.error('KV database error details:', kvError);
        console.error('KV error message:', kvError instanceof Error ? kvError.message : 'Unknown KV error');
        console.error('KV error stack:', kvError instanceof Error ? kvError.stack : 'No stack trace');
        
        // Return error instead of silent success
        return NextResponse.json({ 
          error: 'Failed to store data in database', 
          details: kvError instanceof Error ? kvError.message : 'KV database unavailable',
          storage: 'kv_failed'
        }, { status: 500 });
      }
    }

    console.log('KV not available, using file storage...');
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
      return NextResponse.json({ success: true, storage: 'file', count: data.length });
    } catch (writeError) {
      console.error('File write error:', writeError);
      // In production environments where file writing fails, return proper error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ 
          error: 'Failed to store data - production environment is read-only and KV database failed', 
          details: 'Please check KV database configuration',
          storage: 'file_failed'
        }, { status: 500 });
      }
      throw writeError;
    }
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Server error', details: errorMessage }, { status: 500 });
  }
} 