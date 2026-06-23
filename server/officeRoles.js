// ─── One Night Office — Role Definitions ─────────────────────────────────────
// Snake faction (Toxic), Staff faction (employees), Ishikoi faction (3rd party).

const OFFICE_ROLES = {
  // ─── OUTSOURCING (wakes first — copies a center card) ──────────────────────
  outsourcing: {
    id: 'outsourcing', name: 'Outsourcing', nameVi: 'Nhân Viên Thời Vụ', team: 'staff',
    nightOrder: 0, hasNightAction: true, maxCount: 1, emoji: '🤝', expansion: 'office',
    multiStep: true,
    description: 'Thức dậy đầu tiên. Bắt buộc xem 1 bài giữa và biến thành vai đó. Nếu vai mới có hành động đêm, thực hiện ngay.',
    nightInstruction: 'Nhân Viên Thời Vụ, mở mắt. Chọn 1 bài ở giữa để xem và trở thành vai đó.',
    nightClose: 'Nhân Viên Thời Vụ, hãy nhắm mắt lại.',
  },

  // ─── SNAKE TEAM ───────────────────────────────────────────────────────────
  snake: {
    id: 'snake', name: 'Snake', nameVi: 'Rắn Văn Phòng', team: 'snake',
    nightOrder: 1, hasNightAction: true, maxCount: 2, emoji: '🐍', expansion: 'office',
    description: 'Thức dậy cùng dàn Rắn để biết mặt đồng bọn. Không có hành động đặc biệt.',
    nightInstruction: 'Phe Rắn, hãy mở mắt và nhìn nhau.',
    nightClose: 'Phe Rắn, hãy nhắm mắt lại.',
  },
  toxic_manager: {
    id: 'toxic_manager', name: 'Toxic Manager', nameVi: 'Trưởng Phòng Toxic', team: 'snake',
    nightOrder: 2, hasNightAction: true, maxCount: 1, emoji: '😤', expansion: 'office',
    wakesWithSnakes: true,
    description: 'Thức dậy cùng Rắn. Đặt lá Rắn bổ sung lên 1 người không phải Rắn (đẩy bài cũ vào giữa). Người đó biến thành Phe Rắn.',
    nightInstruction: 'Trưởng Phòng Toxic, chọn 1 người chơi để đẩy lá Rắn lên.',
    nightClose: 'Trưởng Phòng Toxic, hãy nhắm mắt lại.',
  },
  stalker: {
    id: 'stalker', name: 'Stalker', nameVi: 'Kẻ Rình Rập', team: 'snake',
    nightOrder: 3, hasNightAction: true, maxCount: 1, emoji: '👀', expansion: 'office',
    wakesWithSnakes: true,
    description: 'Thức dậy cùng Rắn. Xem bài của 1 người khác để nắm thóp.',
    nightInstruction: 'Kẻ Rình Rập, chọn 1 người chơi để xem bài của họ.',
    nightClose: 'Kẻ Rình Rập, hãy nhắm mắt lại.',
  },
  snoop: {
    id: 'snoop', name: 'Snoop', nameVi: 'Kẻ Nhòm Ngó', team: 'snake',
    nightOrder: 4, hasNightAction: true, maxCount: 1, emoji: '🔍', expansion: 'office',
    wakesWithSnakes: true,
    description: 'Thức dậy cùng Rắn. Xem bí mật 1 trong 3 lá bài ở giữa bàn.',
    nightInstruction: 'Kẻ Nhòm Ngó, chọn 1 bài ở giữa để xem.',
    nightClose: 'Kẻ Nhòm Ngó, hãy nhắm mắt lại.',
  },

  // ─── ISHIKOI FACTION ──────────────────────────────────────────────────────
  ishikoi: {
    id: 'ishikoi', name: 'Ishikoi', nameVi: 'Ishikoi.vn', team: 'ishikoi',
    nightOrder: null, hasNightAction: false, maxCount: 1, emoji: '🐟', expansion: 'office',
    description: 'Không thức dậy ban đêm. Thắng nếu bị vote sa thải.',
    nightInstruction: null,
    nightClose: null,
  },
  netizen: {
    id: 'netizen', name: 'Netizen', nameVi: 'Cộng Đồng Mạng', team: 'ishikoi',
    nightOrder: 6, hasNightAction: true, maxCount: 1, emoji: '📣', expansion: 'office',
    description: 'Mở mắt, App chỉ rõ ai là Ishikoi. Thắng nếu Ishikoi bị vote. Nếu không có Ishikoi, tự gánh điều kiện thắng y hệt Ishikoi.',
    nightInstruction: 'Cộng Đồng Mạng, hãy mở mắt. App sẽ chỉ rõ ai là Ishikoi.',
    nightClose: 'Cộng Đồng Mạng, hãy nhắm mắt lại.',
  },

  // ─── STAFF FACTION ────────────────────────────────────────────────────────
  tracker: {
    id: 'tracker', name: 'Tracker', nameVi: 'Máy Chấm Công', team: 'staff',
    nightOrder: 5, hasNightAction: true, maxCount: 1, emoji: '🕒', expansion: 'office',
    description: 'Thức dậy và biết có 0/1/2 con Rắn đang ngồi cạnh bạn (không biết hướng).',
    nightInstruction: 'Máy Chấm Công, hãy mở mắt. Bạn cảm nhận được số Rắn ngồi cạnh.',
    nightClose: 'Máy Chấm Công, hãy nhắm mắt lại.',
  },
  spammer: {
    id: 'spammer', name: 'Spammer', nameVi: 'Đồng Nghiệp Kém Duyên', team: 'staff',
    nightOrder: 7, hasNightAction: true, maxCount: 1, emoji: '📨', expansion: 'office',
    description: 'Chọn 1 trong 2 người ngồi cạnh để "làm phiền". Họ sẽ nhận thông báo có Spammer ở phía bạn (trái/phải).',
    nightInstruction: 'Spammer, hãy mở mắt và chọn 1 hàng xóm để gây phiền.',
    nightClose: 'Spammer, hãy nhắm mắt lại.',
  },
  ceo: {
    id: 'ceo', name: 'CEO', nameVi: 'CEO Duy Ca', team: 'staff',
    nightOrder: 8, hasNightAction: true, maxCount: 1, emoji: '👔', expansion: 'office',
    description: 'Xem bài của 1 người HOẶC 2 trong 3 lá bài ở giữa.',
    nightInstruction: 'CEO, hãy mở mắt. Xem bài 1 người hoặc 2 bài ở giữa.',
    nightClose: 'CEO, hãy nhắm mắt lại.',
  },
  poacher: {
    id: 'poacher', name: 'Poacher', nameVi: 'Kẻ Trộm KPI', team: 'staff',
    nightOrder: 9, hasNightAction: true, maxCount: 1, emoji: '💼', expansion: 'office',
    description: 'Hoán đổi bài của bạn với 1 người khác, rồi xem bài mới. Bạn chuyển ngay sang phe của bài đó.',
    nightInstruction: 'Kẻ Trộm KPI, chọn 1 người để đổi bài và xem bài mới.',
    nightClose: 'Kẻ Trộm KPI, hãy nhắm mắt lại.',
  },
  legal: {
    id: 'legal', name: 'Legal', nameVi: 'Chuyên Viên Pháp Chế', team: 'staff',
    nightOrder: 10, hasNightAction: true, maxCount: 1, emoji: '⚖️', expansion: 'office',
    description: 'Lật ngửa 1 bài của người khác. Nếu là Rắn hoặc Ishikoi → úp xuống bí mật. Nếu là Staff → công khai cho cả phòng thấy.',
    nightInstruction: 'Chuyên Viên Pháp Chế, mở mắt và chọn 1 người để lật bài.',
    nightClose: 'Chuyên Viên Pháp Chế, hãy nhắm mắt lại.',
  },
  dumper: {
    id: 'dumper', name: 'Dumper', nameVi: 'Kẻ Đẩy Việc', team: 'staff',
    nightOrder: 11, hasNightAction: true, maxCount: 1, emoji: '📦', expansion: 'office',
    multiStep: true,
    description: 'Xem 1 lá bài ở giữa, rồi BẮT BUỘC tráo lá đó với bài của 1 người bất kỳ (kể cả mình). Lá người đó đẩy vào giữa — Dumper không xem được.',
    nightInstruction: 'Kẻ Đẩy Việc, xem 1 bài giữa rồi tráo cho 1 người chơi.',
    nightClose: 'Kẻ Đẩy Việc, hãy nhắm mắt lại.',
  },
  hr: {
    id: 'hr', name: 'HR', nameVi: 'Chuyên Viên Nhân Sự', team: 'staff',
    nightOrder: 12, hasNightAction: true, maxCount: 1, emoji: '📋', expansion: 'office',
    description: 'Hoán đổi bài của 2 người khác mà không được nhìn nội dung.',
    nightInstruction: 'Chuyên Viên Nhân Sự, mở mắt và hoán đổi bài của 2 người khác.',
    nightClose: 'Chuyên Viên Nhân Sự, hãy nhắm mắt lại.',
  },
  paranoid: {
    id: 'paranoid', name: 'Paranoid', nameVi: 'Kẻ Lo Âu', team: 'staff',
    nightOrder: 13, hasNightAction: true, maxCount: 1, emoji: '😰', expansion: 'office',
    description: 'Thức dậy cuối cùng. Xem bài hiện tại của chính mình.',
    nightInstruction: 'Kẻ Lo Âu, mở mắt và xem bài hiện tại của bạn.',
    nightClose: 'Kẻ Lo Âu, hãy nhắm mắt lại.',
  },
};

