# 안심드라이브 — Team-J MVP 프로토타입

자녀가 결제하고 부모는 아무것도 안 해도 되는, AI 기반 가족 안심 운전 모니터링 서비스 데모.

투자자/심사위원 발표용 인터랙티브 데모. Split-screen으로 자녀 폰과 부모 폰을 동시에 보여주며 "Payer ≠ User" 구조를 시각적으로 증명합니다.

## 핵심 데모 요소

- **상단 라이브 비즈 대시보드** — ARR, 가입 가족 수, B/C 비율, LTV/CAC, 3중 수익 도넛 차트
- **Split-screen 폰** — 좌(자녀, Payer) + 중앙 "PAYER ≠ USER" + 우(부모, User)
- **4가지 인터랙티브 시나리오**
  - ▶ 90초 자동 데모 (전체 스토리 자동 재생)
  - ⚡ 위험 이벤트 시뮬 (양쪽 화면 동시 반응)
  - 💬 카카오톡 대화 가이드 (데이터 기반 면허 반납 대화)
  - 📊 6개월 Time-lapse (점수 85→55 추세 + 면허 반납 카드 등장)
- **Quiet Cinema 디자인** — Aurora 배경, Layered glass, Lucide SVG, Parallax phones, Cinematic entry

## 로컬 실행

### 옵션 1 — 정적 (가장 간단)
```bash
python3 -m http.server 8000
```
`http://localhost:8000` 접속.

### 옵션 2 — 빌드된 결과 확인 (minify)
```bash
npm install
npm run build
cd dist && python3 -m http.server 8000
```

## Vercel 배포

이 저장소는 Vercel zero-config 배포에 맞춰 설정되어 있습니다.

### 첫 배포

1. [vercel.com](https://vercel.com) 로그인 → **Add New → Project**
2. GitHub `plagdoctor/TeamJ-PROTOTYPE` 저장소 선택
3. Framework Preset: **Other** (자동 감지됨)
4. Build & Output: `vercel.json`이 자동으로 처리
5. **Deploy** 클릭

### 동작 방식

- `vercel.json`이 빌드 명령 (`npm run build`)과 출력 디렉토리 (`dist`)를 명시
- `build.mjs`가 `app.js`/`styles.css`를 esbuild로 minify (44%/29% 감소)
- 정적 자산(favicon.svg, manifest, robots)을 `dist/`에 복사
- Vercel edge에서 brotli/gzip 자동 압축 추가 적용

### 환경 변수
없음. 정적 사이트라 secrets 불필요.

### 커스텀 도메인
Vercel 프로젝트 설정 → Domains에서 추가. 예: `ansim.team-j.dev`

## 프로젝트 구조

```
TeamJ-PROTOTYPE/
├── index.html              # 메인 페이지 (메타 태그 + OG/Twitter)
├── styles.css              # Quiet Cinema 디자인 시스템
├── app.js                  # 인터랙션 로직 (4가지 시나리오)
├── favicon.svg             # 브랜드 마크 아이콘
├── apple-touch-icon.svg    # iOS 홈화면 아이콘
├── manifest.webmanifest    # PWA 매니페스트
├── robots.txt              # 검색 엔진 정책
├── vercel.json             # Vercel 빌드 + 보안 헤더 + 캐싱
├── build.mjs               # esbuild minify 빌드 스크립트
├── package.json            # 의존성 (esbuild만)
└── resource/               # 사업 기획서 / 비용편익 분석 (참고)
```

## 성능 메모

- **app.js**: 21.6 KB → 12.0 KB (-44% with minify, brotli 후 ~4 KB)
- **styles.css**: 52.2 KB → 37.3 KB (-29% with minify, brotli 후 ~7 KB)
- **폰트**: IBM Plex Sans KR + Newsreader (Google Fonts CDN, 분할 로딩)
- **JS 의존성**: 0개 (vanilla)
- **외부 의존성**: Google Fonts만

## 데모 단축키

- **Space** — 90초 자동 데모 시작/정지
- **Esc** — 카카오톡 모달 닫기

## 라이선스
Team-J 내부 자료. 무단 복제 및 외부 배포 금지.
