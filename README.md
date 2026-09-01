# MISSION : 2,000 공개수업 웹사이트

중학교 1학년 스마트 줄넘기 공개수업용 웹사이트입니다. 1학년 1반부터 7반까지 반별 결과 입력·조회가 가능하며, GitHub Pages에 바로 배포할 수 있습니다.

## 포함된 기능

- 1학년 1~7반 개별 입장
- 모둠별 1·2차 기록과 전략 입력
- 학생 자기 분석 → AI 제안 → 학생의 선택·수정 과정 기록
- 기록 변화 자동 계산
- 반별 결과판 및 요약 통계
- 태블릿·휴대전화 대응 화면
- Firebase 미설정 시 브라우저 체험 모드

## 1. 먼저 화면만 확인하기

프로젝트 폴더의 `index.html`을 VS Code의 Live Server로 실행합니다. Firebase를 연결하지 않은 상태에서는 입력 결과가 현재 브라우저에만 저장됩니다.

> `index.html` 파일을 직접 더블클릭하면 자바스크립트 모듈 보안 정책 때문에 동작하지 않을 수 있습니다. Live Server 또는 GitHub Pages에서 확인하세요.

## 2. Firebase 연결하기

GitHub Pages 자체에는 데이터베이스가 없으므로 여러 태블릿의 입력을 한곳에 모으려면 Firebase 연결이 필요합니다.

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 만듭니다.
2. 프로젝트에 웹 앱을 추가합니다.
3. `Firestore Database`를 만들고 위치를 선택합니다.
4. 웹 앱의 `firebaseConfig` 값을 복사합니다.
5. `firebase-config.js`의 예시 값을 실제 값으로 교체합니다.
6. Firestore의 `규칙` 탭에 `firestore.rules` 내용을 붙여넣고 게시합니다.

개인정보 보호를 위해 학생 이름 전체 대신 모둠명과 기록자 이름만 입력하도록 설계되어 있습니다. 공개 주소이므로 민감한 정보는 입력하지 마세요.

## 3. GitHub Pages 배포하기

1. GitHub에서 새 저장소를 만듭니다. 예: `mission-2000`
2. 이 폴더 안의 파일을 저장소 최상위에 업로드합니다.
3. 저장소 `Settings` → `Pages`로 이동합니다.
4. `Build and deployment`에서 `Deploy from a branch`를 선택합니다.
5. Branch를 `main`, 폴더를 `/(root)`로 선택하고 저장합니다.
6. 잠시 후 `https://사용자명.github.io/mission-2000/` 주소로 접속합니다.

반별 주소는 하나의 사이트 안에서 선택하는 방식입니다. QR 코드는 이 대표 주소 하나만 만들어 배포하면 됩니다.

## 중요 운영 안내

- 같은 반에서 같은 모둠명을 다시 게시하면 기존 결과를 덮어씁니다. 모둠명 표기를 통일하세요. 예: `1모둠`.
- 현재 규칙은 학생 입력 편의를 위해 로그인 없이 쓰기를 허용합니다. 링크를 수업 대상에게만 공유하고, 공개수업 종료 후 Firestore 규칙에서 쓰기를 닫는 것을 권장합니다.
- 수업 종료 후 쓰기를 닫으려면 `allow create, update: if` 이하를 `allow create, update: if false;`로 바꿉니다.
- 잘못 입력한 데이터는 Firebase Console → Firestore Database → `mission2000-results`에서 교사가 삭제할 수 있습니다.

## 파일 설명

- `index.html` — 사이트 화면 구조
- `style.css` — 디자인 및 반응형 화면
- `app.js` — 반 선택, 입력, 계산, 결과판 기능
- `firebase-config.js` — Firebase 연결값
- `firestore.rules` — 학생 입력 데이터 검증 규칙
- `README.md` — 설치 및 배포 안내
