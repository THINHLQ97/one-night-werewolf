# One Night Werewolf - Product Requirements Document

## Tổng quan

**One Night Werewolf** là game social deduction online dựa trên board game "One Night Ultimate Werewolf". Người chơi được chia bài bí mật, trải qua 1 đêm hành động, rồi thảo luận và bỏ phiếu loại ai trong ngày.

- **Platform**: Web (mobile-first, responsive)
- **Tech stack**: React + Vite + Tailwind (client) / Node.js + Express + Socket.IO (server)
- **Players**: 3-10 người/phòng
- **Deployment**: Docker, Vercel (client), Render (server)

---

## Tính năng hiện tại (v1.0)

### Core Gameplay
- **22 vai trò** (11 Base + 11 Daybreak) với đầy đủ night actions
- **5 pha game**: Lobby → Role Reveal (15s) → Night (30s/role) → Day (5 phút) → Results
- **Win conditions**: Tanner win (ưu tiên cao nhất) > Werewolf win > Village win
- **Hunter phase**: Thợ Săn bị loại sẽ bắn thêm 1 người (cascade elimination)
- **Bodyguard**: Bảo vệ thay vì vote, chặn elimination

### Night Phase
- Night order tự động theo thứ tự chuẩn (Sentinel → Wolves → Minion → Mason → Seer → ...)
- Multi-step roles: Paranormal Investigator (xem 2 người, biến đổi nếu thấy wolf/tanner), Witch (xem + swap)
- Sentinel shield: Chặn view/swap trên người được bảo vệ
- Alpha Wolf: Thêm lá bài thứ 4 ở giữa (centerWolf)
- Solo Werewolf: Được xem 1 lá giữa

### Day Phase
- Timer 5 phút (host điều chỉnh ±30s, ±1m, pause/resume, force end)
- **Deduction Board (Token Claim Board)**: Ma trận suy luận với conflict detection
- Real-time vote tracking, knowledge notebook từ đêm
- Role Library: Tra cứu tất cả vai trò trong game

### Room & Multiplayer
- Room code 4 ký tự (loại trừ I, O, L, 1 tránh nhầm)
- Host controls: Chọn bài, chọn mode (Base/Daybreak/Combined), bắt đầu game
- Auto host transfer khi host disconnect
- Reconnection 30 phút với token-based matching
- localStorage persist tên + room code

### Audio
- Web Audio API synthesized: Night BGM (drone + pad + wind), Day BGM (major chord)
- SFX: Card flip, reveal, vote, game over, wolf howl

### Deployment
- Docker multi-stage build
- Server serve static client build
- Vercel SPA config cho client

---

## Roadmap - Tính năng phát triển tương lai

### Phase 2: Polish & Quality of Life

#### 2.1 Custom BGM & Sound
- [ ] Thêm file BGM thật (mp3/ogg) thay vì synthesized audio
- [ ] Volume control slider (BGM + SFX riêng)
- [ ] Mute/unmute toggle
- [ ] BGM cho từng phase: lobby, role reveal, night, day, results
- [ ] SFX phong phú hơn: timer warning, vote lock, role-specific sounds

#### 2.2 Custom Card Design
- [ ] Card back custom image thay gradient + emoji hiện tại
- [ ] Card front styling cải thiện
- [ ] Flip animation 3D khi lật bài
- [ ] Card artwork cho từng role (thay external URLs)

#### 2.3 UI/UX Improvements
- [ ] Dark/Light theme toggle
- [ ] Colorblind mode (thay đổi màu team indicators)
- [ ] Keyboard navigation đầy đủ
- [ ] Haptic feedback trên mobile
- [ ] Smooth page transitions (animation giữa các phase)
- [ ] Confetti/celebration animation khi thắng
- [ ] Loading skeleton screens

#### 2.4 Localization
- [ ] Multi-language support (EN/VI toggle)
- [ ] Tách strings ra file i18n

---

### Phase 3: Simulation & Testing Mode

#### 3.1 Bot Players (Chế độ giả lập)
- [ ] Host có thể "Add Bot" trong lobby (1-9 bots)
- [ ] Bot tự động thực hiện night actions (random hoặc rule-based)
- [ ] Bot tự động vote trong day phase
- [ ] Bot levels:
  - **Random Bot**: Hành động hoàn toàn ngẫu nhiên
  - **Smart Bot**: Werewolf bot vote village, Seer bot vote dựa trên thông tin đêm
- [ ] Dev mode: Skip timers, instant transitions, xem tất cả cards
- [ ] Solo play: 1 người + bots để test/practice

#### 3.2 Game Replay
- [ ] Record toàn bộ game state theo từng phase
- [ ] Replay viewer: Xem lại game từ góc nhìn bất kỳ người chơi
- [ ] Share replay link

---

### Phase 4: Social & Engagement

#### 4.1 In-game Chat & Voice
- [ ] Text chat trong day phase
- [ ] Voice chat integration (WebRTC hoặc third-party)
- [ ] Chat moderation: Chặn role name trong chat khi đang night
- [ ] Emoji reactions nhanh (👍 😱 🤔 🐺)

