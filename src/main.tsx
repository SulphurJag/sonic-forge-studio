
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize browser-compatible services
console.log('Audio context initialized successfully');

createRoot(document.getElementById("root")!).render(<App />);
