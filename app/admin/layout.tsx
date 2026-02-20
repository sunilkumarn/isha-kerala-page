import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F6F4EF] text-[#2B2B2B]">
      <Sidebar />
      <main className="min-h-[calc(100vh-4rem)] px-12 py-10 pl-72">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

