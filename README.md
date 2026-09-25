# Điều Binh Khiển Tướng

Web game chiến thuật theo lượt trên bàn cờ 2D, định hướng nâng cấp dần thành 2D + animation/effect tạo cảm giác 2.5D.

## Phiên bản hiện tại: V0.9 — Chiến trường 2.5D

V0.9 tập trung vào đồ họa vector 2D có chiều sâu mà không thay đổi luật chơi từ V0.1–V0.8:

- **Địa hình mới:** phối màu từng loại địa hình, ô bàn cờ có cạnh nổi, họa tiết cỏ/rừng/đồi đá/nước cạn dựng bằng Graphics. Họa tiết được sinh ổn định theo map seed.
- **Thành Chính và điểm chiến lược:** thêm bóng đổ, tháp canh, bệ 3D giả lập, vòng sáng theo màu phe kiểm soát.
- **6 lớp quân:** mỗi quân có bệ nổi, bóng, ánh sáng và biểu tượng vector riêng theo vai trò; nhãn và thanh máu cũ vẫn hiển thị.
- **Chiến đấu:** các đòn đánh có đường bay riêng theo lớp quân và hiệu ứng va chạm, tia sáng, hạt văng; Hỏa Cầu có vệt lửa và hiệu ứng nổ; Trị Liệu có vòng hồi phục xanh ngọc.
- **Động tác trận:** hiệu ứng triệu hồi, đường bụi khi di chuyển, bùng sáng khi chiếm điểm, hiệu ứng mất quân, thông báo chuyển lượt và popup cho tick Thiêu Đốt/Hồi Phục.
- **Giảm hiệu ứng trên điện thoại:** nút `FX: ĐẦY ĐỦ / FX: GỌN` ở phía trên bên trái; chế độ gọn giới hạn hạt và tắt rung màn hình. Thiết bị màn hình nhỏ hoặc bật Reduced Motion khởi động mặc định với FX GỌN.
- **Giữ nguyên gameplay:** AI Phe Đỏ, chuyển chế độ hai người, random map/seed, 6 loại quân, Mana/Skills, lãnh thổ và kinh tế.
- Visual effects nằm riêng tại `src/game/visual/BattlefieldVisuals.ts`, cấu hình tại `src/game/visual/visual-config.ts` và scene kế thừa tại `src/game/scenes/BattleSceneV09.ts`. Bộ test mới: `tests/visual-config.test.mjs`.

### Cách test V0.9

1. Mở game và triệu hồi Lính/Pháp Sư/Trị Liệu Sư; quan sát hình dạng quân, bệ và bóng đổ mới, cùng hiệu ứng triệu hồi.
2. Cho quân di chuyển qua cỏ, rừng, nước cạn/đồi đá; kiểm tra họa tiết rõ ràng, đường đi/tầm đánh và vị trí quân không bị lệch.
3. Giao tranh bằng cung, kiếm và Hỏa Cầu; thử Trị Liệu để kiểm tra projectile và va chạm riêng.
4. Chiếm một điểm chiến lược để xem vòng sáng thay màu; kết thúc lượt để xem banner, Thiêu Đốt/Hồi Phục nếu có.
5. Bấm `FX: ĐẦY ĐỦ` / `FX: GỌN` rồi lặp lại giao tranh; kiểm tra luật, chỉ số và kết quả không thay đổi.
6. Để Phe Đỏ ở chế độ AI trong vài lượt, rồi thử `MAP MỚI`. Kiểm tra hiệu ứng cũng chạy trên các hành động của AI.

## Mốc V0.8 — AI chiến thuật

- **Phe Xanh do người chơi điều khiển; Phe Đỏ do máy điều khiển mặc định.** Máy tự triệu hồi một quân mở đầu sau Phe Xanh.
- Khi Phe Xanh kết thúc lượt, Phe Đỏ tự xử lý lần lượt các nước đi: triệu hồi, chiếm điểm, dùng Hỏa Cầu/Trị Liệu (nếu phù hợp), tấn công, di chuyển và kết thúc lượt.
- Quyết định chiếm đóng dùng cả giá trị tài nguyên và khoảng cách; AI chuyển sang bảo vệ Thành Chính nếu quân Xanh đến gần.
- Khi đang có lợi thế quân số, AI có thể giữ Điểm Điều Binh thay vì triệu hồi liên tục; gặp nguy hiểm, AI ưu tiên gọi Trọng Binh/Cung Thủ.
- AI sử dụng trực tiếp luật movement, combat, summon, capture và Mana/status của V0.2–V0.7; không có quân miễn phí hoặc sát thương ngoài luật.
- Bấm **PHE ĐỎ: MÁY • ĐỔI CHẾ ĐỘ** trong lượt Phe Xanh để chuyển sang 2 người trên cùng thiết bị; cũng có thể dùng URL với `?mode=2p`. Việc đổi chế độ không reset trận.
- Giữ nguyên Random Map Generator + seed của V0.6 và toàn bộ tính năng Mana & Skills V0.7.
- Bộ AI tách riêng thành `src/game/ai/AIPlanner.ts`, kèm kiểm thử quyết định trong `tests/ai-planner.test.mjs`.

### Cách test V0.8

1. Mở game, giữ chế độ **Phe Đỏ: Máy** và triệu hồi một quân cho Phe Xanh. Phe Đỏ phải tự triệu hồi quân mở đầu.
2. Kết thúc lượt Xanh để máy triệu hồi (nếu đủ điểm), di chuyển về phía tài nguyên, chiếm điểm hoặc giao tranh tùy tình hình.
3. Tiến quân Xanh đến gần Thành Chính Đỏ để quan sát máy ưu tiên phòng thủ, rồi thử để máy có ưu thế quân số xem máy có tích Điểm Điều Binh.
4. Tiếp tục vài lượt để thử Hỏa Cầu, Trị Liệu, hồi Mana và hiệu ứng theo lượt khi máy có các lớp quân phù hợp.
5. Trong lượt Xanh, bấm nút đổi chế độ; ở lượt tiếp theo, Phe Đỏ phải chờ người thứ hai thao tác thay vì tự đi.
6. Thử **MAP MỚI**, kiểm tra seed và việc AI vận hành trên bản đồ mới.

## Mốc V0.7 đã hoàn thành

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
- **V0.8 — AI:** chiếm tài nguyên, giao tranh, phòng thủ, triệu hồi và tích tài nguyên. ✅
- **V0.9 — Visual 2.5D:** shadow, tween, projectile, camera effect, particle và terrain animation. ✅
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
