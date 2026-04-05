import type { Config } from 'jest'
import nextJest from 'next/jest.js'

// Next.js의 설정(tsconfig, 환경변수 등)을 jest에 자동으로 적용해주는 함수
const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  // jsdom: 브라우저 환경을 흉내내서 DOM 조작 테스트 가능하게 함
  testEnvironment: 'jsdom',

  // 각 테스트 파일 실행 전 자동으로 실행할 설정 파일
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // @/* 경로 별칭을 jest에서도 인식하도록 매핑
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)