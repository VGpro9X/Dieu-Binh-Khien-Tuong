# PROJECT HANDOFF — Điều Binh Khiển Tướng

## Nguyên tắc cố định

- Game web chiến thuật theo lượt, bản đồ dạng bàn cờ.
- Toàn bộ ngôn ngữ hiển thị cho người chơi là tiếng Việt.
- Đồ họa giữ kiến trúc 2D, về sau nâng cấp bằng animation/effect để tạo cảm giác 2.5D; không chuyển core game sang 3D.
- Logic tọa độ grid phải tách khỏi tọa độ hiển thị.
- Gameplay/rules phải tách khỏi renderer để có thể thay đổi đồ họa mà không viết lại luật chơi.
- Unit/resource/terrain đi theo hướng data-driven, tránh hard-code theo từng class cụ thể.

## Cơ chế triệu hồi đã chốt

- Tài nguyên chính: **Điểm Điều Binh**.
- Mỗi phe khởi đầu với 8 điểm; thu nhập cơ bản V0.4 là +3 ở đầu mỗi lượt của phe đó.
- Giai đoạn mở đầu: mỗi phe triệu hồi đúng 1 đơn vị.
- Từ lượt chính thức: không giới hạn 1 đơn vị/lượt.
- Người chơi có thể dùng toàn bộ Điểm Điều Binh đang có để triệu hồi nhiều đơn vị trong cùng lượt.
- Giới hạn triệu hồi đến từ Điểm Điều Binh và số ô spawn hợp lệ còn trống quanh Thành Chính.
- Quân mới triệu hồi trong lượt chính thức được hành động ngay.
- Mục tiêu của cơ chế: tăng giá trị chiếm tài nguyên, cho phép tích lực, phòng thủ khẩn cấp và tạo khả năng lật ngược thế cờ.

## Tài nguyên/điểm chiến lược dự kiến

Nhà, Nước, Rừng, Núi, Mỏ Vàng, Mỏ Bạc, Mỏ Sắt, Thành Trì và các loại sẽ bổ sung sau.

Phân bố map ngẫu nhiên nhưng chênh lệch số điểm giữa hai phía không vượt quá 6–4. Generator về sau phải cân bằng cả tổng BalanceValue và khoảng cách, không chỉ đếm số lượng.

## Unit ban đầu

Lính, Cung Thủ, Kỵ Binh, Trọng Binh, Pháp Sư, Trị Liệu Sư.

## Core hiện có

- Board 14×10 và địa hình có movement cost.
- Pathfinding + unit/Thành Chính blocking.
- Mỗi unit có 1 lượt di chuyển + 1 hành động mỗi turn.
- Combat vật lý/phép, armor/resistance, tầm đánh, damage preview, HP/death.
- Hai Thành Chính và vùng spawn riêng.
- EconomyManager quản lý Điểm Điều Binh; TurnManager có phase triệu hồi mở đầu và phase chiến đấu.

## Quy trình version

Sau mỗi mốc V0.x hoàn chỉnh:

1. Build/typecheck.
2. Push code lên `main`.
3. Deploy bản test lên GitHub Pages.
4. Smoke test URL public và asset.
5. Báo người dùng phiên bản, thay đổi chính và URL test.
6. Chờ phản hồi test trước khi chuyển sang mốc V kế tiếp.

## Phiên bản hiện tại

**V0.4 — Điểm Điều Binh & Triệu Hồi.**

Mốc kế tiếp sau khi người dùng test/duyệt: **V0.5 — hệ chiếm đóng, ownership, thu nhập và buff từ điểm chiến lược.**
