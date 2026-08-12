# 내부 시공 물량 산출 — 5m급 카라반 가정 (실측으로 대체 필요)
L,W,H = 5.0, 2.2, 1.95      # 내부 길이·폭·높이 (m)
peri = 2*(L+W)
wall_gross = peri*H
openings  = 5.0             # 창3 + 문1 + 기존 개구부 공제
wall_net  = wall_gross - openings
ceil = L*W
floor = L*W
CARRIER_W, CARRIER_H, N_CARRIER = 0.55, 1.5, 5
hidden = CARRIER_W*CARRIER_H*N_CARRIER      # 캐리어가 가리는 벽면 → 마감 불필요
wall_visible = wall_net - hidden
total_visible = wall_visible + ceil

print("── 물량 산출 (5m급 가정) ──────────────────────")
print(" 내부 치수            %.1f × %.1f × %.1f m"%(L,W,H))
print(" 벽면 전개(총)         %.1f ㎡"%wall_gross)
print(" 개구부 공제           -%.1f ㎡"%openings)
print(" 캐리어 은폐면 공제      -%.1f ㎡   (%.2f×%.2f × %d기)"%(hidden,CARRIER_W,CARRIER_H,N_CARRIER))
print(" 벽면 실마감           %.1f ㎡"%wall_visible)
print(" 천장                 %.1f ㎡"%ceil)
print(" ─────────────────────────────────")
print(" 마감 대상 합계         %.1f ㎡  (바닥 %.1f㎡ 별도)"%(total_visible,floor))
print()
ZONES=[("A존 · 실목/무늬목+오일","직시·접촉면. 캐리어 인접, 시선 집중부",0.22),
       ("B존 · 프라이머+다크스테인 도장","배경 벽면 일반부",0.58),
       ("C존 · 무광 흑색 또는 무처리","천장 상부·가구 배면·비직시부",0.20)]
print("── 3존 차등 마감 배분 ──────────────────────────")
for n,d,r in ZONES:
    print(" %-32s %5.1f ㎡  (%2.0f%%)   %s"%(n,total_visible*r,r*100,d))
print()
print(" 필름 전면 시공 시 대상면적: %.1f ㎡ (전면 균일 시공)"%total_visible)
print(" 3존 차등 시 고급마감(A존) 면적: %.1f ㎡ → 전면 대비 %.0f%%"%(total_visible*0.22,22))
