import type { Config } from 'jest'
import nextJest from 'next/jest.js'

// Next.js의 설정(tsconfig, 환경변수 등)을 jest에 자동으로 적용해주는 함수
const createJestConfig = nextJest({
  dir: './', // Next.js 프로젝트 루트 경로
})

const config: Config = {
  // jsdom: 브라우저 환경을 흉내내서 DOM 조작 테스트 가능하게 함
  testEnvironment: 'jsdom',

  // 각 테스트 파일 실행 전 자동으로 실행할 설정 파일
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],

  // @/* 경로 별칭을 jest에서도 인식하도록 매핑
  // 예: @/lib/supabase/client → src/lib/supabase/client
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

// createJestConfig로 감싸야 Next.js 설정이 jest에 반영됨
export default createJestConfig(config)