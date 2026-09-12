# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần lên phong cách 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.3

V0.3 bổ sung combat core trên nền movement của V0.2:

- Phaser 4.2.1 + TypeScript + Vite.
- Bàn cờ 14 × 10 và hai phe Phe Xanh/Phe Đỏ.
- Giữ nguyên pathfinding, chi phí địa hình và unit blocking của V0.2.
- Mỗi đơn vị có **1 lần di chuyển + 1 hành động** mỗi lượt; có thể đánh rồi di chuyển hoặc di chuyển rồi đánh.
- Thêm HP, Công vật lý, Công phép, Giáp, Kháng phép và tầm đánh.
- Tầm đánh dùng khoảng cách Manhattan trên grid; Cung Thủ/Pháp Sư có tầm xa, cận chiến đánh ở khoảng cách 1.
- Rê chuột lên mục tiêu hợp lệ để xem **sát thương dự kiến** và HP còn lại trước khi đánh.
- Sát thương thực tế dao động nhẹ trong biên dự kiến, dựa trên loại sát thương và Giáp/Kháng tương ứng.
- Có health bar, damage number, hit flash và hiệu ứng tấn công cơ bản.
- Unit về 0 HP bị loại khỏi bàn cờ và không còn chặn đường.
- Đưa đủ 6 lớp quân ban đầu vào data: **Lính, Cung Thủ, Kỵ Binh, Trọng Binh, Pháp Sư, Trị Liệu Sư**.
- Các lớp quân được định nghĩa theo data để chuẩn bị cho triệu hồi ở V0.4.
- Trị Liệu Sư ở V0.3 mới có đòn đánh cơ bản; kỹ năng hồi phục thật sẽ mở ở mốc Mana & Skills.
- Giao diện và toàn bộ nội dung người chơi nhìn thấy dùng tiếng Việt.
- GitHub Pages tự build/deploy và có smoke test sau deploy.

## Cách test V0.3

1. Chọn một quân của phe đang tới lượt.
2. Ô xanh là vùng di chuyển; viền đỏ quanh các ô thể hiện tầm đánh hiện tại.
3. Quân địch có viền đỏ là mục tiêu có thể tấn công.
4. Rê chuột lên mục tiêu để xem sát thương dự kiến và HP sau đòn.
5. Bấm mục tiêu để tấn công.
6. Thử **đánh trước rồi di chuyển**, sau đó thử **di chuyển trước rồi đánh** bằng unit khác.
7. Đánh cho một unit về 0 HP để kiểm tra loại bỏ khỏi bàn cờ.
8. Thử Cung Thủ/Pháp Sư ở tầm xa và Lính/Kỵ Binh/Trọng Binh ở cận chiến.
9. Bấm **Kết thúc lượt** để chuyển phe và phục hồi quyền di chuyển/hành động cho phe mới.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt. ✅
- **V0.2 — Di chuyển:** movement range, pathfinding, terrain movement cost, unit blocking, animation cơ bản. ✅
- **V0.3 — Combat:** HP, Attack, Armor, Resistance, range, damage preview, chết đơn vị, 6 loại quân ban đầu. ✅
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
