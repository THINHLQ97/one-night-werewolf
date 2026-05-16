const ROLES = {
  // ─── BASE GAME ───────────────────────────────────────────────────────────────
  werewolf: {
    id: 'werewolf', name: 'Werewolf', nameVi: 'Người Sói', team: 'werewolf',
    nightOrder: 2, hasNightAction: true, maxCount: 5, emoji: '🐺', expansion: 'base',
    description: 'Bạn là Người Sói! Hãy nhìn xung quanh để tìm đồng bọn.',
    nightInstruction: 'Người Sói, hãy mở mắt và nhìn nhau.',
    nightClose: 'Người Sói, hãy nhắm mắt lại.',
  },
  minion: {
    id: 'minion', name: 'Minion', nameVi: 'Tay Sai', team: 'werewolf',
    nightOrder: 3, hasNightAction: true, maxCount: 1, emoji: '🦹', expansion: 'base',
    description: 'Bạn là Tay Sai! Hỗ trợ phe Sói nhưng Sói không biết bạn là ai.',
    nightInstruction: 'Tay Sai, hãy mở mắt. Người Sói hãy giơ tay để Tay Sai nhận biết.',
    nightClose: 'Tay Sai, hãy nhắm mắt lại.',
  },
  mason: {
    id: 'mason', name: 'Mason', nameVi: 'Sinh Đôi', team: 'village',
    nightOrder: 4, hasNightAction: true, maxCount: 2, emoji: '🤝', expansion: 'base',
    description: 'Bạn là Sinh Đôi! Mở mắt và nhìn nhau để biết ai cùng phe.',
    nightInstruction: 'Sinh Đôi, hãy mở mắt và nhìn nhau.',
    nightClose: 'Sinh Đôi, hãy nhắm mắt lại.',
  },
  seer: {
    id: 'seer', name: 'Seer', nameVi: 'Tiên tri', team: 'village',
    nightOrder: 5, hasNightAction: true, maxCount: 1, emoji: '🔮', expansion: 'base',
    description: 'Bạn là Tiên tri! Xem bài của một người khác, hoặc 2 bài ở giữa.',
    nightInstruction: 'Tiên tri, hãy mở mắt. Bạn có thể xem bài của một người, hoặc 2 bài ở giữa.',
    nightClose: 'Tiên tri, hãy nhắm mắt lại.',
  },
  robber: {
    id: 'robber', name: 'Robber', nameVi: 'Tên Trộm', team: 'village',
    nightOrder: 6, hasNightAction: true, maxCount: 1, emoji: '🦝', expansion: 'base',
    description: 'Bạn là Tên Trộm! Đổi bài của bạn với bài của người khác và xem bài mới.',
    nightInstruction: 'Tên Trộm, hãy mở mắt. Bạn có thể lấy bài của một người và cho họ bài cũ của bạn.',
    nightClose: 'Tên Trộm, hãy nhắm mắt lại.',
  },
  troublemaker: {
    id: 'troublemaker', name: 'Troublemaker', nameVi: 'Kẻ Quậy', team: 'village',
    nightOrder: 7, hasNightAction: true, maxCount: 1, emoji: '😈', expansion: 'base',
    description: 'Bạn là Kẻ Quậy! Đổi bài của hai người khác (không xem).',
    nightInstruction: 'Kẻ Quậy, hãy mở mắt. Bạn có thể hoán đổi bài của hai người khác.',
    nightClose: 'Kẻ Quậy, hãy nhắm mắt lại.',
  },
  drunk: {
    id: 'drunk', name: 'Drunk', nameVi: 'Người Say', team: 'village',
    nightOrder: 8, hasNightAction: true, maxCount: 1, emoji: '🍺', expansion: 'base',
    description: 'Bạn là Người Say! Đổi bài với bài ở giữa (bạn không biết bài mới của mình).',
    nightInstruction: 'Người Say, hãy mở mắt và chọn một bài ở giữa để hoán đổi.',
    nightClose: 'Người Say, hãy nhắm mắt lại.',
  },
  insomniac: {
    id: 'insomniac', name: 'Insomniac', nameVi: 'Mất Ngủ', team: 'village',
    nightOrder: 9, hasNightAction: true, maxCount: 1, emoji: '👁️', expansion: 'base',
    description: 'Bạn là người Mất Ngủ! Bạn thức dậy cuối cùng và xem bài hiện tại của mình.',
    nightInstruction: 'Người Mất Ngủ, hãy mở mắt và xem bài hiện tại của bạn.',
    nightClose: 'Người Mất Ngủ, hãy nhắm mắt lại.',
  },
  villager: {
    id: 'villager', name: 'Villager', nameVi: 'Dân Làng', team: 'village',
    nightOrder: 99, hasNightAction: false, maxCount: 5, emoji: '👨‍🌾', expansion: 'base',
    description: 'Bạn là Dân Làng! Không có hành động đặc biệt ban đêm.',
    nightInstruction: null, nightClose: null,
  },
  hunter: {
    id: 'hunter', name: 'Hunter', nameVi: 'Thợ Săn', team: 'village',
    nightOrder: 99, hasNightAction: false, maxCount: 1, emoji: '🏹', expansion: 'base',
    description: 'Bạn là Thợ Săn! Nếu bạn bị loại, người bạn vote cũng bị loại theo.',
    nightInstruction: null, nightClose: null,
  },
  tanner: {
    id: 'tanner', name: 'Tanner', nameVi: 'Kẻ Tự Hủy', team: 'tanner',
    nightOrder: 99, hasNightAction: false, maxCount: 1, emoji: '💀', expansion: 'base',
    description: 'Bạn là Kẻ Tự Hủy! Bạn thắng nếu bị loại khỏi game.',
    nightInstruction: null, nightClose: null,
  },

  // ─── DAYBREAK ────────────────────────────────────────────────────────────────
  sentinel: {
    id: 'sentinel', name: 'Sentinel', nameVi: 'Lính Canh', team: 'village',
    nightOrder: 1, hasNightAction: true, maxCount: 1, emoji: '🛡️', expansion: 'daybreak',
    description: 'Đặt khiên lên 1 người chơi. Bài của họ không thể bị xem hay đổi.',
    nightInstruction: 'Lính Canh, hãy mở mắt. Chọn 1 người để đặt khiên bảo vệ.',
    nightClose: 'Lính Canh, hãy nhắm mắt lại.',
  },
  alphawolf: {
    id: 'alphawolf', name: 'Alpha Wolf', nameVi: 'Sói Đầu Đàn', team: 'werewolf',
    nightOrder: 2.1, hasNightAction: true, maxCount: 1, emoji: '🐺', expansion: 'daybreak',
    wakesWithWolves: true,
    description: 'Sói Đầu Đàn! Sau khi Sói mở mắt, đổi 1 bài giữa cho 1 người khác (biến họ thành Sói).',
    nightInstruction: 'Sói Đầu Đàn, chọn 1 bài ở giữa và đặt trước mặt 1 người chơi khác.',
    nightClose: 'Sói Đầu Đàn, hãy nhắm mắt lại.',
  },
  mysticwolf: {
    id: 'mysticwolf', name: 'Mystic Wolf', nameVi: 'Sói Thần Bí', team: 'werewolf',
    nightOrder: 2.2, hasNightAction: true, maxCount: 1, emoji: '🐺', expansion: 'daybreak',
    wakesWithWolves: true,
    description: 'Sói Thần Bí! Sau khi Sói mở mắt, xem bài của 1 người chơi khác.',
    nightInstruction: 'Sói Thần Bí, chọn 1 người chơi để xem bài của họ.',
    nightClose: 'Sói Thần Bí, hãy nhắm mắt lại.',
  },
  dreamwolf: {
    id: 'dreamwolf', name: 'Dream Wolf', nameVi: 'Sói Mộng Du', team: 'werewolf',
    nightOrder: 99, hasNightAction: false, maxCount: 1, emoji: '🐺', expansion: 'daybreak',
    wakesWithWolves: false,
    description: 'Sói Mộng Du! Bạn là Sói nhưng KHÔNG mở mắt cùng Sói khác. Sói khác cũng không biết bạn.',
    nightInstruction: null, nightClose: null,
  },
  apprenticeseer: {
    id: 'apprenticeseer', name: 'Apprentice Seer', nameVi: 'Tiên Tri Học Việc', team: 'village',
    nightOrder: 4.5, hasNightAction: true, maxCount: 1, emoji: '🔮', expansion: 'daybreak',
    description: 'Tiên Tri Học Việc! Xem 1 bài ở giữa bàn.',
    nightInstruction: 'Tiên Tri Học Việc, hãy mở mắt và xem 1 bài ở giữa.',
    nightClose: 'Tiên Tri Học Việc, hãy nhắm mắt lại.',
  },
  paranormalinvestigator: {
    id: 'paranormalinvestigator', name: 'P.I.', nameVi: 'Thám Tử', team: 'village',
    nightOrder: 5.5, hasNightAction: true, maxCount: 1, emoji: '🕵️', expansion: 'daybreak',
    multiStep: true,
    description: 'Thám Tử! Xem bài tối đa 2 người. Nếu thấy Sói/Tanner, bạn thành phe đó và dừng lại.',
    nightInstruction: 'Thám Tử, hãy mở mắt. Chọn 1 người để xem bài (có thể xem thêm 1 người nữa).',
    nightClose: 'Thám Tử, hãy nhắm mắt lại.',
  },
  witch: {
    id: 'witch', name: 'Witch', nameVi: 'Phù Thủy', team: 'village',
    nightOrder: 6.5, hasNightAction: true, maxCount: 1, emoji: '🧙', expansion: 'daybreak',
    multiStep: true,
    description: 'Phù Thủy! Xem 1 bài ở giữa, sau đó có thể đổi nó cho 1 người chơi.',
    nightInstruction: 'Phù Thủy, hãy mở mắt. Xem 1 bài ở giữa, sau đó bạn có thể đổi nó cho 1 người.',
    nightClose: 'Phù Thủy, hãy nhắm mắt lại.',
  },
  villageidiot: {
    id: 'villageidiot', name: 'Village Idiot', nameVi: 'Ngốc Làng', team: 'village',
    nightOrder: 7.5, hasNightAction: true, maxCount: 1, emoji: '🤪', expansion: 'daybreak',
    description: 'Ngốc Làng! Xoay bài của tất cả người khác sang trái hoặc phải.',
    nightInstruction: 'Ngốc Làng, hãy mở mắt. Chọn xoay bài mọi người sang trái hoặc phải.',
    nightClose: 'Ngốc Làng, hãy nhắm mắt lại.',
  },
  revealer: {
    id: 'revealer', name: 'Revealer', nameVi: 'Người Tiết Lộ', team: 'village',
    nightOrder: 9.5, hasNightAction: true, maxCount: 1, emoji: '🔦', expansion: 'daybreak',
    description: 'Người Tiết Lộ! Lật bài 1 người. Nếu không phải Sói/Tanner, tất cả đều thấy.',
    nightInstruction: 'Người Tiết Lộ, hãy mở mắt và chọn 1 người để lật bài.',
    nightClose: 'Người Tiết Lộ, hãy nhắm mắt lại.',
  },
  bodyguard: {
    id: 'bodyguard', name: 'Bodyguard', nameVi: 'Cận Vệ', team: 'village',
    nightOrder: 10, hasNightAction: true, maxCount: 1, emoji: '💪', expansion: 'daybreak',
    description: 'Cận Vệ! Bảo vệ 1 người. Nếu họ bị vote loại, họ sẽ được cứu.',
    nightInstruction: 'Cận Vệ, hãy mở mắt và chọn 1 người để bảo vệ.',
    nightClose: 'Cận Vệ, hãy nhắm mắt lại.',
  },
};

const WOLF_TEAM_ROLES = ['werewolf', 'alphawolf', 'mysticwolf', 'dreamwolf', 'minion'];

function isWolfRole(roleId) {
  return ['werewolf', 'alphawolf', 'mysticwolf', 'dreamwolf'].includes(roleId);
}

const ACTIVE_NIGHT_ROLES = [
  'sentinel',
  'werewolf', 'alphawolf', 'mysticwolf',
  'minion', 'mason',
  'apprenticeseer', 'seer', 'paranormalinvestigator',
  'robber', 'witch', 'troublemaker',
  'villageidiot', 'drunk',
  'insomniac', 'revealer', 'bodyguard',
];

function getNightOrder(selectedRoles) {
  const roleSet = new Set(selectedRoles);
  return ACTIVE_NIGHT_ROLES.filter(r => roleSet.has(r));
}

module.exports = { ROLES, getNightOrder, WOLF_TEAM_ROLES, isWolfRole };
