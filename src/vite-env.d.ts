
/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Add TypeScript declarations for modules without @types
declare module '@tanstack/react-query' {
  export interface QueryClient {
    new(options?: any): any;
    invalidateQueries: (options: any) => Promise<void>;
    setQueryData: (queryKey: any, updater: any) => void;
    getQueryData: (queryKey: any) => any;
  }
  
  export const QueryClient: QueryClient;
  export const QueryClientProvider: React.FC<{
    client: any;
    children: React.ReactNode;
  }>;
  
  export function useQuery(options: any): any;
  export function useMutation(options: any): any;
}

declare module 'react-router-dom' {
  export interface RouteProps {
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }
  
  export const BrowserRouter: React.FC<{ children: React.ReactNode }>;
  export const Routes: React.FC<{ children: React.ReactNode }>;
  export const Route: React.FC<RouteProps>;
  export function useNavigate(): (path: string) => void;
  export function useLocation(): {
    pathname: string;
    search: string;
    hash: string;
  };
  export function Link(props: any): JSX.Element;
}

declare module 'lucide-react' {
  import { FC, SVGAttributes } from 'react'
  export interface LucideProps extends SVGAttributes<SVGElement> {
    color?: string
    size?: string | number
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
  }
  
  export type LucideIcon = FC<LucideProps>
  
  // Export icons used in the project
  export const Play: LucideIcon
  export const Pause: LucideIcon
  export const SkipBack: LucideIcon
  export const Volume2: LucideIcon
  export const Volume1: LucideIcon
  export const VolumeX: LucideIcon
  export const Upload: LucideIcon
  export const File: LucideIcon
  export const Settings: LucideIcon
  export const ListOrdered: LucideIcon
  export const Download: LucideIcon
  export const Loader2: LucideIcon
  export const CheckCircle: LucideIcon
  export const AlertCircle: LucideIcon
  export const Clock: LucideIcon
  export const AlertTriangle: LucideIcon
  export const Lightbulb: LucideIcon
  export const Music: LucideIcon
  export const Info: LucideIcon
  export const Zap: LucideIcon
  export const Wand2: LucideIcon
  export const Circle: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronLeft: LucideIcon
  export const Check: LucideIcon
  export const X: LucideIcon
  export const Cpu: LucideIcon
  export const Cloud: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const Search: LucideIcon
  export const Dot: LucideIcon
  export const MoreHorizontal: LucideIcon
  export const GripVertical: LucideIcon
  export const PanelLeft: LucideIcon
}

// Fix missing @huggingface/transformers declarations
declare module '@huggingface/transformers' {
  export * from '@huggingface/transformers'
  
  export function pipeline(
    task: string,
    model: string,
    options?: any
  ): Promise<any>;
  
  export const env: {
    backends: {
      onnx: {
        wasm: {
          wasmPaths: string;
        };
      };
    };
  };
}

// Define missing services
declare module '@/services/ai' {
  export const aiAudioProcessor: {
    initialize: () => Promise<boolean>;
    getInitializationStatus: () => any;
  }
}
