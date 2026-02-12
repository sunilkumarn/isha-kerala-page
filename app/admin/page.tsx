"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/sessions");
  }, [router]);

  return (
    <main className="rounded-lg border border-[#E2DED3] bg-white p-6 text-sm text-[#8C7A5B]">
      Redirecting to sessions...
    </main>
  );
}

