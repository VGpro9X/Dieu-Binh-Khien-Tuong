# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần bằng sprite/animation/effect để tạo cảm giác 2.5D nhưng giữ core game hoàn toàn 2D.

## Phiên bản hiện tại: V0.4

V0.4 đưa vòng lặp kinh tế và triệu hồi cốt lõi vào game:

- **Điểm Điều Binh** là tài nguyên dùng để triệu hồi quân.
- Mỗi phe bắt đầu với **8 Điểm Điều Binh**.
- Giai đoạn mở đầu: Phe Xanh triệu hồi đúng 1 đơn vị, sau đó Phe Đỏ triệu hồi đúng 1 đơn vị.
- Sau khi hai phe hoàn tất triệu hồi mở đầu, trận đấu bước vào Vòng 1 và Phe Xanh bắt đầu.
- Từ lượt chính thức trở đi **không giới hạn 1 đơn vị/lượt**: có thể dùng toàn bộ Điểm Điều Binh để gọi nhiều quân liên tiếp.
- Thu nhập cơ bản hiện tại là **+3 Điểm Điều Binh ở đầu mỗi lượt của phe đó**. Điểm chưa tiêu được giữ lại để tích lực.
- Mỗi phe có một **Thành Chính** và 8 ô triển khai xung quanh. Chỉ có thể triệu hồi lên ô hợp lệ còn trống.
- Thành Chính chặn di chuyển; nếu các ô triển khai bị quân chiếm thì khả năng gọi quân bị bóp nghẹt.
- Quân vừa triệu hồi trong lượt chính thức được **di chuyển và hành động ngay**.
- Chi phí triệu hồi hiện tại: Lính 3, Cung Thủ 4, Kỵ Binh 5, Trọng Binh 5, Pháp Sư 6, Trị Liệu Sư 5.
- Giữ nguyên toàn bộ movement/combat của V0.2–V0.3: địa hình, pathfinding, 1 di chuyển + 1 hành động, tầm đánh, preview sát thương, HP và chết đơn vị.

> V0.5 sẽ thêm các điểm chiếm đóng/tài nguyên như Nhà, Nước, Rừng, Núi, Mỏ Vàng, Mỏ Bạc, Mỏ Sắt và Thành Trì; từ đó thu nhập và buff sẽ không còn chỉ là +3 cơ bản.

## Cách test V0.4

1. Mở trận: chọn một loại quân ở bảng **Triệu Hồi Quân** rồi bấm một ô màu tím quanh Thành Chính Phe Xanh.
2. Làm tương tự cho Phe Đỏ. Sau lần triệu hồi thứ hai, Vòng 1 tự bắt đầu.
3. Quan sát Điểm Điều Binh còn lại và +3 thu nhập khi tới lượt phe mới.
4. Trong lượt chính thức, thử triệu hồi nhiều quân liên tiếp cho đến khi hết điểm hoặc hết ô triển khai.
5. Chọn quân vừa triệu hồi và kiểm tra rằng quân đó có thể di chuyển/tấn công ngay.
6. Tích điểm qua vài lượt rồi tiêu toàn bộ trong một lượt để kiểm tra cơ chế dồn quân/phòng thủ khẩn cấp.
7. Đưa quân đứng kín các ô quanh Thành để kiểm tra việc ô bị chiếm sẽ khóa bớt vị trí triệu hồi.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt. ✅
- **V0.2 — Di chuyển:** movement range, pathfinding, terrain movement cost, unit blocking, animation cơ bản. ✅
- **V0.3 — Combat:** HP, Attack, Armor, Resistance, range, damage preview, chết đơn vị, 6 loại quân ban đầu. ✅
- **V0.4 — Điểm Điều Binh & Triệu Hồi:** mở đầu 1 quân/phe; sau đó triệu hồi nhiều quân theo tài nguyên và ô spawn. ✅
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
