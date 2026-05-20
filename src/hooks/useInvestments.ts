import { useQuery } from "@tanstack/react-query";
import type { InvestmentListItem } from "@/src/app/actions/investmentAction";

interface UseInvestmentsParams {
  round?: string;
  limit?: number;
  offset?: number;
}

interface InvestmentsResponse {
  data: InvestmentListItem[];
  total: number;
}

async function fetchInvestments(
  params: UseInvestmentsParams
): Promise<InvestmentsResponse> {
  const searchParams = new URLSearchParams();

  if (params.round) searchParams.set("round", params.round);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  const res = await fetch(`/api/funding-rounds?${searchParams.toString()}`);
  if (!res.ok) throw new Error("투자 데이터를 불러오지 못했습니다.");

  return res.json();
}

export function useInvestments(params: UseInvestmentsParams = {}) {
  return useQuery({
    queryKey: ["investments", params],
    queryFn: () => fetchInvestments(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
}