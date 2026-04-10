import { Suspense } from "react";
import CheckInClient from "./CheckInClient";

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4">
            <span className="h-10 w-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Yükleniyor...</p>
          </div>
        </main>
      }
    >
      <CheckInClient />
    </Suspense>
  );
}
