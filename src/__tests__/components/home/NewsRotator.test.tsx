import { act, fireEvent, render, screen } from "@testing-library/react";
import NewsRotator from "@/src/app/components/home/NewsRotator";
import type { StartupNews } from "@/src/types/news";

const ROTATE = 7000;
const FADE = 300;

function makeNews(n: number): StartupNews[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `n${i + 1}`,
    title: `뉴스 ${i + 1}`,
    description: null,
    url: `https://example.com/${i + 1}`,
    naverUrl: null,
    press: null,
    publishedAt: "2026-11-01T00:00:00Z",
    roundName: null,
    amountText: null,
  }));
}

function shownTitles(): string[] {
  return screen.getAllByRole("link").map((a) => a.textContent ?? "");
}

function pageLabel(): string | null {
  return screen.queryByText(/^\d+\/\d+$/)?.textContent ?? null;
}

const prev = () => screen.getByRole("button", { name: "이전 뉴스" });
const next = () => screen.getByRole("button", { name: "다음 뉴스" });

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("NewsRotator 페이지 분할", () => {
  it("35개면 6페이지, 첫 장은 최신 6개, 이전 비활성", () => {
    render(<NewsRotator news={makeNews(35)} />);
    expect(pageLabel()).toBe("1/6");
    expect(shownTitles()).toHaveLength(6);
    expect(shownTitles()[0]).toContain("뉴스 1");
    expect(prev()).toBeDisabled();
    expect(next()).toBeEnabled();
  });

  it("다음을 5번 누르면 6/6, 마지막 장 5개, 더 눌러도 그대로", () => {
    render(<NewsRotator news={makeNews(35)} />);
    for (let i = 0; i < 5; i++) fireEvent.click(next());
    advance(FADE);
    expect(pageLabel()).toBe("6/6");
    expect(shownTitles()).toHaveLength(5);
    expect(shownTitles()[0]).toContain("뉴스 31");
    expect(next()).toBeDisabled();
    fireEvent.click(next());
    advance(FADE);
    expect(pageLabel()).toBe("6/6");
  });

  it("7개면 2페이지, 둘째 장 1개", () => {
    render(<NewsRotator news={makeNews(7)} />);
    expect(pageLabel()).toBe("1/2");
    fireEvent.click(next());
    advance(FADE);
    expect(shownTitles()).toHaveLength(1);
  });

  it("6개 이하면 버튼·페이지 표시 없고 자동 갱신도 없음", () => {
    render(<NewsRotator news={makeNews(6)} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(pageLabel()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("0개면 카드 없이 렌더(에러 없음)", () => {
    render(<NewsRotator news={[]} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("NewsRotator 버튼과 페이드", () => {
  it("다음 클릭 시 n/N은 즉시, 카드는 페이드 후 바뀜", () => {
    render(<NewsRotator news={makeNews(35)} />);
    fireEvent.click(next());
    expect(pageLabel()).toBe("2/6");
    expect(shownTitles()[0]).toContain("뉴스 1");
    advance(FADE);
    expect(shownTitles()[0]).toContain("뉴스 7");
  });

  it("연속 클릭 후 페이드가 끝나면 마지막 목표 페이지가 표시됨", () => {
    render(<NewsRotator news={makeNews(35)} />);
    fireEvent.click(next());
    advance(FADE - 100);
    fireEvent.click(next());
    advance(FADE - 100);
    fireEvent.click(next());
    advance(FADE);
    expect(pageLabel()).toBe("4/6");
    expect(shownTitles()[0]).toContain("뉴스 19");
    // 이전 페이드 타이머가 늦게 덮어쓰지 않음
    advance(FADE * 3);
    expect(shownTitles()[0]).toContain("뉴스 19");
  });

  it("이전으로 1페이지까지 돌아가고 그 이상은 무시", () => {
    render(<NewsRotator news={makeNews(35)} />);
    fireEvent.click(next());
    fireEvent.click(next());
    fireEvent.click(prev());
    fireEvent.click(prev());
    fireEvent.click(prev());
    advance(FADE);
    expect(pageLabel()).toBe("1/6");
    expect(prev()).toBeDisabled();
    expect(shownTitles()[0]).toContain("뉴스 1");
  });
});

describe("NewsRotator 자동 갱신", () => {
  it("7초마다 다음 장, 마지막 다음은 1페이지로 순환", () => {
    render(<NewsRotator news={makeNews(35)} />);
    advance(ROTATE + FADE);
    expect(pageLabel()).toBe("2/6");
    advance(ROTATE * 4);
    expect(pageLabel()).toBe("6/6");
    advance(ROTATE + FADE);
    expect(pageLabel()).toBe("1/6");
    expect(shownTitles()[0]).toContain("뉴스 1");
  });

  it("버튼 클릭 시 7초 타이머가 처음부터 다시 시작", () => {
    render(<NewsRotator news={makeNews(35)} />);
    advance(6000);
    fireEvent.click(next()); // 2/6
    advance(6999);
    expect(pageLabel()).toBe("2/6");
    advance(1);
    expect(pageLabel()).toBe("3/6");
  });

  it("마우스를 올리면 자동 갱신 건너뜀", () => {
    render(<NewsRotator news={makeNews(35)} />);
    const grid = screen.getAllByRole("link")[0].parentElement!;
    fireEvent.mouseEnter(grid);
    advance(ROTATE * 3);
    expect(pageLabel()).toBe("1/6");
    fireEvent.mouseLeave(grid);
    advance(ROTATE);
    expect(pageLabel()).toBe("2/6");
  });

  it("탭 숨김 시 정지, 숨김 상태 클릭은 타이머를 걸지 않고, 보이면 재시작", () => {
    render(<NewsRotator news={makeNews(35)} />);
    setHidden(true);
    advance(ROTATE * 2);
    expect(pageLabel()).toBe("1/6");
    fireEvent.click(next());
    advance(FADE);
    expect(pageLabel()).toBe("2/6");
    expect(jest.getTimerCount()).toBe(0);
    advance(ROTATE * 2);
    expect(pageLabel()).toBe("2/6");
    setHidden(false);
    expect(jest.getTimerCount()).toBe(1);
    advance(ROTATE);
    expect(pageLabel()).toBe("3/6");
  });

  it("클릭·가시성 변경을 반복해도 interval은 하나뿐", () => {
    render(<NewsRotator news={makeNews(35)} />);
    fireEvent.click(next());
    fireEvent.click(next());
    advance(FADE);
    setHidden(false);
    setHidden(false);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("언마운트 시 interval과 페이드 타이머 모두 정리", () => {
    const { unmount } = render(<NewsRotator news={makeNews(35)} />);
    fireEvent.click(next()); // 페이드 타이머 진행 중
    expect(jest.getTimerCount()).toBe(2);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
