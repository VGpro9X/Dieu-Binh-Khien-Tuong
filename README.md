# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần thành 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.7

V0.7 đưa **Mana, kỹ năng chủ động, nội tại và status effect** vào vòng lặp chiến đấu:

- Giữ nguyên toàn bộ Random Map Generator V0.6, movement, combat, triệu hồi, chiếm đóng, income và buff lãnh thổ.
- Pháp Sư và Trị Liệu Sư có **100 Mana tối đa**, bắt đầu với **60 Mana**.
- Pháp Sư có kỹ năng **Hỏa Cầu**: tốn 35 Mana, tầm 2–4, gây sát thương phép và áp **Thiêu Đốt** 2 lượt.
- **Thiêu Đốt** gây 7 HP sát thương ở đầu lượt của phe sở hữu mục tiêu, kéo dài 2 lượt.
- Nội tại Pháp Sư **Dẫn Ma**: hồi 20 Mana đầu lượt.
- Trị Liệu Sư có kỹ năng **Trị Liệu**: tốn 30 Mana, tầm 0–3, hồi 38 HP và áp **Hồi Phục**.
- **Hồi Phục** hồi 6 HP đầu lượt trong 2 lượt.
- Nội tại Trị Liệu Sư **Từ Tâm**: mỗi lần dùng Trị Liệu luôn ban Hồi Phục.
- Trị Liệu Sư hồi 15 Mana đầu lượt.
- **Nguồn Nước** nay hoàn thiện chức năng đã để dành từ V0.5: mỗi Nguồn Nước sở hữu cho thêm **+10 Mana/đầu lượt** cho từng Pháp Sư và Trị Liệu Sư của phe.
- Kỹ năng dùng cùng slot **Hành động** với tấn công/chiếm đóng: đã dùng kỹ năng thì không thể tấn công hoặc chiếm đóng trong lượt đó, nhưng vẫn có thể di chuyển nếu chưa di chuyển.
- Khi bật chế độ kỹ năng, các mục tiêu hợp lệ được viền nổi bật trực tiếp trên bàn cờ.
- Mana và status hiện trong bảng thông tin của đơn vị đang chọn.

## Cách test V0.7

1. Triệu hồi **Pháp Sư** cho một phe và hoàn tất giai đoạn mở đầu.
2. Chọn Pháp Sư, kiểm tra bảng thông tin có Mana và nút **HỎA CẦU • 35 MANA** phía trên bàn cờ.
3. Bấm Hỏa Cầu rồi chọn một quân địch trong tầm 2–4; xác nhận mất Mana, dùng hành động và mục tiêu nhận Thiêu Đốt.
4. Kết thúc lượt đến lượt của phe bị đốt; kiểm tra Thiêu Đốt trừ HP và giảm số lượt hiệu lực.
5. Triệu hồi **Trị Liệu Sư**, gây thương tích cho một đồng minh rồi dùng **Trị Liệu** trong tầm 0–3.
6. Kiểm tra đồng minh hồi HP ngay và nhận **Hồi Phục(2)**; qua các lượt sau hồi thêm 6 HP.
7. Chiếm **Nguồn Nước**, kết thúc lượt rồi quan sát lượng Mana hồi thêm cho Pháp Sư/Trị Liệu Sư.
8. Kiểm tra sau khi dùng kỹ năng vẫn có thể di chuyển nếu chưa đi, nhưng không thể tấn công/chiếm đóng vì hành động đã dùng.
9. Bấm **MAP MỚI** để xác nhận random map V0.6 vẫn hoạt động bình thường.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt. ✅
- **V0.2 — Di chuyển:** pathfinding, terrain cost, unit blocking, animation. ✅
- **V0.3 — Combat:** chỉ số, tầm đánh, preview damage, chết quân, 6 lớp quân. ✅
- **V0.4 — Điểm Điều Binh & Triệu Hồi:** mở đầu 1 quân; từ lượt chính triệu hồi nhiều quân tùy tài nguyên/ô trống. ✅
- **V0.5 — Chiếm đóng & lãnh thổ:** 8 loại điểm chiến lược, ownership, income, buff, Thành Trì mở spawn. ✅
- **V0.6 — Random Map Generator:** seed, phân bố 4–6, BalanceValue, cân bằng khoảng cách và vùng tranh chấp. ✅
- **V0.7 — Mana & Skills:** kỹ năng chủ động/bị động, Mana, effect/status, Pháp Sư và Trị Liệu Sư. ✅
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
