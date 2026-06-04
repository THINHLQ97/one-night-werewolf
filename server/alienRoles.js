// ─── One Night Ultimate Alien — Role Definitions ─────────────────────────────
// Night order values follow the official app wake order numbering.

const ALIEN_ROLES = {
  // ─── ORACLE (Village, wakes first) ───────────────────────────────────────────
  oracle: {
    id: 'oracle', name: 'Oracle', nameVi: 'Nhà Tiên Tri', team: 'village',
    nightOrder: -9, hasNightAction: true, maxCount: 1, emoji: '🔮', expansion: 'alien',
    description: 'App hỏi bạn 1 câu hỏi — câu trả lời ảnh hưởng cả đêm nay.',
    nightInstruction: 'Nhà Tiên Tri, hãy mở mắt và trả lời câu hỏi từ App.',
    nightClose: 'Nhà Tiên Tri, hãy nhắm mắt lại.',
  },

  // ─── ALIEN TEAM ──────────────────────────────────────────────────────────────
  alien: {
    id: 'alien', name: 'Alien', nameVi: 'Người Ngoài Hành Tinh', team: 'alien',
    nightOrder: 1, hasNightAction: true, maxCount: 3, emoji: '👽', expansion: 'alien',
    description: 'Mở mắt, nhìn đồng bọn Alien. App sẽ chỉ thị bạn làm gì.',
    nightInstruction: 'Alien, hãy mở mắt và nhìn nhau.',
    nightClose: 'Alien, hãy nhắm mắt lại.',
  },
  syntheticalien: {
    id: 'syntheticalien', name: 'Synthetic Alien', nameVi: 'Alien Nhân Tạo', team: 'synthetic',
    nightOrder: 1, hasNightAction: true, maxCount: 1, emoji: '🤖', expansion: 'alien',
    wakesWithAliens: true,
    description: 'Mở mắt cùng Alien. Bạn thắng nếu BỊ GIẾT. Nếu bạn chết, cả Alien lẫn Dân đều thua.',
    nightInstruction: null, nightClose: null,
  },
  groob: {
    id: 'groob', name: 'Groob', nameVi: 'Groob', team: 'alien',
    nightOrder: 1, hasNightAction: true, maxCount: 1, emoji: '👾', expansion: 'alien',
    wakesWithAliens: true,
    description: 'Mở mắt cùng Alien, rồi mở riêng với Zerb. Nếu cả 2 có mặt: bạn thắng khi Zerb chết & bạn sống.',
    nightInstruction: null, nightClose: null,
  },
  zerb: {
    id: 'zerb', name: 'Zerb', nameVi: 'Zerb', team: 'alien',
    nightOrder: 1, hasNightAction: true, maxCount: 1, emoji: '👾', expansion: 'alien',
    wakesWithAliens: true,
    description: 'Mở mắt cùng Alien, rồi mở riêng với Groob. Nếu cả 2 có mặt: bạn thắng khi Groob chết & bạn sống.',
    nightInstruction: null, nightClose: null,
  },

  // ─── VILLAGE TEAM ────────────────────────────────────────────────────────────
  leader: {
    id: 'leader', name: 'Leader', nameVi: 'Thủ Lĩnh', team: 'village',
    nightOrder: 3, hasNightAction: true, maxCount: 1, emoji: '👑', expansion: 'alien',
    description: 'Mở mắt. Alien giơ ngón cái — bạn thấy vị trí Alien. Nếu tất cả Alien chỉ vào bạn → Alien thắng.',
    nightInstruction: 'Thủ Lĩnh, hãy mở mắt. Alien, hãy giơ ngón cái lên.',
    nightClose: 'Thủ Lĩnh, hãy nhắm mắt lại. Alien, hạ tay xuống.',
  },
  cow: {
    id: 'cow', name: 'Cow', nameVi: 'Bò', team: 'village',
    nightOrder: 5, hasNightAction: true, maxCount: 1, emoji: '🐄', expansion: 'alien',
    description: 'Trong lượt Alien, bạn giơ nắm đấm. Alien ngồi cạnh bạn phải tap nắm đấm.',
    nightInstruction: 'Mọi người, hãy giơ nắm đấm lên. Alien, nếu bạn ngồi cạnh Bò, hãy tap nắm đấm của Bò.',
    nightClose: 'Tất cả hạ tay xuống.',
  },
  rascal: {
    id: 'rascal', name: 'Rascal', nameVi: 'Quỷ Nhỏ', team: 'village',
    nightOrder: 7, hasNightAction: true, maxCount: 1, emoji: '😈', expansion: 'alien',
    description: 'App chỉ thị bạn CÓ THỂ hoặc PHẢI thực hiện 1 hành động (swap/robber/witch/drunk/idiot).',
    nightInstruction: 'Quỷ Nhỏ, hãy mở mắt.',
    nightClose: 'Quỷ Nhỏ, hãy nhắm mắt lại.',
  },
  exposer: {
    id: 'exposer', name: 'Exposer', nameVi: 'Kẻ Phơi Bày', team: 'village',
    nightOrder: 10, hasNightAction: true, maxCount: 1, emoji: '🔦', expansion: 'alien',
    description: 'App chỉ thị lật 1, 2 hoặc 3 bài giữa. Lật đúng số đó hoặc không lật gì.',
    nightInstruction: 'Kẻ Phơi Bày, hãy mở mắt.',
    nightClose: 'Kẻ Phơi Bày, hãy nhắm mắt lại.',
  },
  psychic: {
    id: 'psychic', name: 'Psychic', nameVi: 'Ngoại Cảm', team: 'village',
    nightOrder: 11, hasNightAction: true, maxCount: 1, emoji: '🧠', expansion: 'alien',
    description: 'App chỉ thị xem 1-2 bài — target thay đổi mỗi game (hàng xóm, trái/phải, chẵn/lẻ, giữa...).',
    nightInstruction: 'Ngoại Cảm, hãy mở mắt.',
    nightClose: 'Ngoại Cảm, hãy nhắm mắt lại.',
  },

  // ─── INDEPENDENT TEAM ────────────────────────────────────────────────────────
  mortician: {
    id: 'mortician', name: 'Mortician', nameVi: 'Nhà Quàn', team: 'mortician',
    nightOrder: 12, hasNightAction: true, maxCount: 1, emoji: '⚰️', expansion: 'alien',
    description: 'App cho xem 0, 1 hoặc 2 bài hàng xóm. Bạn thắng nếu ít nhất 1 hàng xóm bị giết & bạn sống.',
    nightInstruction: 'Nhà Quàn, hãy mở mắt.',
    nightClose: 'Nhà Quàn, hãy nhắm mắt lại.',
  },
  blob: {
    id: 'blob', name: 'Blob', nameVi: 'Blob', team: 'blob',
    nightOrder: 13, hasNightAction: true, maxCount: 1, emoji: '🟢', expansion: 'alien',
    description: 'App thông báo ai thuộc Blob. Bạn thắng nếu tất cả thành viên Blob đều KHÔNG bị giết.',
    nightInstruction: 'Blob, hãy mở mắt.',
    nightClose: 'Blob, hãy nhắm mắt lại.',
  },
};

