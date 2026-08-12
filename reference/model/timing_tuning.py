exec(open("timing.py").read().split("TRANS =")[0])
TRANS = 6*(len(STEPS)-1)
def fmt(s): return "%d:%02d"%(s//60,s%60)
def total(steps,trans):
    F=sum(s[3] for s in steps); V=sum(s[4] for s in steps); E=sum(s[5] for s in steps)
    return F,V,E,F+V+E+trans

# 튜닝안: (SEQ, 가변Δ, 시행착오Δ, 근거)
FIX = {
 "08":(-40,-50,"달력 발자국 옆 ①②③ 낙서 힌트 — 정렬 규칙 명시 (충돌 C3 해소)"),
 "04":(-25,-35,"다이얼 각도 허용오차 확대 + 근접 시 점등 피드백"),
 "02":(-30,-15,"색→방향 매핑을 토글 보드에 직접 인쇄 (참조 왕복 제거)"),
 "17":(-25,-12,"색–홈 대응 심볼을 제어반에 각인 + 오답 시 솔이 음성 가이드"),
 "10":(-15,-15,"동시 당김 허용 시간창 1.5초 이상으로 확대"),
 "12":(-20,  0,"번역기 프레임을 모니터 인접·시선 높이에 배치"),
 "07":( -8, -8,"통나무 구멍 지름 확대 + 토큰 자력 상향"),
}
MERGE = 75  # SEQ.16을 17에 흡수 + 06/07 연출 연결 → 전환·중복 제거

new=[]
for no,t,k,f,v,e in STEPS:
    dv,de = (FIX[no][0],FIX[no][1]) if no in FIX else (0,0)
    new.append((no,t,k,f,v+dv,e+de))
F0,V0,E0,T0 = total(STEPS,TRANS)
F1,V1,E1,T1 = total(new,TRANS-18)
T1 -= MERGE

print("── 튜닝 항목 ─────────────────────────────────────────────")
for no,(dv,de,why) in FIX.items():
    print(" SEQ.%s  %+4ds  %s"%(no,dv+de,why))
print(" 시퀀스 통합  %+4ds  SEQ.16→17 흡수, 전환 오버헤드 감소"%(-MERGE-18))
print("─"*58)
print(" 합계 절감  %d초 (%s)"%(T0-T1,fmt(T0-T1)))
print()
print("%-20s %10s %10s"%("","현행","튜닝 후"))
for lab,m in [("P10 (빠른 팀)",0.66),("P25",0.82),("P50 (기대)",1.00),("P75",1.24),("P90 (막히는 팀)",1.52)]:
    a=F0+(V0+E0+TRANS)*m
    b=F1+(V1+E1+TRANS-18-MERGE)*m
    mark="✓" if b<=2400 else "✗"
    print("%-20s %10s %10s  %s"%(lab,fmt(int(a)),fmt(int(b)),mark))
print()
print("목표: P75가 40:00 이내여야 운영 안정 (팀의 3/4이 시간 내 완주)")
