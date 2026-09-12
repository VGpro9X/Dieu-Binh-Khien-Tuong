# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần thành 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.5

V0.5 đưa hệ chiếm đóng và tài nguyên lãnh thổ vào vòng lặp chính:

- Giữ nguyên combat, movement và cơ chế Điểm Điều Binh/triệu hồi của V0.4.
- Có 8 loại điểm chiến lược: Nhà, Nguồn Nước, Rừng, Núi, Mỏ Vàng, Mỏ Bạc, Mỏ Sắt, Thành Trì.
- Quân phải đứng trực tiếp trên điểm chiến lược và dùng **1 hành động Chiếm đóng** để đổi quyền sở hữu.
- Buff có hiệu lực khi còn quyền sở hữu và mất ngay khi điểm bị đối thủ chiếm lại; không cộng dồn theo số lượt giữ.
- Thu nhập cơ bản vẫn là +3 Điểm Điều Binh/lượt; tài nguyên đã chiếm cộng thêm vào thu nhập đầu lượt.
- Nhà: +1 Điểm/lượt, toàn quân hồi 6 HP đầu lượt.
- Nguồn Nước: +1 Điểm/lượt, V0.5 hồi 4 HP đầu lượt; Mana sẽ được nối ở V0.7.
- Rừng: +1 Điểm/lượt, +1 Giáp và +1 Kháng cho toàn quân.
- Núi: +1 Điểm/lượt, +2 Giáp cho toàn quân.
- Mỏ Vàng: +2 Điểm/lượt.
- Mỏ Bạc: +1 Điểm/lượt, +2 Kháng cho toàn quân.
- Mỏ Sắt: +1 Điểm/lượt, +2 Giáp cho toàn quân.
- Thành Trì: +2 Điểm/lượt và mở thêm vùng triển khai quân quanh Thành Trì đã chiếm.
- Mỗi điểm đã có `BalanceValue` để chuẩn bị cho generator cân bằng ở V0.6.
- Map V0.5 cố định để test luật; random map có seed sẽ triển khai ở V0.6.

## Cách test V0.5

1. Hoàn tất triệu hồi mở đầu của hai phe.
2. Di chuyển một quân lên ô có ký hiệu điểm chiến lược.
3. Bấm nút **CHIẾM ĐÓNG** ở dưới bàn cờ.
4. Kiểm tra màu viền/điểm sở hữu và bảng thu nhập/buff của phe.
5. Kết thúc lượt để kiểm tra thu nhập và hồi HP từ Nhà/Nguồn Nước.
6. Chiếm lại điểm bằng phe đối phương để xác nhận buff đổi chủ ngay.
7. Chiếm **Thành Trì**, mở bảng Triệu Hồi và kiểm tra các ô tím mới quanh Thành Trì.
8. Tích Điểm Điều Binh rồi triệu hồi nhiều quân trong cùng lượt như V0.4.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt. ✅
- **V0.2 — Di chuyển:** pathfinding, terrain cost, unit blocking, animation. ✅
- **V0.3 — Combat:** chỉ số, tầm đánh, preview damage, chết quân, 6 lớp quân. ✅
- **V0.4 — Điểm Điều Binh & Triệu Hồi:** mở đầu 1 quân; từ lượt chính triệu hồi nhiều quân tùy tài nguyên/ô trống. ✅
- **V0.5 — Chiếm đóng & lãnh thổ:** 8 loại điểm chiến lược, ownership, income, buff, Thành Trì mở spawn. ✅
- **V0.6 — Random Map Generator:** seed, phân bố 4–6, BalanceValue, cân bằng khoảng cách và vùng tranh chấp.
- **V0.7 — Mana & Skills:** kỹ năng chủ động/bị động, Mana, effect/status, Pháp Sư và Trị Liệu Sư.
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
