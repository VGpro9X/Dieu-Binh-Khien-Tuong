# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần lên phong cách 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.2

V0.2 tập trung hoàn thiện hệ di chuyển chiến thuật:

- Phaser 4.2.1 + TypeScript + Vite.
- Bàn cờ 14 × 10 và hai phe Phe Xanh/Phe Đỏ.
- Chọn quân thuộc phe đang tới lượt để hiện vùng có thể di chuyển.
- Pathfinding theo 4 hướng, tự tìm tuyến có tổng chi phí thấp nhất.
- Địa hình có chi phí di chuyển khác nhau: Đồng cỏ, Rừng, Đồi đá, Nước cạn.
- Hỗ trợ loại địa hình không thể đi qua theo loại di chuyển; Nước cạn hiện đã chặn Kỵ binh trong data để chuẩn bị cho các unit sau này.
- Đơn vị khác chặn đường và không thể đứng chồng lên nhau.
- Mỗi đơn vị được di chuyển một lần trong lượt hiện tại.
- Rê chuột lên ô hợp lệ để xem trước đường đi.
- Animation di chuyển từng ô cơ bản.
- Giao diện và toàn bộ nội dung trong game bằng tiếng Việt.
- GitHub Pages tự build/deploy; workflow có smoke test trang và asset sau deploy.

> Các quân trong V0.2 vẫn là quân mẫu phục vụ kiểm thử movement. Hệ chỉ số chiến đấu và 6 loại quân chính thức sẽ được triển khai ở V0.3. Cơ chế triệu hồi chính thức sẽ được triển khai ở V0.4.

## Cách test V0.2

1. Chọn Lính hoặc Cung Thủ của phe đang tới lượt.
2. Các ô màu xanh là những ô có thể đi tới trong giới hạn điểm di chuyển.
3. Rê chuột lên ô xanh để xem đường đi màu cam.
4. Bấm ô xanh để di chuyển.
5. Thử đi qua Rừng/Đồi/Nước để thấy phạm vi thay đổi theo chi phí địa hình.
6. Thử dùng một quân chắn lối quân còn lại.
7. Bấm **Kết thúc lượt** để chuyển phe và hồi quyền di chuyển cho phe mới.

## Roadmap

- **V0.1 — Nền móng:** board, chọn ô/quân, hai phe, lượt, UI tiếng Việt. ✅
- **V0.2 — Di chuyển:** movement range, pathfinding, terrain movement cost, unit blocking, animation cơ bản. ✅
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
