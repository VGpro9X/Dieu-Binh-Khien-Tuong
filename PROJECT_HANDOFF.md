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
- Thành Trì chiếm được mở thêm vùng triển khai quân quanh nó.

## Kinh tế và lãnh thổ

- Bắt đầu: 8 Điểm Điều Binh mỗi phe.
- Thu nhập cơ bản: +3/lượt.
- Điểm chiến lược đã chiếm cộng thêm thu nhập đầu lượt.
- Điểm chưa dùng được giữ lại để tích lực.
- Chiếm đóng dùng 1 hành động khi quân đứng trực tiếp trên điểm.
- Buff tồn tại theo ownership và mất ngay khi điểm đổi chủ.

Các loại điểm: Nhà, Nguồn Nước, Rừng, Núi, Mỏ Vàng, Mỏ Bạc, Mỏ Sắt, Thành Trì.

## Random Map Generator V0.6

- Mỗi map có seed và có thể tái tạo hoàn toàn.
- Seed được lưu trong query `?seed=...`; cùng seed = cùng bố cục.
- 12 điểm chiến lược: 10 điểm thuộc hai vùng Tây/Đông + 2 điểm tranh chấp trung tâm.
- Số điểm Tây/Đông giới hạn ở 4–6, 5–5 hoặc 6–4.
- Pool 10 điểm hai phía được partition bằng `BalanceValue` để tối thiểu hóa chênh lệch tổng giá trị.
- Vị trí cặp Tây/Đông đối xứng 180° để cân bằng khoảng cách tới hai Thành Chính.
- Nếu một phía có 6 điểm, các điểm thêm được chọn để giữ khoảng cách trung bình gần phía còn lại.
- UI hiển thị seed, số điểm, tổng BV, ΔBV và Δ khoảng cách.
- Nút **MAP MỚI** sinh seed khác.
- Generator nằm ở `src/game/data/v06.ts`; scene V0.6 tái sử dụng toàn bộ gameplay V0.5 bằng cách truyền danh sách strategic points vào constructor.

## Unit ban đầu

Lính, Cung Thủ, Kỵ Binh, Trọng Binh, Pháp Sư, Trị Liệu Sư.

## Phiên bản hiện tại

**V0.6 — Random Map Generator.**

Mốc tiếp theo sau khi user test/duyệt: **V0.7 — Mana & Skills**.
