
# Database Setup Guide

## Setting up the Supabase Database Schema

This application requires a `processing_jobs` table in your Supabase database to track audio processing jobs.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" tab
3. Copy and paste the contents of `supabase/migrations/20250601_create_processing_jobs_table.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

### Verifying the Setup

After running the migration, you should see:
- A `processing_jobs` table in your database
- Row Level Security (RLS) enabled
- Appropriate indexes for performance
- Policies for user data isolation

### Table Structure

The `processing_jobs` table includes:
- `id`: Unique identifier (UUID)
- `created_at`: Timestamp when job was created
- `updated_at`: Timestamp when job was last modified
- `user_id`: Reference to the user who created the job (optional for anonymous users)
- `file_name`: Name of the audio file
- `file_size`: Size of the file in bytes
- `settings`: JSON object containing processing parameters
- `status`: Current job status (pending, processing, completed, failed)
- `result_url`: URL to the processed audio file (when completed)
- `processing_time`: Time taken to process the audio (in seconds)
- `error_message`: Error details if processing failed

### Testing the Setup

Once the table is created, the Supabase Processing Queue tab in the application should work without errors.
