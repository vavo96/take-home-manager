export interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    duration?: number;
  }
  
export interface ToastContextType {
    toast: (toast: Omit<Toast, 'id'>) => void;
}