// Roles that belong to the alien affiliation (wake together at 1A)
const ALIEN_AFFILIATION = ['alien', 'syntheticalien', 'groob', 'zerb'];

function isAlienAffiliation(roleId) {
  return ALIEN_AFFILIATION.includes(roleId);
}

// The ordered phases for the alien night
// 'aliens' is a combined phase for all alien-affiliated roles
const ALIEN_NIGHT_PHASES = [
  'oracle',
  'aliens',        // alien + synthetic + groob + zerb wake together (1A)
  'groob_zerb',    // groob & zerb wake privately (1D)
  'leader',        // leader sees alien thumbs (3C)
  'cow',           // cow fist tap (5)
  'rascal',        // app-driven action (7F)
  'exposer',       // flip center cards (10B)
  'psychic',       // app-driven view (11)
  'mortician',     // view neighbor cards (12)
  'blob',          // learn blob members (13)
];

function getAlienNightOrder(selectedRoles) {
  const roleSet = new Set(selectedRoles);
  const phases = [];

  if (roleSet.has('oracle')) phases.push('oracle');

  // Aliens phase: if any alien-affiliated role exists
  const hasAliens = ALIEN_AFFILIATION.some(r => roleSet.has(r));
  if (hasAliens) phases.push('aliens');

  // Groob & Zerb private phase: only if both exist
  if (roleSet.has('groob') && roleSet.has('zerb')) phases.push('groob_zerb');

  if (roleSet.has('leader')) phases.push('leader');
  if (roleSet.has('cow')) phases.push('cow');
  if (roleSet.has('rascal')) phases.push('rascal');
  if (roleSet.has('exposer')) phases.push('exposer');
  if (roleSet.has('psychic')) phases.push('psychic');
  if (roleSet.has('mortician')) phases.push('mortician');
  if (roleSet.has('blob')) phases.push('blob');

  return phases;
}

module.exports = { ALIEN_ROLES, getAlienNightOrder, ALIEN_AFFILIATION, isAlienAffiliation };
