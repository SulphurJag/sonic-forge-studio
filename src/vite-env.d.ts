
/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Add TypeScript declarations for modules without @types
declare module '@tanstack/react-query' {
  export * from '@tanstack/react-query'
}

declare module 'react-router-dom' {
  export * from 'react-router-dom'
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
  export const Info: LucideIcon
  export const Zap: LucideIcon
  export const Wand2: LucideIcon
  export const AlertCircle: LucideIcon
  export const Circle: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
  export const Check: LucideIcon
  export const X: LucideIcon
}

// Fill in missing @huggingface/transformers declarations
declare module '@huggingface/transformers' {
  export * from '@huggingface/transformers'
}

// Define missing services
declare module '@/services/ai' {
  export const aiAudioProcessor: {
    initialize: () => Promise<boolean>;
    getInitializationStatus: () => any;
  }
}
