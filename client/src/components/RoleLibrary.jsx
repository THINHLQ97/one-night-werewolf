import { useState } from 'react';
import RoleIcon from './RoleIcon';

const ROLES = [
  // ─── Base ───
  {
    id: 'werewolf', name: 'Werewolf', nameVi: 'Ma Sói', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 2, expansion: 'base',
    nightAction: 'Mở mắt và nhìn đồng bọn Sói. Nếu là Sói đơn độc, được xem 1 bài ở giữa.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Hãy tỏ ra vô tội và đổ lỗi cho người khác. Nếu là Sói đơn, dùng thông tin bài giữa để tạo alibi.',
    nightScript: '"Ma Sói, hãy mở mắt và nhìn nhau." — Các Sói xác nhận đồng bọn. Nếu chỉ có 1 Sói, được chọn xem 1 bài ở giữa. "Ma Sói, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Mở mắt cùng các Sói khác (nếu có). Nếu bạn là Sói duy nhất, bạn được xem 1 bài ở giữa bàn.\nBan ngày: Phủ nhận mình là Sói, đổ tội cho người khác. Dùng thông tin từ đêm để tạo câu chuyện che đậy.\nMục tiêu: Sống sót — không để phe Dân vote loại bất kỳ Sói nào.',
  },
  {
    id: 'minion', name: 'Minion', nameVi: 'Tay Sai', emoji: '🦹',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 3, expansion: 'base',
    nightAction: 'Mở mắt và biết ai là Sói. Nhưng Sói không biết bạn là Tay Sai.',
    winCondition: 'Thắng cùng phe Sói. Nếu bạn bị loại thay Sói, phe Sói vẫn thắng.',
    tips: 'Hãy thu hút sự nghi ngờ về phía mình để bảo vệ Sói. Có thể nhận mình là Sói giả.',
    nightScript: '"Tay Sai, hãy mở mắt. Ma Sói, hãy giơ ngón tay cái lên." — Tay Sai thấy ai là Sói, nhưng Sói không biết ai là Tay Sai. "Ma Sói, hãy hạ tay. Tay Sai, hãy nhắm mắt."',
    howToPlay: 'Ban đêm: Mở mắt và thấy ai là Sói. Sói KHÔNG biết bạn là Tay Sai.\nBan ngày: Bảo vệ Sói bằng cách đánh lạc hướng. Có thể tự nhận là vai khác hoặc thậm chí nhận là Sói để hút vote thay cho Sói thật.\nMục tiêu: Phe Sói thắng = bạn thắng. Kể cả nếu BẠN bị loại, miễn là Sói không bị loại.',
  },
  {
    id: 'mason', name: 'Mason', nameVi: 'Sinh Đôi', emoji: '🤝',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 4, expansion: 'base',
    nightAction: 'Mở mắt và nhìn nhau. Biết chắc ai cùng phe Dân.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Bạn biết chắc đồng đội — hãy tin tưởng nhau và phối hợp tìm Sói. Nếu chỉ có 1 Mason, bài còn lại ở giữa.',
    nightScript: '"Sinh Đôi, hãy mở mắt và nhìn nhau." — Các Mason xác nhận đồng đội. "Sinh Đôi, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Mở mắt và thấy ai cũng là Mason. Nếu bạn là Mason duy nhất, bài Mason còn lại nằm ở giữa bàn.\nBan ngày: Bạn biết chắc đồng đội là Dân — hãy phối hợp cùng nhau phân tích và tìm Sói.\nMục tiêu: Dùng thông tin đáng tin cậy từ đồng đội để loại Sói.',
  },
  {
    id: 'seer', name: 'Seer', nameVi: 'Tiên Tri', emoji: '🔮',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 5, expansion: 'base',
    nightAction: 'Chọn xem bài của 1 người chơi khác, HOẶC xem 2 bài ở giữa.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Chia sẻ thông tin bạn biết nhưng cẩn thận — Sói có thể giả danh Tiên Tri.',
    nightScript: '"Tiên Tri, hãy mở mắt. Bạn có thể xem bài của 1 người chơi HOẶC 2 bài ở giữa." — Tiên Tri chỉ vào lựa chọn. "Tiên Tri, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 trong 2:\n• Xem bài của 1 người chơi khác → biết chính xác vai của họ\n• Xem 2 bài ở giữa → biết vai nào không ai giữ\nBan ngày: Chia sẻ thông tin bạn biết. Nhưng cẩn thận — Sói có thể giả danh Tiên Tri!\nMục tiêu: Dùng thông tin để chỉ ra Sói cho phe Dân.',
  },
  {
    id: 'robber', name: 'Robber', nameVi: 'Kẻ Cướp', emoji: '🦝',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 6, expansion: 'base',
    nightAction: 'Đổi bài của bạn với bài của 1 người khác, sau đó xem bài mới của mình.',
    winCondition: 'Bạn thuộc phe của bài MỚI. Nếu lấy được bài Sói, bạn là Sói.',
    tips: 'Nếu lấy được vai tốt, hãy khai báo. Nếu lấy Sói... hãy im lặng và đánh lạc hướng.',
    nightScript: '"Kẻ Cướp, hãy mở mắt. Đổi bài của bạn với bài của 1 người khác và xem bài mới." — Kẻ Cướp chọn 1 người để đổi bài. "Kẻ Cướp, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 người chơi → đổi bài với họ → xem bài MỚI của bạn.\n⚠️ QUAN TRỌNG: Sau khi đổi, bạn thuộc phe của bài mới! Nếu lấy được Sói, bạn giờ LÀ Sói.\nBan ngày: Nếu lấy vai tốt → khai báo để giúp phe Dân. Nếu lấy Sói → giữ bí mật!\nMục tiêu: Thắng theo phe của bài MỚI.',
  },
  {
    id: 'troublemaker', name: 'Troublemaker', nameVi: 'Kẻ Gây Rối', emoji: '😈',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 7, expansion: 'base',
    nightAction: 'Hoán đổi bài của 2 người khác (không xem bài).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Khai báo bạn đã đổi ai. Điều này giúp xác định ai đang nắm bài gì.',
    nightScript: '"Kẻ Gây Rối, hãy mở mắt. Hoán đổi bài của 2 người chơi khác." — Kẻ Gây Rối chỉ vào 2 người để đổi bài. "Kẻ Gây Rối, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 2 người chơi khác → hoán đổi bài của họ. Bạn KHÔNG được xem bài.\nBan ngày: Khai báo bạn đã đổi ai — thông tin cực kỳ quan trọng! Nếu Sói bị đổi bài, người nhận bài Sói giờ là Sói mới.\nMục tiêu: Gây rối để lộ ra Sói, hoặc tạo thông tin giúp phe Dân suy luận.',
  },
  {
    id: 'drunk', name: 'Drunk', nameVi: 'Kẻ Say', emoji: '🍺',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 8, expansion: 'base',
    nightAction: 'Đổi bài của bạn với 1 bài ở giữa (không được xem bài mới).',
    winCondition: 'Bạn thuộc phe của bài MỚI, nhưng bạn không biết đó là bài gì.',
    tips: 'Bạn không biết vai mới — hãy lắng nghe và suy luận từ thông tin người khác.',
    nightScript: '"Kẻ Say, hãy mở mắt. Đổi bài của bạn với 1 bài ở giữa." — Kẻ Say chọn 1 bài ở giữa. "Kẻ Say, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 bài ở giữa bàn → đổi với bài của bạn. Bạn KHÔNG được xem bài mới.\nBan ngày: Bạn không biết mình là ai! Hãy lắng nghe người khác và suy luận.\n⚠️ Nếu bài ở giữa là Sói, bạn giờ LÀ Sói mà không biết!\nMục tiêu: Thắng theo phe của bài mới (dù bạn không biết đó là gì).',
  },
  {
    id: 'insomniac', name: 'Insomniac', nameVi: 'Người Mất Ngủ', emoji: '👁️',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 9, expansion: 'base',
    nightAction: 'Thức dậy cuối cùng và xem bài hiện tại của mình (sau khi có thể bị đổi).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu bài bạn bị đổi, ai đó đã lấy vai cũ của bạn — hãy tìm ra ai.',
    nightScript: '"Người Mất Ngủ, hãy mở mắt và xem bài hiện tại của mình." — Người Mất Ngủ xem bài mình có bị đổi không. "Người Mất Ngủ, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy CUỐI CÙNG → xem bài hiện tại. Nếu bài bị đổi, bạn sẽ thấy vai mới.\nBan ngày: Nếu bài không đổi → xác nhận vai ban đầu. Nếu bài bị đổi → tìm ra ai đã đổi (Kẻ Cướp hoặc Kẻ Gây Rối).\nMục tiêu: Dùng thông tin để giúp phe Dân.',
  },
  {
    id: 'hunter', name: 'Hunter', nameVi: 'Thợ Săn', emoji: '🏹',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'base',
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng cùng phe Dân. Nếu bạn bị loại, người bạn vote cũng bị loại theo.',
    tips: 'Hãy vote cẩn thận! Nếu bạn bị loại, vote của bạn sẽ kéo theo 1 người nữa.',
    nightScript: 'Thợ Săn không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\nBan ngày: Thảo luận bình thường.\n⚠️ KHẢ NĂNG ĐẶC BIỆT: Nếu bạn bị vote loại, người mà BẠN vote cũng bị loại theo!\nMục tiêu: Vote đúng Sói — đặc biệt quan trọng vì vote của bạn có thể kéo thêm 1 người.',
  },
  {
    id: 'tanner', name: 'Tanner', nameVi: 'Thợ Thuộc Da', emoji: '💀',
    team: 'tanner', teamLabel: 'Phe Riêng', nightOrder: null, expansion: 'base',
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng nếu bạn bị loại. Phe Sói và Dân đều thua nếu Tanner thắng.',
    tips: 'Hành xử đáng ngờ vừa đủ để bị vote, nhưng đừng lộ liễu quá.',
    nightScript: 'Thợ Thuộc Da không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\nBan ngày: Mục tiêu là LÀM CHO MÌNH BỊ VOTE LOẠI!\n• Hành xử đáng ngờ vừa đủ — giả vờ che giấu gì đó\n• Đừng quá lộ liễu (mọi người sẽ nghi Tanner)\n• Giả Sói một cách "vụng về" là chiến thuật hay\nMục tiêu: Bạn thắng khi BỊ LOẠI. Cả Sói lẫn Dân đều thua!',
  },
  {
    id: 'villager', name: 'Villager', nameVi: 'Dân Làng', emoji: '👨‍🌾',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'base',
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Lắng nghe, phân tích và tìm mâu thuẫn trong lời khai của mọi người.',
    nightScript: 'Dân Làng không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\nBan ngày: Lắng nghe mọi người khai báo, phân tích mâu thuẫn.\n• Ai nói dối? Ai che giấu thông tin?\n• Đối chiếu lời khai của Tiên Tri, Kẻ Cướp, Kẻ Gây Rối\n• Đừng ngại hỏi thẳng\nMục tiêu: Tìm và vote loại Sói.',
  },
  // ─── Daybreak ───
  {
    id: 'sentinel', name: 'Sentinel', nameVi: 'Lính Canh', emoji: '🛡️',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 1, expansion: 'daybreak',
    nightAction: 'Đặt khiên bảo vệ 1 người chơi. Người đó không thể bị xem hoặc đổi bài trong đêm.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Hãy bảo vệ người mà bạn nghĩ là vai quan trọng (Tiên Tri, Người Mất Ngủ...).',
    nightScript: '"Lính Canh, hãy mở mắt. Chọn 1 người để đặt khiên bảo vệ." — Lính Canh chỉ vào 1 người. Người đó không thể bị xem hoặc đổi bài. "Lính Canh, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy ĐẦU TIÊN. Chọn 1 người chơi khác để đặt khiên.\n🛡️ Khiên ngăn MỌI hành động đêm lên người đó: xem bài, đổi bài, lật bài.\nBan ngày: Khai báo bạn đã bảo vệ ai — thông tin này rất hữu ích cho phe Dân.\nMục tiêu: Bảo vệ vai quan trọng khỏi bị Sói hoặc vai khác can thiệp.',
  },
  {
    id: 'alphawolf', name: 'Alpha Wolf', nameVi: 'Sói Đầu Đàn', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 2.1, expansion: 'daybreak',
    nightAction: 'Thức dậy cùng Sói. Sau đó đổi 1 bài ở giữa với bài của 1 người khác.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Đổi bài cho người được phe Dân tin tưởng nhất — biến họ thành Sói.',
    nightScript: '"Sói Đầu Đàn, hãy mở mắt. Chọn 1 người để đổi bài giữa với bài của họ." — Sói Đầu Đàn đánh tráo bài. "Sói Đầu Đàn, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Trước tiên thức dậy cùng tất cả Sói. Sau đó CÓ THÊM lượt riêng:\n• Đổi 1 bài ở giữa bàn với bài của 1 người chơi khác\n• Người đó giờ có bài ở giữa (có thể là Sói!) mà không biết\nBan ngày: Bạn biết ai vừa bị đổi bài — dùng thông tin này có lợi cho phe Sói.\nMục tiêu: Tạo thêm Sói hoặc gây rối cho phe Dân.',
  },
  {
    id: 'mysticwolf', name: 'Mystic Wolf', nameVi: 'Sói Thần Bí', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 2.2, expansion: 'daybreak',
    nightAction: 'Thức dậy cùng Sói. Sau đó được xem bài của 1 người chơi.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Xem bài ai nguy hiểm nhất (Tiên Tri?) để chuẩn bị đối phó ban ngày.',
    nightScript: '"Sói Thần Bí, hãy mở mắt. Chọn 1 người để xem bài." — Sói Thần Bí xem bài. "Sói Thần Bí, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Trước tiên thức dậy cùng tất cả Sói. Sau đó CÓ THÊM lượt riêng:\n• Xem bài của 1 người chơi khác\n• Giống khả năng của Tiên Tri nhưng dành cho phe Sói!\nBan ngày: Dùng thông tin xem bài để biết ai nguy hiểm và cần đánh lạc hướng.\nMục tiêu: Thông tin là sức mạnh — biết vai đối thủ giúp phe Sói phòng thủ tốt hơn.',
  },
  {
    id: 'dreamwolf', name: 'Dream Wolf', nameVi: 'Sói Mộng Du', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: null, expansion: 'daybreak',
    nightAction: 'Thuộc phe Sói nhưng KHÔNG thức dậy. Sói khác không biết bạn.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Bạn không biết ai là Sói và họ không biết bạn. Đóng vai Dân thuyết phục nhất!',
    nightScript: 'Sói Mộng Du không thức dậy ban đêm. Sói khác không biết bạn tồn tại.',
    howToPlay: 'Ban đêm: Không có hành động. Bạn KHÔNG thức dậy cùng các Sói khác.\n⚠️ Các Sói khác không biết bạn là Sói!\nBan ngày: Bạn không có thông tin gì — hãy đóng vai Dân thuyết phục.\n• Nếu bị Tiên Tri xem → họ sẽ thấy bạn là Sói\n• Bạn cần tìm cách sống sót mà không có đồng minh\nMục tiêu: Không để ai bị loại trong phe Sói (kể cả chính bạn).',
  },
  {
    id: 'apprenticeseer', name: 'Apprentice Seer', nameVi: 'Tiên Tri Học Việc', emoji: '🔮',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 4.5, expansion: 'daybreak',
    nightAction: 'Xem 1 bài ở giữa bàn.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Biết 1 bài ở giữa giúp loại trừ — vai đó không ai giữ!',
    nightScript: '"Tiên Tri Học Việc, hãy mở mắt. Xem 1 bài ở giữa." — Tiên Tri Học Việc chọn 1 bài. "Tiên Tri Học Việc, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 bài ở giữa bàn → xem vai của nó.\nBan ngày: Bạn biết 1 vai không ai giữ → dùng để loại trừ khi phân tích.\n• Nếu thấy Sói ở giữa → tốt! Ít Sói hơn trong game\n• Nếu thấy vai Dân ở giữa → ai nhận vai đó đang nói dối!\nMục tiêu: Dùng thông tin bài giữa để hỗ trợ phe Dân.',
  },
  {
    id: 'paranormalinvestigator', name: 'P.I.', nameVi: 'Thám Tử', emoji: '🕵️',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 5.5, expansion: 'daybreak',
    nightAction: 'Xem bài tối đa 2 người. Nếu thấy Sói/Tanner → biến thành vai đó!',
    winCondition: 'Nếu thấy Sói → bạn là Sói. Thấy Tanner → bạn là Tanner. Còn lại → phe Dân.',
    tips: 'Rủi ro cao! Xem bài có thể biến bạn thành phe khác. Cân nhắc kỹ.',
    nightScript: '"Thám Tử, hãy mở mắt. Xem bài của 1 người." — Nếu không phải Sói/Tanner, được xem thêm 1 người nữa. Nếu thấy Sói hoặc Tanner, bạn trở thành vai đó! "Thám Tử, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Xem bài của 1 người chơi:\n• Nếu KHÔNG phải Sói/Tanner → được xem thêm 1 người nữa\n• Nếu thấy Sói → BẠN TRỞ THÀNH SÓI và dừng xem\n• Nếu thấy Tanner → BẠN TRỞ THÀNH TANNER và dừng xem\n⚠️ Đây là vai rủi ro nhất trong game!\nBan ngày: Hành xử theo phe MỚI nếu bị biến đổi.\nMục tiêu: Thắng theo phe hiện tại sau đêm.',
  },
  {
    id: 'witch', name: 'Witch', nameVi: 'Phù Thủy', emoji: '🧙',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 6.5, expansion: 'daybreak',
    nightAction: 'Xem 1 bài ở giữa, có thể đổi bài đó với bài của 1 người chơi.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu thấy bài Sói ở giữa, đổi cho người đáng ngờ để xác nhận hoặc gây rối.',
    nightScript: '"Phù Thủy, hãy mở mắt. Xem 1 bài ở giữa." — Phù Thủy xem bài. "Bạn có muốn đổi bài này với bài của 1 người chơi không?" — Nếu có, chỉ vào người đó. "Phù Thủy, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: 2 bước:\n1️⃣ Xem 1 bài ở giữa bàn\n2️⃣ Có thể đổi bài đó với bài của 1 người chơi (hoặc bỏ qua)\nBan ngày: Nếu đổi bài → bạn biết người đó giờ có bài gì.\n• Đổi bài Sói cho ai đó = biến họ thành Sói!\n• Đổi bài tốt cho đồng minh = giúp phe Dân\nMục tiêu: Dùng khả năng đổi bài một cách chiến lược.',
  },
  {
    id: 'villageidiot', name: 'Village Idiot', nameVi: 'Ngốc Làng', emoji: '🤪',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 7.5, expansion: 'daybreak',
    nightAction: 'Xoay bài của tất cả người khác sang trái hoặc phải (không xem).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Khai báo hướng xoay giúp mọi người suy luận ai đang giữ bài gì.',
    nightScript: '"Ngốc Làng, hãy mở mắt. Bạn có thể xoay bài của tất cả người chơi khác sang trái hoặc phải." — Ngốc Làng chọn hướng. "Ngốc Làng, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 hướng (trái hoặc phải) → bài của TẤT CẢ người chơi khác dịch chuyển theo hướng đó.\n• Bài của bạn KHÔNG bị ảnh hưởng\n• Người bị Lính Canh bảo vệ cũng không bị ảnh hưởng\nBan ngày: Khai báo hướng xoay để mọi người biết bài đã dịch chuyển.\nMục tiêu: Tạo thêm thông tin cho phe Dân phân tích.',
  },
  {
    id: 'revealer', name: 'Revealer', nameVi: 'Người Lật Bài', emoji: '🔦',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 9.5, expansion: 'daybreak',
    nightAction: 'Lật bài 1 người. Nếu không phải Sói/Tanner → công khai cho tất cả!',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu lật được Dân → tất cả biết → thu hẹp nghi phạm Sói.',
    nightScript: '"Người Lật Bài, hãy mở mắt. Lật bài của 1 người." — Nếu không phải Sói/Tanner, bài được công khai. "Người Lật Bài, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 người chơi → lật bài của họ:\n• Nếu KHÔNG phải Sói/Tanner → bài được CÔNG KHAI cho TẤT CẢ mọi người!\n• Nếu là Sói hoặc Tanner → không công khai (chỉ bạn biết)\nBan ngày: Nếu lật thành công, mọi người đã biết vai đó → dễ dàng loại trừ.\nMục tiêu: Công khai càng nhiều vai Dân càng tốt để thu hẹp nghi phạm.',
  },
  {
    id: 'bodyguard', name: 'Bodyguard', nameVi: 'Vệ Sĩ', emoji: '💪',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 10, expansion: 'daybreak',
    nightAction: 'Chọn 1 người để bảo vệ. Nếu họ bị vote loại → được cứu!',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Bảo vệ người bạn tin là phe Dân. Nếu họ bị vote, họ sống sót!',
    nightScript: '"Vệ Sĩ, hãy mở mắt. Chọn 1 người để bảo vệ." — Vệ Sĩ chỉ vào 1 người. Nếu người đó bị vote loại, họ được cứu. "Vệ Sĩ, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy CUỐI CÙNG. Chọn 1 người chơi để bảo vệ.\n💪 Nếu người đó bị vote loại ban ngày → họ được CỨU SỐNG!\nBan ngày: Bạn không nên tiết lộ mình là Vệ Sĩ (Sói sẽ tránh vote người được bảo vệ).\nMục tiêu: Bảo vệ đúng người phe Dân khỏi bị vote nhầm.',
  },
];

