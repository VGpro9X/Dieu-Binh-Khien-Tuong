# PROJECT HANDOFF — Điều Binh Khiển Tướng

## Nguyên tắc cố định

- Web game chiến thuật theo lượt, map bàn cờ, toàn bộ UI/ngôn ngữ trong game bằng tiếng Việt.
- Đồ họa 2D; tương lai nâng bằng animation/effect tạo cảm giác 2.5D, không chuyển core sang 3D.
- Tọa độ grid tách khỏi tọa độ render; gameplay/rules tách khỏi renderer.
- Unit, terrain, tài nguyên và skill đi theo hướng data-driven.
- Sau mỗi mốc V0.x: build/typecheck → deploy GitHub Pages → dừng để user test trước khi sang bản tiếp.

## Cơ chế triệu hồi đã chốt

- Mở trận: mỗi phe triệu hồi đúng 1 đơn vị.
- Từ lượt chiến đấu: không giới hạn 1 quân/lượt; có thể tiêu hết Điểm Điều Binh nếu còn ô triển khai.
- Quân mới được hành động ngay.
- Thành Chính có 8 ô triển khai quanh Thành.
- Từ V0.5, Thành Trì chiếm được mở thêm vùng triển khai quân quanh nó.

## Kinh tế hiện tại

- Bắt đầu: 8 Điểm Điều Binh mỗi phe.
- Thu nhập cơ bản: +3/lượt.
- Điểm chiến lược đã chiếm cộng thêm thu nhập đầu lượt.
- Điểm chưa dùng được giữ lại để tích lực.

## Hệ lãnh thổ V0.5

Quân đứng trực tiếp trên điểm chiến lược có thể dùng 1 hành động **Chiếm đóng**. Quyền sở hữu tồn tại cho đến khi đối thủ chiếm lại. Buff không tăng theo thời gian giữ; mất điểm là mất buff ngay.

- Nhà: +1 Điểm/lượt, hồi 6 HP đầu lượt.
- Nguồn Nước: +1 Điểm/lượt, V0.5 hồi 4 HP; V0.7 sẽ nối Mana.
- Rừng: +1 Điểm/lượt, +1 Giáp +1 Kháng.
- Núi: +1 Điểm/lượt, +2 Giáp.
- Mỏ Vàng: +2 Điểm/lượt.
- Mỏ Bạc: +1 Điểm/lượt, +2 Kháng.
- Mỏ Sắt: +1 Điểm/lượt, +2 Giáp.
- Thành Trì: +2 Điểm/lượt, mở điểm triển khai.

Mỗi điểm có `BalanceValue`; V0.6 sẽ dùng để tạo map random có seed, giới hạn chênh lệch số điểm hai phía tối đa 6–4 và cân bằng cả giá trị lẫn khoảng cách.

## Unit ban đầu

Lính, Cung Thủ, Kỵ Binh, Trọng Binh, Pháp Sư, Trị Liệu Sư.

## Phiên bản hiện tại

**V0.5 — Chiếm đóng & tài nguyên lãnh thổ.**

Mốc tiếp theo sau khi user test/duyệt: **V0.6 — Random Map Generator**.
