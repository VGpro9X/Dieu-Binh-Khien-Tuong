# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần thành 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.6

V0.6 thay map chiến lược cố định của V0.5 bằng **Random Map Generator có seed**:

- Giữ nguyên movement, combat, Điểm Điều Binh, triệu hồi, chiếm đóng, ownership, income và buff của V0.5.
- Mỗi trận có **12 điểm chiến lược**: 10 điểm phân bố về hai nửa bản đồ và 2 điểm tranh chấp gần trung tâm.
- Phân bố hai nửa chỉ có thể là **4–6, 5–5 hoặc 6–4**.
- Loại tài nguyên được chia bằng `BalanceValue`; generator tìm tổ hợp để chênh lệch tổng giá trị hai phía thấp nhất.
- Các vị trí ghép cặp theo phép đối xứng 180° để giữ khoảng cách tới Thành Chính tương đương; phía có thêm điểm sẽ ưu tiên vị trí có khoảng cách trung bình gần phía còn lại.
- Seed nằm trong URL qua tham số `?seed=...`. Reload đúng URL sẽ tạo lại đúng map.
- Nếu URL chưa có seed, game tự tạo seed mới rồi ghi vào URL bằng History API.
- Có nút **MAP MỚI** để sinh seed khác và tải một bản đồ khác.
- Thanh trên cùng hiển thị seed, số điểm, tổng BalanceValue và độ lệch khoảng cách để dễ kiểm tra cân bằng.
- `generateStrategicMap(seed)` tách riêng khỏi scene để V0.8 AI/V1.0 menu map có thể tái sử dụng.

## Cách test V0.6

1. Mở bản Pages và nhìn dòng V0.6 + seed trên đầu màn hình.
2. Ghi lại vị trí các điểm chiến lược rồi reload trang: cùng seed phải cho đúng cùng bố cục.
3. Bấm **MAP MỚI**: seed trong URL và bố cục điểm chiến lược phải đổi.
4. Thử nhiều map và kiểm tra số điểm Tây/Đông chỉ rơi vào 4–6, 5–5 hoặc 6–4.
5. Quan sát dòng cân bằng: `BV` là tổng BalanceValue của 10 điểm hai phía; `ΔBV` phải rất nhỏ.
6. Hoàn tất triệu hồi mở đầu, di chuyển, combat và chiếm điểm để xác nhận toàn bộ luật V0.5 vẫn hoạt động.
7. Chiếm Thành Trì ngẫu nhiên rồi mở Triệu Hồi để xác nhận vùng triển khai bổ sung vẫn hoạt động.
8. Copy URL có `seed`, mở lại ở tab/điện thoại khác để xác nhận map tái tạo giống nhau.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt. ✅
- **V0.2 — Di chuyển:** pathfinding, terrain cost, unit blocking, animation. ✅
- **V0.3 — Combat:** chỉ số, tầm đánh, preview damage, chết quân, 6 lớp quân. ✅
- **V0.4 — Điểm Điều Binh & Triệu Hồi:** mở đầu 1 quân; từ lượt chính triệu hồi nhiều quân tùy tài nguyên/ô trống. ✅
- **V0.5 — Chiếm đóng & lãnh thổ:** 8 loại điểm chiến lược, ownership, income, buff, Thành Trì mở spawn. ✅
- **V0.6 — Random Map Generator:** seed, phân bố 4–6, BalanceValue, cân bằng khoảng cách và vùng tranh chấp. ✅
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