const SNAKE_TEAM_ROLES = ['snake', 'toxic_manager', 'stalker', 'snoop'];
const STAFF_TEAM_ROLES = ['tracker', 'spammer', 'ceo', 'poacher', 'hr', 'dumper', 'paranoid', 'legal'];
const ISHIKOI_TEAM_ROLES = ['ishikoi', 'netizen'];

function isSnakeRole(roleId) {
  return SNAKE_TEAM_ROLES.includes(roleId);
}

function isStaffRole(roleId) {
  return STAFF_TEAM_ROLES.includes(roleId);
}

function isIshikoiRole(roleId) {
  return ISHIKOI_TEAM_ROLES.includes(roleId);
}

// Wake-up order for night phase (Ishikoi doesn't wake)
const ACTIVE_NIGHT_ROLES = [
  'outsourcing',                                          // 0
  'snake', 'toxic_manager', 'stalker', 'snoop',           // 1-4
  'spammer',                                              // 5
  'tracker',                                              // 6 (snakes learn who Tracker is after this)
  'netizen',                                              // 7
  'ceo',                                                  // 8
  'poacher',                                              // 9
  'legal',                                                // 10
  'dumper',                                               // 11
  'hr',                                                   // 12
  'paranoid',                                             // 13 (wakes last to see final card)
];

function getOfficeNightOrder(selectedRoles) {
  const roleSet = new Set(selectedRoles);
  // If any snake sub-role is selected, ensure base 'snake' phase exists so they wake together
  if (roleSet.has('toxic_manager') || roleSet.has('stalker') || roleSet.has('snoop')) {
    roleSet.add('snake');
  }
  return ACTIVE_NIGHT_ROLES.filter(r => roleSet.has(r));
}

module.exports = {
  OFFICE_ROLES,
  SNAKE_TEAM_ROLES,
  STAFF_TEAM_ROLES,
  ISHIKOI_TEAM_ROLES,
  isSnakeRole,
  isStaffRole,
  isIshikoiRole,
  getOfficeNightOrder,
};
