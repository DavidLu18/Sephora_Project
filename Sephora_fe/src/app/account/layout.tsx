import AccountSidebar from "@/components/AccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-10 px-6">
      <div className="max-w-6xl w-full flex gap-8">
        <AccountSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
