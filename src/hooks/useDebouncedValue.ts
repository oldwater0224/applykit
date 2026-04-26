"use client";

import { useEffect, useState } from "react";

/**
 * 값을 지정된 지연 시간만큼 지연시킨 debounced 값을 반환
 * - 주 사용처: 검색 입력창 - 타이핑마다 API 호출되는 걸 방지
 * - delay 동안 값이 바뀌지 않으면 확정, 그 전에 바뀌면 타이머 리셋
 *
 * 사용 예:
 *   const [query, setQuery] = useState("");
 *   const debouncedQuery = useDebouncedValue(query, 300);
 *   const { data } = useSearch(debouncedQuery)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // value가 바뀔 때마다 타이머 재설정
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    // cleanup으로 이전 타이머 취소 - 빠른 연속 입력 시 중간값은 확정 안 됨
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}