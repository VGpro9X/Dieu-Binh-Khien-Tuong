# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần lên phong cách 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.1

V0.1 tập trung dựng nền móng kỹ thuật:

- Phaser 4.2.1 + TypeScript + Vite.
- Bàn cờ 14 × 10.
- Hai phe: Phe Xanh và Phe Đỏ.
- Chọn ô và chọn đơn vị.
- Hiển thị thông tin đơn vị/ô đang chọn.
- Turn Manager và nút Kết thúc lượt.
- UI trong game bằng tiếng Việt.
- Tách dữ liệu bàn cờ, dữ liệu quân và logic lượt khỏi scene hiển thị.
- Chuẩn bị GitHub Pages để test trực tiếp trên web.

> Các quân trong V0.1 chỉ là quân mẫu phục vụ kiểm thử board/turn. Cơ chế triệu hồi chính thức sẽ được triển khai ở V0.4.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt.
- **V0.2 — Di chuyển:** movement range, pathfinding, terrain movement cost, unit blocking, animation cơ bản.
- **V0.3 — Combat:** HP, Attack, Armor, Resistance, range, damage preview, chết đơn vị, 6 loại quân ban đầu.
- **V0.4 — Điểm Điều Binh & Triệu Hồi:** mở đầu triệu hồi 1 đơn vị; từ lượt chính thức có thể triệu hồi nhiều đơn vị tùy tài nguyên và ô spawn.
- **V0.5 — Chiếm đóng:** Nhà, Nước, Rừng, Núi, Vàng, Bạc, Sắt, Thành Trì, ownership và buff.
- **V0.6 — Random Map Generator:** seed, phân bố 4–6, BalanceValue, khoảng cách và vùng tranh chấp.
- **V0.7 — Mana & Skills:** kỹ năng chủ động/bị động, effect/status, Pháp Sư và Trị Liệu Sư.
- **V0.8 — AI:** chiếm tài nguyên, giao tranh, phòng thủ, triệu hồi và tích tài nguyên.
- **V0.9 — Visual 2.5D:** shadow, tween, projectile, camera effect, particle và terrain animation.
- **V1.0 — Skirmish hoàn chỉnh:** menu, map/seed, AI difficulty, thắng/thua, responsive, âm thanh và polish.

## Chạy local

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```
