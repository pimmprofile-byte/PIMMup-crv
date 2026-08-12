# 초록의 소리 (Sound of Green)

PIMMscape · 파주 평화누리 캠핑장 숲속 카라반 테마 — 기획 문서와 제작 분석 아카이브.

작은 소나무 정령 '솔이'와의 만남을 통해 DMZ의 장소성을 가족 관객이 감당할 수 있는
힐링 판타지로 번역한 몰입형 체험 테마입니다.

| | |
|---|---|
| 장소 | 파주 평화누리 캠핑장 · 숲속 카라반 (Mono Room) |
| 타겟 | 가족 · 미취학~초등 (이용객 약 70%가 가족 단위) |
| 플레이타임 | 40분 + 세팅 10분 |
| 정원 | 최대 4인 (2~3인 최적) |
| 구성 | PROLOGUE + SEQ.01~19 (기 · 승 · 전 · 결) |

## 문서

| 파일 | 내용 |
|---|---|
| [`docs/step-progression.html`](docs/step-progression.html) | **테마 진행표** — 0528 2차 미팅 반영. 19시퀀스별 플레이어 행동 · 공간 반응 · 장치 cue · 기획 노트. **기준본** |
| [`docs/visual-scenario.html`](docs/visual-scenario.html) | **비주얼 시나리오** — 초안(청소년 타겟). 17슬라이드 인터랙티브. 대사 · 지문 · 연출 톤 참조용 |
| [`docs/production-plan.html`](docs/production-plan.html) | **제작계획** — 스토리 구조 분석, 19시퀀스 시간/장치 밀도 분석, P0~P5 실행계획, 장치 BOM 33종, 리스크 10건, 결정사항 7건 |
| [`docs/theme-tone.html`](docs/theme-tone.html) | **테마톤 분석** — 컨셉 이미지 47컷 색상 실측, 조명 3상태, 재질 언어, 시공 컬러 스펙, 설계 충돌 4건 |
| [`docs/playtime-estimate.html`](docs/playtime-estimate.html) | **플레이타임 산정** — 12세 인지부하 모델. 19시퀀스 풀이 절차 분해, 스텝별 소요시간, 팀 편차 분포, 병목 4곳, 6분 31초 절감 튜닝안 |
| [`docs/module-and-build.html`](docs/module-and-build.html) | **모듈 구성과 내부 시공** — 벽 매립 불가 조건에서의 모듈+카트리지 전략. 표준 캐리어 규격, 19시퀀스 → 9유닛 통합안, 배선 백본, 3존 차등 마감, 견적 요청 골격 |

HTML을 그대로 열면 됩니다. 별도 빌드나 의존성이 없습니다.

## 문서 버전에 관한 주의

`visual-scenario.html`과 `step-progression.html`은 **같은 테마의 서로 다른 개정 단계**이며,
시퀀스 번호 체계가 어긋납니다.

- 비주얼 시나리오 — PRO + SEQ.01~14 + EPILOGUE (17슬라이드)
- 테마 진행표 — PRO + SEQ.01~19

**진행표(0528)를 단일 기준본으로 사용**하고, 비주얼 시나리오는 대사·톤 참조용으로만
취급하십시오. 두 문서를 병행 배포하면 도면·발주·스태프 매뉴얼이 어긋납니다.

0528 개정 주요 변경: 타겟 전환(청소년→가족), 개인폰 SMS 시작, AI 채팅→선택지+음성,
휴대 UV 라이트→공간 전역 UV 전환, 노트북 제거, DMZ 멸종위기종 도입, 야외 엔딩 추가,
내구성 사양 전면 개정(아크릴 · 코팅 · 매립).

## 참조 자료

```
reference/
  images/steps/     SEQ별 컨셉 이미지 20컷 (진행표 임베드분 추출)
  images/sheets/    컨택트시트 · 캐릭터/조명/소품 비교 이미지
  extracted/        원본 HTML에서 추출한 텍스트 및 데이터 스크립트
  model/            플레이타임 산정 모델 (python)
```

플레이타임 수치를 조정하려면 `reference/model/timing_model.py`의 `STEPS` 배열에서
스텝별 고정 · 가변 · 시행착오 값을 고치고 실행하면 됩니다.
`timing_tuning.py`는 튜닝안 적용 전후를 비교합니다. 두 스크립트 모두 의존성이 없습니다.

```
python3 reference/model/timing_model.py          # 스텝별 산정표 + 분포
python3 reference/model/timing_tuning.py         # 튜닝 전후 비교
python3 reference/model/module_consolidation.py  # 시퀀스 → 물리 유닛 매핑
python3 reference/model/finish_takeoff.py        # 내부 마감 물량 산출
```

`extracted/step-progression.data.js`에 19시퀀스 전체 데이터(`STEPS` 배열)가 들어 있습니다 —
플레이어 행동, 공간 반응, 해제 조건, 장치, 연출, 운영 노트, 감정 비트.
`extracted/visual-scenario.script.js`에는 초안의 솔이 대사 자산(30개 주제군, 90여 대사)이
`SOL_KEYWORDS`로 남아 있습니다.

## 착수 전 확정 필요

제작 착수를 막고 있는 항목입니다. 상세는 제작계획 §07, 테마톤 §05 참조.

1. 오픈 목표일과 예산 규모
2. 단독 테마 여부 — SEQ.19 야외 엔딩 규모가 여기서 갈립니다
3. 카라반 실측 — 치수 · 전력 용량 · 통신 회선 (크리티컬 패스 시작점)
4. 캐릭터 확정 — 두 문서의 이름과 디자인이 다릅니다 (솔이 / Pini)
5. 등록 설문 문항 — 현재 교육형 문항으로는 관찰일지 개인화가 작동하지 않습니다
6. 쇠솔방울 표현 수위 · 연기 머신 사용 가부
7. SEQ.05 퍼즐 난이도 2안 택일

---

Copyright ⓒ PIMM ARTWORKS CORP.
