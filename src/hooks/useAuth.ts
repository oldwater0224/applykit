'use client'

import { useEffect, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import { useAuthStore } from "../stores/authstore";



export function useAuth() {
  const { user, orgId, role, setUser, setOrg, clear } = useAuthStore();

  // useCallback 의존성 관리
  const fetchOrgInfo = useCallback(async (userId: string) => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from("org_members")
        .select("org_id, role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("기관 정보 조회 실패:", error.message);
        return;
      }

      if (data) {
        setOrg(data.org_id, data.role);
      }
    } catch (err) {
      console.error("fetchOrgInfo 에러:", err);
    }
  }, [setOrg]);

  useEffect(() => {
    const supabase = createClient();

    // 현재 세션 확인
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("세션 조회 실패:", error.message);
          clear();
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          fetchOrgInfo(session.user.id);
        }
      })
      .catch((err) => {
        console.error("getSession 에러:", err);
        clear();
      });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrgInfo(session.user.id);
      } else {
        clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clear, setUser, fetchOrgInfo]);

  
  return { user, orgId, role, isAuthenticated: !!user };
}