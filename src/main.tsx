
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Supabase credentials are now hardcoded in the application
// Additional credentials can still be provided through environment variables or localStorage

createRoot(document.getElementById("root")!).render(<App />);
