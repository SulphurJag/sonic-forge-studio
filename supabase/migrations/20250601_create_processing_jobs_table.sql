
-- Create the processing_jobs table for audio processing queue management
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result_url TEXT,
    processing_time NUMERIC,
    error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own jobs
CREATE POLICY "Users can view own processing jobs" ON processing_jobs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own jobs
CREATE POLICY "Users can insert own processing jobs" ON processing_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own jobs
CREATE POLICY "Users can update own processing jobs" ON processing_jobs
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own processing jobs" ON processing_jobs
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