#### 4.2 Player Profiles & Stats
- [ ] Tài khoản người chơi (optional, có thể chơi anonymous)
- [ ] Win/loss tracking per role
- [ ] Leaderboard: Win rate, games played
- [ ] Achievements/badges: "Sói sống sót 10 game", "PI biến thành Tanner", v.v.
- [ ] Game history: Danh sách các game đã chơi

#### 4.3 Friends & Social
- [ ] Friend list
- [ ] Invite friends vào room
- [ ] Recent players list

---

### Phase 5: Advanced Gameplay

#### 5.1 Additional Expansions
- [ ] **Vampire**: Expansion mới với Vampire team (3-team game)
- [ ] **Alien**: Expansion với Alien invasion mechanics
- [ ] **Super Villains**: Thêm vai trò mạnh hơn
- [ ] Custom roles: Host tự tạo vai trò với night action template

#### 5.2 Game Modes
- [ ] **Speed Mode**: Timer ngắn hơn (2 phút day, 15s/role night)
- [ ] **Extended Mode**: 2 đêm thay vì 1 (Two Night variant)
- [ ] **No Reveal Mode**: Không hiện role khi game kết thúc
- [ ] **Ranked Mode**: ELO-based matchmaking
- [ ] **Tournament Mode**: Bracket system, nhiều round

#### 5.3 Spectator Mode
- [ ] Spectator slot (xem game không tham gia)
- [ ] Spectator thấy tất cả cards + actions real-time
- [ ] Spectator chat riêng (không ảnh hưởng game)
- [ ] Stream-friendly mode: Delay spectator view 30s

#### 5.4 Advanced Deduction Tools
- [ ] Note-taking pad cá nhân
- [ ] Timeline view: Xem lại các sự kiện đêm theo thứ tự
- [ ] Probability calculator: Tự động tính xác suất dựa trên claims
- [ ] Accusation system: Chỉ đích danh + lý do trước khi vote

---

### Phase 6: Infrastructure & Scale

#### 6.1 Persistence & Database
- [ ] Database cho game state (MongoDB/PostgreSQL thay in-memory)
- [ ] Server restart không mất game đang chơi
- [ ] Game history lưu vĩnh viễn
- [ ] Room cleanup tự động sau 2h inactive

#### 6.2 Performance & Reliability
- [ ] Redis cho session management
- [ ] Horizontal scaling (multiple server instances)
- [ ] Rate limiting & anti-abuse
- [ ] Health check endpoint
- [ ] Error tracking (Sentry)
- [ ] Analytics (game completion rate, popular roles, avg game time)

#### 6.3 Security
- [ ] Anti-cheat: Chặn inspect element xem cards
- [ ] Rate limiting socket events
- [ ] Input sanitization
- [ ] Room password protection
- [ ] Ban/kick player (host control)

#### 6.4 PWA & Mobile
- [ ] Progressive Web App (offline lobby, push notifications)
- [ ] Install prompt trên mobile
- [ ] Native-like experience (fullscreen, orientation lock)
- [ ] Push notification khi đến lượt hoặc game bắt đầu

---

### Phase 7: Monetization (Optional)

#### 7.1 Cosmetics
- [ ] Custom avatars
- [ ] Card skin packs (thay đổi artwork)
- [ ] Table themes (forest, castle, village backgrounds)
- [ ] Victory animations

#### 7.2 Premium Features
- [ ] Extended room size (>10 players)
- [ ] Priority matchmaking
- [ ] Advanced stats & analytics
- [ ] Custom game presets (save role configurations)

---

## Priority Matrix

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| P0 | Custom BGM files | Medium | Low |
| P0 | Card back custom design | Medium | Low |
| P1 | Bot players (random) | High | Medium |
| P1 | Volume control | Medium | Low |
| P1 | Multi-language (EN/VI) | Medium | Medium |
| P2 | Smart bots | Medium | High |
| P2 | Text chat | High | Medium |
| P2 | Player stats & history | Medium | Medium |
| P2 | Database persistence | High | High |
| P3 | Voice chat | High | High |
| P3 | Spectator mode | Medium | Medium |
| P3 | Game replay | Medium | High |
| P3 | Additional expansions | Medium | High |
| P4 | Ranked/Tournament | Medium | Very High |
| P4 | PWA | Medium | Medium |
| P4 | Monetization | Low | High |

---

## Technical Debt

- Hình ảnh role đang dùng external URLs (CDN bên ngoài) → Nên host local hoặc CDN riêng
- Audio hoàn toàn synthesized → Thêm file audio thật cho trải nghiệm tốt hơn
- Game state in-memory → Database cho persistence
- Không có test suite → Thêm unit tests cho gameLogic.js, integration tests cho socket events
- Không có CI/CD pipeline → Setup GitHub Actions
- Không có error tracking → Thêm Sentry hoặc tương đương
