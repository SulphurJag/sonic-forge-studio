
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check for Supabase environment variables
if ((!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && 
    (!localStorage.getItem('VITE_SUPABASE_URL') || !localStorage.getItem('VITE_SUPABASE_ANON_KEY'))) {
  console.warn(
    'Supabase environment variables are missing. ' +
    'Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'in your environment variables, .env file, or through the configuration helper.'
  );
}

createRoot(document.getElementById("root")!).render(<App />);
