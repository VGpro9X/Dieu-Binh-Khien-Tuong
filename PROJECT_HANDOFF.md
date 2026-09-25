# PROJECT HANDOFF — Điều Binh Khiển Tướng

## Nguyên tắc cố định

- Web game chiến thuật theo lượt, map bàn cờ, toàn bộ UI/ngôn ngữ trong game bằng tiếng Việt.
- Đồ họa 2D; tương lai nâng bằng animation/effect tạo cảm giác 2.5D, không chuyển core sang 3D.
- Tọa độ grid tách khỏi tọa độ render; gameplay/rules tách khỏi renderer.
- Unit, terrain, tài nguyên và skill đi theo hướng data-driven.
- Sau mỗi mốc V0.x: build/typecheck → deploy GitHub Pages → dừng để user test trước khi sang bản tiếp.

## Cơ chế triệu hồi

- Mở trận: mỗi phe triệu hồi đúng 1 đơn vị.
- Từ lượt chiến đấu: không giới hạn 1 quân/lượt; có thể tiêu hết Điểm Điều Binh nếu còn ô triển khai.
- Quân mới được hành động ngay.
- Thành Chính có 8 ô triển khai quanh Thành.
- Thành Trì chiếm được mở thêm vùng triển khai quân quanh nó.

## Kinh tế, lãnh thổ và map

- Bắt đầu: 8 Điểm Điều Binh mỗi phe; thu nhập cơ bản +3/lượt.
- Điểm chiến lược cộng thu nhập/buff theo ownership.
- V0.6: map có seed, 12 điểm, phân bố Tây/Đông 4–6 / 5–5 / 6–4, cân bằng BalanceValue + khoảng cách.
- Seed nằm trong `?seed=...`; nút MAP MỚI sinh seed khác.

## Mana & Skills V0.7

- Mana hiện áp dụng cho Pháp Sư và Trị Liệu Sư: 100 tối đa, 60 khởi đầu.
- Pháp Sư: **Hỏa Cầu**, 35 Mana, tầm 2–4, sát thương phép + Thiêu Đốt.
- Nội tại Pháp Sư **Dẫn Ma**: hồi 20 Mana đầu lượt.
- Trị Liệu Sư: **Trị Liệu**, 30 Mana, tầm 0–3, hồi 38 HP + Hồi Phục.
- Nội tại Trị Liệu Sư **Từ Tâm**: Trị Liệu luôn ban Hồi Phục.
- Trị Liệu Sư hồi 15 Mana đầu lượt.
- Nguồn Nước: ngoài +1 Điểm/lượt và hồi 4 HP như V0.5, từ V0.7 mỗi điểm còn cho +10 Mana/đầu lượt cho từng Pháp Sư/Trị Liệu Sư của phe.
- Thiêu Đốt: -7 HP đầu lượt × 2 lượt.
- Hồi Phục: +6 HP đầu lượt × 2 lượt.
- Kỹ năng tiêu hao slot Hành động, không tiêu hao slot Di chuyển.
- Hệ skill/mana/status được khai báo data-driven tại `src/game/data/v07.ts`.

## Unit ban đầu

Lính, Cung Thủ, Kỵ Binh, Trọng Binh, Pháp Sư, Trị Liệu Sư.

## Phiên bản hiện tại

**V0.7 — Mana & Skills.**

Mốc tiếp theo sau khi user test/duyệt: **V0.8 — AI**.