const TEAM_COLOR = {
  werewolf: { bg: 'bg-wolf-500/20 border-wolf-500/40', text: 'text-wolf-400', badge: 'bg-wolf-500/30 text-wolf-300' },
  village: { bg: 'bg-village-400/20 border-village-400/40', text: 'text-village-400', badge: 'bg-village-400/30 text-village-300' },
  tanner: { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-400', badge: 'bg-purple-500/30 text-purple-300' },
};

export default function RoleLibrary({ isOpen, onClose, highlightRole = null }) {
  const [selectedRole, setSelectedRole] = useState(highlightRole);

  if (!isOpen) return null;

  const role = ROLES.find(r => r.id === selectedRole);

  return (
    <div className="fixed inset-0 bg-black/90 z-40 flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-moon-300 font-bold text-lg">📖 Thư viện nhân vật</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20">
          ✕
        </button>
      </div>

      {!role ? (
        <RoleList roles={ROLES} onSelect={setSelectedRole} />
      ) : (
        <RoleDetail role={role} onBack={() => setSelectedRole(null)} />
      )}
    </div>
  );
}

function RoleList({ roles, onSelect }) {
  const teams = [
    { key: 'village', label: '🏘️ Phe Dân' },
    { key: 'werewolf', label: '🐺 Phe Sói' },
    { key: 'tanner', label: '💀 Phe Riêng' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {teams.map(team => {
        const teamRoles = roles.filter(r => r.team === team.key);
        const tc = TEAM_COLOR[team.key];
        return (
          <div key={team.key} className="mb-4">
            <p className={`text-sm font-semibold mb-2 ${tc.text}`}>{team.label}</p>
            <div className="space-y-1.5">
              {teamRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => onSelect(role.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${tc.bg} hover:brightness-125`}
                >
                  <RoleIcon roleId={role.id} size={44} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{role.nameVi}</span>
                      <span className="text-white/30 text-xs">{role.name}</span>
                    </div>
                    <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{role.nightAction}</p>
                  </div>
                  <span className="text-white/20 text-sm">›</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-4 p-3 bg-white/5 rounded-xl">
        <p className="text-moon-400 text-xs font-semibold mb-1">🌙 Thứ tự ban đêm</p>
        <p className="text-white/40 text-[11px] leading-relaxed">
          {roles.filter(r => r.nightOrder).sort((a, b) => a.nightOrder - b.nightOrder).map(r => `${r.nightOrder}. ${r.nameVi}`).join(' → ')}
        </p>
      </div>
    </div>
  );
}

function RoleDetail({ role, onBack }) {
  const tc = TEAM_COLOR[role.team];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <button onClick={onBack} className="text-moon-400 text-sm mb-3 hover:text-moon-300">← Quay lại</button>

      {/* Role card */}
      <div className={`p-4 rounded-2xl border mb-4 ${tc.bg}`}>
        <div className="flex items-center gap-4 mb-3">
          <RoleIcon roleId={role.id} size={72} />
          <div>
            <h3 className="text-xl font-bold text-white">{role.nameVi}</h3>
            <span className="text-white/40 text-sm">{role.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.badge}`}>{role.teamLabel}</span>
              {role.nightOrder && <span className="text-white/30 text-[10px]">Đêm thứ {role.nightOrder}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Night script */}
      <Section icon="🌙" title="Kịch bản ban đêm" color="text-moon-400">
        <p className="text-white/60 text-sm italic leading-relaxed">{role.nightScript}</p>
      </Section>

      {/* How to play */}
      <Section icon="🎮" title="Cách chơi chi tiết" color="text-village-400">
        {role.howToPlay.split('\n').map((line, i) => (
          <p key={i} className={`text-sm leading-relaxed ${line.startsWith('⚠️') ? 'text-wolf-400 font-semibold' : 'text-white/60'}`}>{line}</p>
        ))}
      </Section>

      {/* Win condition */}
      <Section icon="🏆" title="Điều kiện thắng" color="text-yellow-400">
        <p className="text-white/70 text-sm font-medium">{role.winCondition}</p>
      </Section>

      {/* Tips */}
      <Section icon="💡" title="Mẹo chơi" color="text-purple-400">
        <p className="text-white/60 text-sm leading-relaxed">{role.tips}</p>
      </Section>
    </div>
  );
}

function Section({ icon, title, color, children }) {
  return (
    <div className="mb-4 p-3 bg-white/5 rounded-xl">
      <p className={`text-xs font-semibold mb-2 ${color}`}>{icon} {title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function RoleLibraryButton({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors ${className}`}
      title="Thư viện nhân vật"
    >
      📖
    </button>
  );
}
