'use client';

import Chat from "@/components/shared/Chat";
import { ToastProvider, ClientOnly } from "@/components/ui";

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center max-w-screen">
      <ClientOnly 
        fallback={
          <div className="flex h-screen flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading PII Detector...</p>
          </div>
        }
      >
        <ToastProvider>
          <Chat />
        </ToastProvider>
      </ClientOnly>
    </main>
  );
}
    