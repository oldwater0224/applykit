import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/sidebar";
import { DashboardTopbar } from "@/src/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // middleware에서 supabase getUser() 로 한번 로직을 인증했기 때문에
  // 여기서도 getUser() 를 사용하면 불필요한 호출이 발생.
  // 그래서 여기서는 getSession()으로 작성.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  // 운영기관이 아닐 경우 메인으로 전환
  const {data : orgMember} = await supabase
  .from("org_members")
  .select("org_id, role")
  .eq("user_id" , user.id)
  .maybeSingle();

  if(!orgMember){
    redirect("/")
  }

  // 사이드바·상단 헤더 기관명 표시용 (권한 판정과 무관, 실패해도 null로 표시만 생략)
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgMember.org_id)
    .maybeSingle();

  const orgName: string | null = org?.name ?? null;
  const role: "admin" | "member" | null =
    orgMember.role === "admin" || orgMember.role === "member"
      ? orgMember.role
      : null;

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <DashboardSidebar orgName={orgName} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          orgName={orgName}
          role={role}
          userEmail={user.email ?? null}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}