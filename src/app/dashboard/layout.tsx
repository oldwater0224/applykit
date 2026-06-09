import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 운영기관이 아닐 경우 메인으로 전환
  const {data : orgMember} = await supabase
  .from("org_members")
  .select("org_id")
  .eq("user_id" , user.id)
  .maybeSingle();

  if(!orgMember){
    redirect("/")
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}