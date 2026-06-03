import { useState } from 'react';
import RoleIcon from './RoleIcon';
import Icon from './Icon';

const ROLES = [
  // ─── Base ───
  {
    id: 'doppelganger', name: 'Doppelgänger', nameVi: 'Hóa Thân', emoji: '🎭',
    team: 'village', teamLabel: 'Phe ???', nightOrder: 0, expansion: 'base',
    lore: 'Hóa Thân là bóng ma giữa ban ngày — một thực thể có thể sao chép hoàn toàn danh tính của bất kỳ ai. Trong đêm, cô nhìn vào bài của một người chơi khác và ngay lập tức trở thành vai đó, thừa hưởng mọi khả năng và phe phái. Không ai biết cô là bản gốc hay bản sao. Cô có thể là Tiên Tri thứ hai, Ma Sói thứ ba, hoặc thậm chí là Thợ Thuộc Da. Hóa Thân nhắc nhở chúng ta rằng trong ngôi làng này, không gì là như vẻ bề ngoài.',
    nightAction: 'Thức dậy ĐẦU TIÊN. Xem bài 1 người và trở thành vai đó ngay lập tức.',
    winCondition: 'Thắng theo phe của vai mà bạn sao chép. Nếu copy Sói → bạn là Sói. Copy Tanner → bạn là Tanner.',
    tips: 'Bạn hành động như vai đã sao chép. Hãy nhớ vai gốc là Hóa Thân — nếu bài bị đổi, kết quả cuối game dựa trên bài hiện tại.',
    nightScript: '"Hóa Thân, hãy mở mắt. Xem bài của 1 người chơi." — Hóa Thân trở thành vai đó. Nếu vai có hành động đêm, thực hiện ngay. "Hóa Thân, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy ĐẦU TIÊN (trước tất cả). Xem bài 1 người → trở thành vai đó.\n\n📋 Tùy vai copy, bạn sẽ:\n• Seer, Robber, Troublemaker, Drunk, Sentinel, Village Idiot, Apprentice Seer, PI, Witch, Alpha Wolf, Mystic Wolf → Thực hiện hành động của vai đó NGAY LẬP TỨC\n• Werewolf, Minion, Mason → Tham gia phase của vai đó SAU (thấy đồng bọn)\n• Insomniac → Xem bài cuối đêm (sau Insomniac thường)\n• Revealer → Lật bài cuối đêm (sau Revealer thường)\n• Villager, Hunter, Tanner, Bodyguard, Dream Wolf → Không làm gì thêm\n\n⚠️ Bạn thuộc PHE của vai mới! Copy Sói = bạn là Sói!\nBan ngày: Hành xử theo vai đã copy.\nMục tiêu: Thắng theo phe của vai bạn đã trở thành.',
  },
  {
    id: 'werewolf', name: 'Werewolf', nameVi: 'Ma Sói', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 2, expansion: 'base',
    lore: 'Từ bao đời nay, Ma Sói đã ẩn mình giữa ngôi làng dưới lớp vỏ con người hiền lành. Ban ngày, chúng cười nói, chia sẻ bữa ăn với hàng xóm. Nhưng khi màn đêm buông xuống, bản năng hoang dã trỗi dậy — đôi mắt phát sáng trong bóng tối, tìm kiếm con mồi tiếp theo. Không ai biết Ma Sói thật sự là ai, cho đến khi quá muộn. Sức mạnh lớn nhất của chúng không nằm ở nanh vuốt, mà ở khả năng khiến mọi người tin tưởng — rồi phản bội niềm tin ấy.',
    nightAction: 'Mở mắt và nhìn đồng bọn Sói. Nếu là Sói đơn độc, được xem 1 bài ở giữa.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Hãy tỏ ra vô tội và đổ lỗi cho người khác. Nếu là Sói đơn, dùng thông tin bài giữa để tạo alibi.',
    nightScript: '"Ma Sói, hãy mở mắt và nhìn nhau." — Các Sói xác nhận đồng bọn. Nếu chỉ có 1 Sói, được chọn xem 1 bài ở giữa. "Ma Sói, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Mở mắt cùng các Sói khác (nếu có). Nếu bạn là Sói duy nhất, bạn được xem 1 bài ở giữa bàn.\nBan ngày: Phủ nhận mình là Sói, đổ tội cho người khác. Dùng thông tin từ đêm để tạo câu chuyện che đậy.\nMục tiêu: Sống sót — không để phe Dân vote loại bất kỳ Sói nào.',
  },
  {
    id: 'minion', name: 'Minion', nameVi: 'Tay Sai', emoji: '🦹',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 3, expansion: 'base',
    lore: 'Tay Sai không phải Ma Sói — hắn là con người, với đầy đủ trí nhớ và ý thức. Nhưng hắn đã chọn phục vụ bóng tối. Có kẻ nói hắn bị dụ dỗ bởi lời hứa quyền lực, có kẻ bảo hắn đã quá sợ hãi mà quỳ gối trước nanh sói. Dù lý do là gì, Tay Sai sẵn sàng chết thay cho chủ nhân. Hắn biết mặt từng con Sói, nhưng chúng không hề biết hắn tồn tại — một kẻ tận tụy đến mức vô hình.',
    nightAction: 'Mở mắt và biết ai là Sói. Nhưng Sói không biết bạn là Tay Sai.',
    winCondition: 'Thắng cùng phe Sói. Nếu bạn bị loại thay Sói, phe Sói vẫn thắng.',
    tips: 'Hãy thu hút sự nghi ngờ về phía mình để bảo vệ Sói. Có thể nhận mình là Sói giả.',
    nightScript: '"Tay Sai, hãy mở mắt. Ma Sói, hãy giơ ngón tay cái lên." — Tay Sai thấy ai là Sói, nhưng Sói không biết ai là Tay Sai. "Ma Sói, hãy hạ tay. Tay Sai, hãy nhắm mắt."',
    howToPlay: 'Ban đêm: Mở mắt và thấy ai là Sói. Sói KHÔNG biết bạn là Tay Sai.\nBan ngày: Bảo vệ Sói bằng cách đánh lạc hướng. Có thể tự nhận là vai khác hoặc thậm chí nhận là Sói để hút vote thay cho Sói thật.\nMục tiêu: Phe Sói thắng = bạn thắng. Kể cả nếu BẠN bị loại, miễn là Sói không bị loại.',
  },
  {
    id: 'mason', name: 'Mason', nameVi: 'Sinh Đôi', emoji: '🤝',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 4, expansion: 'base',
    lore: 'Hội Sinh Đôi là một nhóm bí mật có từ trước khi Ma Sói xuất hiện. Họ thề trung thành với nhau bằng một nghi thức cổ xưa — siết tay trong bóng tối và không bao giờ phản bội đồng đội. Trong đêm, họ mở mắt nhìn nhau, xác nhận rằng liên minh vẫn vững. Đó là thứ quý giá nhất trong ngôi làng đầy nghi kỵ: sự tin tưởng tuyệt đối. Khi mọi người đều có thể là Sói, những người Sinh Đôi biết chắc một điều — đồng đội mình là con người.',
    nightAction: 'Mở mắt và nhìn nhau. Biết chắc ai cùng phe Dân.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Bạn biết chắc đồng đội — hãy tin tưởng nhau và phối hợp tìm Sói. Nếu chỉ có 1 Mason, bài còn lại ở giữa.',
    nightScript: '"Sinh Đôi, hãy mở mắt và nhìn nhau." — Các Mason xác nhận đồng đội. "Sinh Đôi, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Mở mắt và thấy ai cũng là Mason. Nếu bạn là Mason duy nhất, bài Mason còn lại nằm ở giữa bàn.\nBan ngày: Bạn biết chắc đồng đội là Dân — hãy phối hợp cùng nhau phân tích và tìm Sói.\nMục tiêu: Dùng thông tin đáng tin cậy từ đồng đội để loại Sói.',
  },
  {
    id: 'seer', name: 'Seer', nameVi: 'Tiên Tri', emoji: '🔮',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 5, expansion: 'base',
    lore: 'Tiên Tri mang trong mình khả năng nhìn thấu bản chất con người — một món quà, nhưng cũng là lời nguyền. Mỗi đêm, bà lặng lẽ chạm vào tấm thẻ bài và sự thật hiện lên trước mắt. Bà biết ai là Sói, ai là Dân, ai đang nói dối. Nhưng biết sự thật và khiến người khác tin sự thật là hai chuyện khác nhau. Ma Sói biết rõ mối nguy từ Tiên Tri — chúng sẵn sàng giả danh bà để gieo rắc nghi ngờ và khiến dân làng tự tay hủy diệt vũ khí mạnh nhất của mình.',
    nightAction: 'Chọn xem bài của 1 người chơi khác, HOẶC xem 2 bài ở giữa.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Chia sẻ thông tin bạn biết nhưng cẩn thận — Sói có thể giả danh Tiên Tri.',
    nightScript: '"Tiên Tri, hãy mở mắt. Bạn có thể xem bài của 1 người chơi HOẶC 2 bài ở giữa." — Tiên Tri chỉ vào lựa chọn. "Tiên Tri, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 trong 2:\n• Xem bài của 1 người chơi khác → biết chính xác vai của họ\n• Xem 2 bài ở giữa → biết vai nào không ai giữ\nBan ngày: Chia sẻ thông tin bạn biết. Nhưng cẩn thận — Sói có thể giả danh Tiên Tri!\nMục tiêu: Dùng thông tin để chỉ ra Sói cho phe Dân.',
  },
  {
    id: 'robber', name: 'Robber', nameVi: 'Kẻ Cướp', emoji: '🦝',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 6, expansion: 'base',
    lore: 'Kẻ Cướp không hẳn là người xấu — hắn chỉ... linh hoạt về mặt đạo đức. Trong đêm, hắn lẻn đến bên một người đang ngủ, đổi số phận của mình lấy số phận của họ. Sáng mai, hắn thức dậy với một danh tính hoàn toàn mới. Có lần hắn lấy được tấm khiên của Dân, lần khác hắn lại vô tình trở thành chính con Sói mà hắn muốn tránh xa. Kẻ Cướp luôn là kẻ biết rõ mình là ai nhất — vấn đề là hắn không biết mình SẼ trở thành ai.',
    nightAction: 'Đổi bài của bạn với bài của 1 người khác, sau đó xem bài mới của mình.',
    winCondition: 'Bạn thuộc phe của bài MỚI. Nếu lấy được bài Sói, bạn là Sói.',
    tips: 'Nếu lấy được vai tốt, hãy khai báo. Nếu lấy Sói... hãy im lặng và đánh lạc hướng.',
    nightScript: '"Kẻ Cướp, hãy mở mắt. Đổi bài của bạn với bài của 1 người khác và xem bài mới." — Kẻ Cướp chọn 1 người để đổi bài. "Kẻ Cướp, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 người chơi → đổi bài với họ → xem bài MỚI của bạn.\n⚠️ QUAN TRỌNG: Sau khi đổi, bạn thuộc phe của bài mới! Nếu lấy được Sói, bạn giờ LÀ Sói.\nBan ngày: Nếu lấy vai tốt → khai báo để giúp phe Dân. Nếu lấy Sói → giữ bí mật!\nMục tiêu: Thắng theo phe của bài MỚI.',
  },
  {
    id: 'troublemaker', name: 'Troublemaker', nameVi: 'Kẻ Gây Rối', emoji: '😈',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 7, expansion: 'base',
    lore: 'Kẻ Gây Rối không bao giờ ngồi yên. Trong khi cả làng chìm trong giấc ngủ, cô lẻn đi và hoán đổi bài của hai người — biến Sói thành Dân, biến Dân thành Sói, mà không ai hay biết. Cô không làm điều này vì ác ý, mà vì tin rằng sự hỗn loạn sẽ phơi bày sự thật. Khi ban ngày đến và mọi người tranh cãi, chính những mâu thuẫn cô tạo ra sẽ khiến kẻ nói dối lộ mặt. Trong thế giới của Kẻ Gây Rối, sự thật chỉ xuất hiện khi trật tự bị phá vỡ.',
    nightAction: 'Hoán đổi bài của 2 người khác (không xem bài).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Khai báo bạn đã đổi ai. Điều này giúp xác định ai đang nắm bài gì.',
    nightScript: '"Kẻ Gây Rối, hãy mở mắt. Hoán đổi bài của 2 người chơi khác." — Kẻ Gây Rối chỉ vào 2 người để đổi bài. "Kẻ Gây Rối, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 2 người chơi khác → hoán đổi bài của họ. Bạn KHÔNG được xem bài.\nBan ngày: Khai báo bạn đã đổi ai — thông tin cực kỳ quan trọng! Nếu Sói bị đổi bài, người nhận bài Sói giờ là Sói mới.\nMục tiêu: Gây rối để lộ ra Sói, hoặc tạo thông tin giúp phe Dân suy luận.',
  },
  {
    id: 'drunk', name: 'Drunk', nameVi: 'Kẻ Say', emoji: '🍺',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 8, expansion: 'base',
    lore: 'Kẻ Say đã uống quá nhiều rượu tại quán rượu làng đêm qua. Trong cơn say, hắn loạng choạng bước tới bàn bài ở giữa và vô tình đổi bài của mình với một lá bài bí ẩn. Sáng hôm sau, hắn tỉnh dậy với cơn đau đầu khủng khiếp và không nhớ gì về đêm qua — kể cả việc mình bây giờ là ai. Hắn có thể đã trở thành Sói, Tiên Tri, hoặc bất kỳ ai, nhưng hắn sẽ không bao giờ biết cho đến khi trận vote kết thúc.',
    nightAction: 'Đổi bài của bạn với 1 bài ở giữa (không được xem bài mới).',
    winCondition: 'Bạn thuộc phe của bài MỚI, nhưng bạn không biết đó là bài gì.',
    tips: 'Bạn không biết vai mới — hãy lắng nghe và suy luận từ thông tin người khác.',
    nightScript: '"Kẻ Say, hãy mở mắt. Đổi bài của bạn với 1 bài ở giữa." — Kẻ Say chọn 1 bài ở giữa. "Kẻ Say, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 bài ở giữa bàn → đổi với bài của bạn. Bạn KHÔNG được xem bài mới.\nBan ngày: Bạn không biết mình là ai! Hãy lắng nghe người khác và suy luận.\n⚠️ Nếu bài ở giữa là Sói, bạn giờ LÀ Sói mà không biết!\nMục tiêu: Thắng theo phe của bài mới (dù bạn không biết đó là gì).',
  },
  {
    id: 'insomniac', name: 'Insomniac', nameVi: 'Người Mất Ngủ', emoji: '👁️',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 9, expansion: 'base',
    lore: 'Người Mất Ngủ chưa từng có một đêm yên giấc kể từ khi Ma Sói xuất hiện. Bà nằm trên giường, mắt mở trừng trừng, lắng nghe từng tiếng bước chân trong bóng tối. Chính vì không thể ngủ, bà là người cuối cùng kiểm tra lại bài của mình trước bình minh — và nhờ đó, bà biết liệu có ai đã lén lút thay đổi số phận của mình trong đêm. Người Mất Ngủ có thể mệt mỏi, nhưng bà không bao giờ bị bất ngờ.',
    nightAction: 'Thức dậy cuối cùng và xem bài hiện tại của mình (sau khi có thể bị đổi).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu bài bạn bị đổi, ai đó đã lấy vai cũ của bạn — hãy tìm ra ai.',
    nightScript: '"Người Mất Ngủ, hãy mở mắt và xem bài hiện tại của mình." — Người Mất Ngủ xem bài mình có bị đổi không. "Người Mất Ngủ, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy CUỐI CÙNG → xem bài hiện tại. Nếu bài bị đổi, bạn sẽ thấy vai mới.\nBan ngày: Nếu bài không đổi → xác nhận vai ban đầu. Nếu bài bị đổi → tìm ra ai đã đổi (Kẻ Cướp hoặc Kẻ Gây Rối).\nMục tiêu: Dùng thông tin để giúp phe Dân.',
  },
  {
    id: 'hunter', name: 'Hunter', nameVi: 'Thợ Săn', emoji: '🏹',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'base',
    lore: 'Thợ Săn đã giết Ma Sói đầu tiên của mình khi mới mười sáu tuổi, với một phát bắn duy nhất giữa đêm trăng rằm. Từ đó, ông mang theo cây nỏ bên mình mọi lúc, ngay cả khi ngủ. Ông không có khả năng siêu nhiên, nhưng có một bản năng sắc bén và phản xạ tuyệt vời. Nếu dân làng treo cổ ông vì nhầm lẫn, mũi tên cuối cùng của ông sẽ bay — nhằm vào người mà ông tin là Sói. Một phát bắn cuối cùng, một cơ hội cuối cùng để công lý được thực thi.',
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng cùng phe Dân. Nếu bạn bị loại, người bạn vote cũng bị loại theo.',
    tips: 'Hãy vote cẩn thận! Nếu bạn bị loại, vote của bạn sẽ kéo theo 1 người nữa.',
    nightScript: 'Thợ Săn không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\nBan ngày: Thảo luận bình thường.\n⚠️ KHẢ NĂNG ĐẶC BIỆT: Nếu bạn bị vote loại, người mà BẠN vote cũng bị loại theo!\nMục tiêu: Vote đúng Sói — đặc biệt quan trọng vì vote của bạn có thể kéo thêm 1 người.',
  },
  {
    id: 'tanner', name: 'Tanner', nameVi: 'Thợ Thuộc Da', emoji: '💀',
    team: 'tanner', teamLabel: 'Phe Riêng', nightOrder: null, expansion: 'base',
    lore: 'Thợ Thuộc Da đã sống một cuộc đời cô độc và khốn khổ. Công việc thuộc da nhơ nhớp khiến ông bị cả làng xa lánh, mùi hôi thối bám trên người không bao giờ rửa sạch. Dần dần, sự chán ghét cuộc sống ngấm sâu vào tâm hồn ông. Giờ đây, ông chỉ có một ước nguyện duy nhất: được chết. Nhưng không phải cái chết tầm thường — ông muốn bị dân làng kết tội, muốn đứng trên bục xử án và nhìn thấy nỗi sợ trong mắt họ khi họ nhận ra mình vừa mắc sai lầm khủng khiếp nhất.',
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng nếu bạn bị loại. Phe Sói và Dân đều thua nếu Tanner thắng.',
    tips: 'Hành xử đáng ngờ vừa đủ để bị vote, nhưng đừng lộ liễu quá.',
    nightScript: 'Thợ Thuộc Da không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\nBan ngày: Mục tiêu là LÀM CHO MÌNH BỊ VOTE LOẠI!\n• Hành xử đáng ngờ vừa đủ — giả vờ che giấu gì đó\n• Đừng quá lộ liễu (mọi người sẽ nghi Tanner)\n• Giả Sói một cách "vụng về" là chiến thuật hay\nMục tiêu: Bạn thắng khi BỊ LOẠI. Cả Sói lẫn Dân đều thua!',
  },
  {
    id: 'villager', name: 'Villager', nameVi: 'Dân Làng', emoji: '👨‍🌾',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'base',
    lore: 'Dân Làng là xương sống của ngôi làng — những nông dân, thợ rèn, thợ may bình thường sống cuộc đời giản dị. Họ không có phép thuật, không có vũ khí đặc biệt, chỉ có đôi tai biết lắng nghe và trí óc biết suy xét. Trong đêm đầy hiểm nguy, họ ngủ yên không hay biết gì. Nhưng khi bình minh lên, chính những con người bình thường này mới là lực lượng quyết định — bằng lá phiếu và bằng niềm tin, họ phải tìm ra kẻ giả dối giữa những người thân quen.',
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
    lore: 'Lính Canh là người đầu tiên thức dậy mỗi đêm, khi cả làng còn chìm trong giấc ngủ. Với tấm khiên cổ xưa được truyền qua nhiều thế hệ, ông đặt nó trước cửa nhà một người cần được bảo vệ. Tấm khiên mang phép thuật phòng thủ — không ai có thể đụng vào bài của người được bảo vệ, dù là Sói, Kẻ Cướp, hay Kẻ Gây Rối. Lính Canh hành động trước tất cả, và quyết định của ông có thể thay đổi cục diện cả trận đấu.',
    nightAction: 'Đặt khiên bảo vệ 1 người chơi. Người đó không thể bị xem hoặc đổi bài trong đêm.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Hãy bảo vệ người mà bạn nghĩ là vai quan trọng (Tiên Tri, Người Mất Ngủ...).',
    nightScript: '"Lính Canh, hãy mở mắt. Chọn 1 người để đặt khiên bảo vệ." — Lính Canh chỉ vào 1 người. Người đó không thể bị xem hoặc đổi bài. "Lính Canh, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy ĐẦU TIÊN. Chọn 1 người chơi khác để đặt khiên.\n🛡️ Khiên ngăn MỌI hành động đêm lên người đó: xem bài, đổi bài, lật bài.\nBan ngày: Khai báo bạn đã bảo vệ ai — thông tin này rất hữu ích cho phe Dân.\nMục tiêu: Bảo vệ vai quan trọng khỏi bị Sói hoặc vai khác can thiệp.',
  },
  {
    id: 'alphawolf', name: 'Alpha Wolf', nameVi: 'Sói Đầu Đàn', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 2.1, expansion: 'daybreak',
    lore: 'Sói Đầu Đàn là con sói lớn nhất, mạnh nhất và xảo quyệt nhất trong bầy. Hắn không chỉ săn mồi — hắn tạo ra đồng bọn mới. Bằng cú cắn trong đêm, hắn biến một người Dân vô tội thành Ma Sói, mở rộng bầy đàn mà nạn nhân không hề hay biết. Sáng hôm sau, kẻ bị cắn vẫn nghĩ mình là Dân, nhưng bài của họ đã thay đổi. Sói Đầu Đàn là nỗi khiếp sợ lớn nhất của ngôi làng — không phải vì sức mạnh, mà vì hắn biến kẻ thù thành đồng minh.',
    nightAction: 'Thức dậy cùng Sói. Sau đó đổi 1 bài ở giữa với bài của 1 người khác.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Đổi bài cho người được phe Dân tin tưởng nhất — biến họ thành Sói.',
    nightScript: '"Sói Đầu Đàn, hãy mở mắt. Chọn 1 người để đổi bài giữa với bài của họ." — Sói Đầu Đàn đánh tráo bài. "Sói Đầu Đàn, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Trước tiên thức dậy cùng tất cả Sói. Sau đó CÓ THÊM lượt riêng:\n• Đổi 1 bài ở giữa bàn với bài của 1 người chơi khác\n• Người đó giờ có bài ở giữa (có thể là Sói!) mà không biết\nBan ngày: Bạn biết ai vừa bị đổi bài — dùng thông tin này có lợi cho phe Sói.\nMục tiêu: Tạo thêm Sói hoặc gây rối cho phe Dân.',
  },
  {
    id: 'mysticwolf', name: 'Mystic Wolf', nameVi: 'Sói Thần Bí', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: 2.2, expansion: 'daybreak',
    lore: 'Sói Thần Bí sở hữu đôi mắt có thể nhìn xuyên thấu tâm hồn con người. Không giống những con sói khác chỉ biết dùng nanh vuốt, con sói này dùng trí tuệ siêu nhiên. Trong đêm, nó lặng lẽ ghé đến bên một người và đọc được bản chất thật sự của họ — Tiên Tri, Thợ Săn, hay Dân Làng. Thông tin này trở thành vũ khí lợi hại nhất của phe Sói vào ban ngày, khi chúng biết chính xác ai cần bị loại bỏ trước.',
    nightAction: 'Thức dậy cùng Sói. Sau đó được xem bài của 1 người chơi.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Xem bài ai nguy hiểm nhất (Tiên Tri?) để chuẩn bị đối phó ban ngày.',
    nightScript: '"Sói Thần Bí, hãy mở mắt. Chọn 1 người để xem bài." — Sói Thần Bí xem bài. "Sói Thần Bí, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Trước tiên thức dậy cùng tất cả Sói. Sau đó CÓ THÊM lượt riêng:\n• Xem bài của 1 người chơi khác\n• Giống khả năng của Tiên Tri nhưng dành cho phe Sói!\nBan ngày: Dùng thông tin xem bài để biết ai nguy hiểm và cần đánh lạc hướng.\nMục tiêu: Thông tin là sức mạnh — biết vai đối thủ giúp phe Sói phòng thủ tốt hơn.',
  },
  {
    id: 'dreamwolf', name: 'Dream Wolf', nameVi: 'Sói Mộng Du', emoji: '🐺',
    team: 'werewolf', teamLabel: 'Phe Sói', nightOrder: null, expansion: 'daybreak',
    lore: 'Sói Mộng Du là một người dân bình thường ban ngày — và hắn cũng tin mình là người bình thường. Nhưng trong giấc mơ, nanh vuốt mọc ra, bản năng hoang dã trỗi dậy. Hắn ngủ qua cả giai đoạn đêm, không thức dậy cùng đồng bọn Sói, và các Sói khác cũng không biết hắn tồn tại. Hắn là con sói cô đơn nhất — chiến đấu cho phe Sói mà không biết đồng minh là ai, không biết kẻ thù ở đâu, chỉ biết rằng mình phải sống sót.',
    nightAction: 'Thuộc phe Sói nhưng KHÔNG thức dậy. Sói khác không biết bạn.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Bạn không biết ai là Sói và họ không biết bạn. Đóng vai Dân thuyết phục nhất!',
    nightScript: 'Sói Mộng Du không thức dậy ban đêm. Sói khác không biết bạn tồn tại.',
    howToPlay: 'Ban đêm: Không có hành động. Bạn KHÔNG thức dậy cùng các Sói khác.\n⚠️ Các Sói khác không biết bạn là Sói!\nBan ngày: Bạn không có thông tin gì — hãy đóng vai Dân thuyết phục.\n• Nếu bị Tiên Tri xem → họ sẽ thấy bạn là Sói\n• Bạn cần tìm cách sống sót mà không có đồng minh\nMục tiêu: Không để ai bị loại trong phe Sói (kể cả chính bạn).',
  },
  {
    id: 'apprenticeseer', name: 'Apprentice Seer', nameVi: 'Tiên Tri Học Việc', emoji: '🔮',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 4.5, expansion: 'daybreak',
    lore: 'Tiên Tri Học Việc là đệ tử trẻ tuổi của Tiên Tri, đang trong quá trình rèn luyện khả năng ngoại cảm. Năng lực của cô chưa đủ mạnh để nhìn thấu bài của người chơi, nhưng cô có thể cảm nhận được một lá bài nằm yên ở giữa bàn. Dù chỉ là một mảnh ghép nhỏ, thông tin ấy đôi khi là chìa khóa để giải mã toàn bộ bí ẩn. Tiên Tri Học Việc chứng minh rằng ngay cả khả năng khiêm tốn nhất cũng có thể cứu cả ngôi làng.',
    nightAction: 'Xem 1 bài ở giữa bàn.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Biết 1 bài ở giữa giúp loại trừ — vai đó không ai giữ!',
    nightScript: '"Tiên Tri Học Việc, hãy mở mắt. Xem 1 bài ở giữa." — Tiên Tri Học Việc chọn 1 bài. "Tiên Tri Học Việc, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 bài ở giữa bàn → xem vai của nó.\nBan ngày: Bạn biết 1 vai không ai giữ → dùng để loại trừ khi phân tích.\n• Nếu thấy Sói ở giữa → tốt! Ít Sói hơn trong game\n• Nếu thấy vai Dân ở giữa → ai nhận vai đó đang nói dối!\nMục tiêu: Dùng thông tin bài giữa để hỗ trợ phe Dân.',
  },
  {
    id: 'paranormalinvestigator', name: 'P.I.', nameVi: 'Thám Tử', emoji: '🕵️',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 5.5, expansion: 'daybreak',
    lore: 'Thám Tử là một nhà điều tra siêu nhiên, chuyên nghiên cứu những hiện tượng bí ẩn giữa ranh giới người và thú. Ông xem bài của người khác để tìm ra sự thật, nhưng có một rủi ro chết người: nếu ông nhìn vào mắt Ma Sói hoặc chạm vào bóng tối của Thợ Thuộc Da, tâm trí ông sẽ bị nhiễm. Ông trở thành chính thứ mà ông điều tra. Đây là nghề nguy hiểm nhất trong làng — nơi tìm kiếm sự thật có thể biến bạn thành kẻ thù.',
    nightAction: 'Xem bài tối đa 2 người. Nếu thấy Sói/Tanner → biến thành vai đó!',
    winCondition: 'Nếu thấy Sói → bạn là Sói. Thấy Tanner → bạn là Tanner. Còn lại → phe Dân.',
    tips: 'Rủi ro cao! Xem bài có thể biến bạn thành phe khác. Cân nhắc kỹ.',
    nightScript: '"Thám Tử, hãy mở mắt. Xem bài của 1 người." — Nếu không phải Sói/Tanner, được xem thêm 1 người nữa. Nếu thấy Sói hoặc Tanner, bạn trở thành vai đó! "Thám Tử, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Xem bài của 1 người chơi:\n• Nếu KHÔNG phải Sói/Tanner → được xem thêm 1 người nữa\n• Nếu thấy Sói → BẠN TRỞ THÀNH SÓI và dừng xem\n• Nếu thấy Tanner → BẠN TRỞ THÀNH TANNER và dừng xem\n⚠️ Đây là vai rủi ro nhất trong game!\nBan ngày: Hành xử theo phe MỚI nếu bị biến đổi.\nMục tiêu: Thắng theo phe hiện tại sau đêm.',
  },
  {
    id: 'witch', name: 'Witch', nameVi: 'Phù Thủy', emoji: '🧙',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 6.5, expansion: 'daybreak',
    lore: 'Phù Thủy sống một mình ở rìa làng, trong căn nhà nhỏ đầy lọ thuốc và bùa phép. Dân làng sợ bà, nhưng cũng cần bà. Mỗi đêm, bà pha thuốc và nhìn vào một lá bài ở giữa bàn, thấy rõ bản chất của nó. Rồi bà quyết định — để yên, hoặc dùng phép thuật hoán đổi lá bài ấy với bài của một người chơi. Một quyết định tưởng nhỏ nhưng có thể lật ngược thế cờ: biến Dân thành Sói, hoặc tước đi sức mạnh của kẻ thù.',
    nightAction: 'Xem 1 bài ở giữa, có thể đổi bài đó với bài của 1 người chơi.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu thấy bài Sói ở giữa, đổi cho người đáng ngờ để xác nhận hoặc gây rối.',
    nightScript: '"Phù Thủy, hãy mở mắt. Xem 1 bài ở giữa." — Phù Thủy xem bài. "Bạn có muốn đổi bài này với bài của 1 người chơi không?" — Nếu có, chỉ vào người đó. "Phù Thủy, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: 2 bước:\n1️⃣ Xem 1 bài ở giữa bàn\n2️⃣ Có thể đổi bài đó với bài của 1 người chơi (hoặc bỏ qua)\nBan ngày: Nếu đổi bài → bạn biết người đó giờ có bài gì.\n• Đổi bài Sói cho ai đó = biến họ thành Sói!\n• Đổi bài tốt cho đồng minh = giúp phe Dân\nMục tiêu: Dùng khả năng đổi bài một cách chiến lược.',
  },
  {
    id: 'villageidiot', name: 'Village Idiot', nameVi: 'Ngốc Làng', emoji: '🤪',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 7.5, expansion: 'daybreak',
    lore: 'Ngốc Làng không thực sự ngốc — ông chỉ nhìn thế giới theo cách riêng của mình. Trong khi mọi người ngủ say, ông lặng lẽ xoay tất cả các lá bài sang một hướng, tạo ra một cơn hỗn loạn mà chính ông cũng không hiểu hết hậu quả. Nhưng đôi khi, chính sự hỗn loạn ấy lại phơi bày những bí mật mà trật tự không thể. Ngốc Làng dạy cho cả làng một bài học: đôi khi, phá vỡ mọi quy luật lại là cách tốt nhất để tìm ra sự thật.',
    nightAction: 'Xoay bài của tất cả người khác sang trái hoặc phải (không xem).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Khai báo hướng xoay giúp mọi người suy luận ai đang giữ bài gì.',
    nightScript: '"Ngốc Làng, hãy mở mắt. Bạn có thể xoay bài của tất cả người chơi khác sang trái hoặc phải." — Ngốc Làng chọn hướng. "Ngốc Làng, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 hướng (trái hoặc phải) → bài của TẤT CẢ người chơi khác dịch chuyển theo hướng đó.\n• Bài của bạn KHÔNG bị ảnh hưởng\n• Người bị Lính Canh bảo vệ cũng không bị ảnh hưởng\nBan ngày: Khai báo hướng xoay để mọi người biết bài đã dịch chuyển.\nMục tiêu: Tạo thêm thông tin cho phe Dân phân tích.',
  },
  {
    id: 'revealer', name: 'Revealer', nameVi: 'Người Lật Bài', emoji: '🔦',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 9.5, expansion: 'daybreak',
    lore: 'Người Lật Bài tin rằng sự thật phải được phơi bày dưới ánh sáng. Với ngọn đèn dầu cổ, ông lật bài của một người ngủ say. Nếu lá bài cho thấy họ là Dân vô tội, ông để ngỏ cho cả làng thấy vào sáng mai — xóa bỏ mọi nghi ngờ. Nhưng nếu ông lật phải bài của Sói hoặc Thợ Thuộc Da, ông vội vàng úp lại và giữ bí mật cho riêng mình. Người Lật Bài biết rằng một số sự thật cần được chia sẻ, và một số khác cần được giữ kín cho đúng thời điểm.',
    nightAction: 'Lật bài 1 người. Nếu không phải Sói/Tanner → công khai cho tất cả!',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu lật được Dân → tất cả biết → thu hẹp nghi phạm Sói.',
    nightScript: '"Người Lật Bài, hãy mở mắt. Lật bài của 1 người." — Nếu không phải Sói/Tanner, bài được công khai. "Người Lật Bài, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Chọn 1 người chơi → lật bài của họ:\n• Nếu KHÔNG phải Sói/Tanner → bài được CÔNG KHAI cho TẤT CẢ mọi người!\n• Nếu là Sói hoặc Tanner → không công khai (chỉ bạn biết)\nBan ngày: Nếu lật thành công, mọi người đã biết vai đó → dễ dàng loại trừ.\nMục tiêu: Công khai càng nhiều vai Dân càng tốt để thu hẹp nghi phạm.',
  },
  {
    id: 'prince', name: 'Prince', nameVi: 'Hoàng Tử', emoji: '👑',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'daybreak',
    lore: 'Hoàng Tử sinh ra trong dòng máu vương giả của vương quốc cổ xưa. Mẹ ngài là Hoàng Hậu, cha ngài là Đức Vua — và máu vương giả ấy chảy trong huyết quản ngài như một lời chúc phúc thiêng liêng. Dân làng kính trọng ngài đến mức không ai dám đặt tay lên người ngài, dù trong cơn cuồng nộ tập thể giữa đêm trăng máu. Họ có thể la hét, có thể buộc tội, có thể đưa ngài ra giữa quảng trường — nhưng đến phút cuối cùng, không một lá phiếu nào có đủ sức mạnh đưa Hoàng Tử tới giá treo cổ. Lời thề trung thành với vương triều mạnh hơn cả nỗi sợ hãi Ma Sói. Khi cả làng đồng lòng kết tội Hoàng Tử, họ phải đối mặt với sự thật phũ phàng: kẻ thật sự cần bị loại đang đứng cười nhạt ngay cạnh họ.\n\nNhưng có một thứ không tuân theo luật pháp của con người — đó là mũi tên báo thù của Thợ Săn đang hấp hối. Khi viên đạn cuối cùng bay đi, không có vương miện nào đủ rộng để che chắn nó.',
    nightAction: 'Không thức dậy ban đêm.',
    winCondition: 'Thắng cùng phe Dân. Bạn MIỄN DỊCH với vote — không thể bị treo cổ bởi lá phiếu.',
    tips: 'Khai báo sớm để Sói biết đừng vote bạn. Hấp thụ phiếu để cứu Tiên Tri/Mason/P.I. Cẩn thận Thợ Săn — họ có thể bắn bạn nếu bị loại.',
    nightScript: 'Hoàng Tử không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\n\nBan ngày: Bạn được vote bình thường, NHƯNG bạn miễn dịch với hậu quả:\n👑 Nếu bạn có nhiều phiếu nhất → bạn KHÔNG bị loại\n👑 Người có phiếu cao thứ 2 (≥2 phiếu) sẽ bị treo cổ thay\n👑 Nếu không có ai khác ≥2 phiếu → không ai chết\n\n⚠️ NGOẠI LỆ QUAN TRỌNG:\n• Thợ Săn vẫn có thể BẮN bạn — nếu Hunter bị loại và chỉ bạn, bạn vẫn chết\n• Nếu bài bạn bị Robber/Witch/Troublemaker đổi → KHÔNG còn miễn dịch (vai hiện tại quyết định)\n• Cảm quan thường: nếu bạn không còn là Prince, lợi thế biến mất\n\n📋 CHIẾN THUẬT:\n1️⃣ KHAI BÁO SỚM: Lúc thảo luận, công khai "Tôi là Hoàng Tử" để Sói không lãng phí vote\n2️⃣ HÚT VOTE: Tự dụ dỗ Sói vote bạn → bảo vệ Tiên Tri/Mason vốn quan trọng hơn\n3️⃣ ĐE DỌA: Khẳng định khả năng miễn dịch để buộc Sói chuyển hướng\n4️⃣ NGHI THỢ SĂN: Đừng để Thợ Săn vote bạn — họ có thể "vô tình" chết và bắn bạn\n\nMục tiêu: Dùng địa vị bất tử để bảo vệ phe Dân và làm khiên hấp dẫn vote Sói.',
  },
  {
    id: 'cursed', name: 'Cursed', nameVi: 'Bị Nguyền', emoji: '🩸',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'daybreak',
    lore: 'Người Bị Nguyền mang trên mình dấu ấn cổ xưa — một biểu tượng huyết hồng ai chưa từng thấy. Truyền thuyết kể rằng tổ tiên của họ đã phạm tội phản bội một Sói Đầu Đàn vào đêm trăng tròn, và lời nguyền truyền qua bao thế hệ. Họ sống như Dân làng bình thường, ăn bữa cùng dân, làm việc cùng dân, mơ cùng dân. Nhưng dòng máu của họ phản ứng với ý đồ ác độc của Ma Sói. Khi một con Sói chỉ tay vào họ với ý định loại bỏ, lời nguyền sống lại — máu họ sôi lên, bóng đen quanh họ dày đặc, và họ trở thành kẻ "lừa đảo": chết với hình hài Sói thay vì Dân.\n\nThật trớ trêu, đây lại là phước lành lớn nhất cho dân làng. Khi Sói vote và giết được Người Bị Nguyền, dân làng tưởng chừng thất bại — nhưng thực ra chính Sói đã tự đào hố chôn mình bằng cách kích hoạt lời nguyền.',
    nightAction: 'Không thức dậy ban đêm.',
    winCondition: 'Thắng cùng phe Dân. Nếu bị Sói vote VÀ bị loại → tính như Sói bị loại → Dân thắng.',
    tips: 'Khiêu khích Sói vote bạn (giả Tiên Tri, dọa Sói). Nếu Sói "cắn câu" → bạn chết nhưng Dân thắng.',
    nightScript: 'Bị Nguyền không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\n\nBan ngày: Bạn hoạt động như một Dân Làng bình thường:\n🩸 Có quyền vote như mọi người\n🩸 Có thể bị vote loại\n🩸 KHẢ NĂNG ĐẶC BIỆT: Khi kiểm tra thắng/thua, nếu BẠN BỊ LOẠI và có ÍT NHẤT 1 SÓI đã vote bạn → bạn được tính là "Sói bị loại" → Phe Dân THẮNG\n\n📋 CHIẾN THUẬT (Vai khó chơi nhưng cực kỳ chiến lược):\n1️⃣ HÒA NHẬP: Đóng vai Dân bình thường, đừng tự khai sớm\n2️⃣ KHIÊU KHÍCH: Giả Tiên Tri, đe dọa Sói, làm cho Sói nghĩ bạn nguy hiểm\n3️⃣ ĐÁNH BÀI: Khi nghi Sói thực sự, vote thẳng họ — họ sẽ trả đũa vote bạn\n4️⃣ HY SINH: Chấp nhận chết để Dân thắng — đây là giải pháp tối ưu cho bạn\n\n⚠️ NGUY HIỂM:\n• Nếu chỉ có Dân vote bạn (không có Sói) → bạn chết và KHÔNG có tác dụng → Dân thua\n• Nếu không có ai vote bạn → bạn sống nhưng cũng không kích hoạt được khả năng\n• Nếu bài bạn bị đổi → khả năng đặc biệt mất đi cho vai hiện tại\n\n💡 MẸO NÂNG CAO: Nhìn xem Sói thông minh sẽ TRÁNH vote bạn nếu họ nghi bạn là Cursed. Hãy tận dụng tâm lý này — bạn chính là vai có thể "kiểm tra" Sói.\n\nMục tiêu: Trở thành "trap" mà Sói không thể từ chối.',
  },
  {
    id: 'auraseer', name: 'Aura Seer', nameVi: 'Tiên Tri Hào Quang', emoji: '✨',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: 7.4, expansion: 'daybreak',
    lore: 'Tiên Tri Hào Quang sinh ra với đôi mắt khác thường — không nhìn được khuôn mặt, không đọc được bài, nhưng cảm nhận được "rung động" của ma thuật trong đêm. Mỗi khi ai đó cử động một lá bài, một vầng hào quang mờ ảo bao quanh họ, như sương khói tỏa lên từ những bàn tay vừa chạm vào ma lực ẩn. Cô không biết họ đã làm gì cụ thể — đã xem ai, đã đổi gì với ai — nhưng cô biết chắc một điều: AI ĐÃ TRÒN VAI và AI ĐÃ NGỦ YÊN.\n\nĐây là sức mạnh tinh tế nhất trong các Tiên Tri: không phải sự thật về vai, mà là sự thật về hành động. Trong làng đầy lời nói dối, biết được ai THỰC SỰ làm gì còn quý hơn cả việc biết họ LÀ ai. Vì Sói có thể giả vờ là Dân, nhưng không thể giả vờ "đã ngủ" khi rõ ràng họ đã rình mò trong đêm.',
    nightAction: 'Thức dậy sau Kẻ Quậy (thứ tự 7C, giữa Troublemaker và Village Idiot). Thấy ai ĐÃ xem hoặc đổi bài tính đến thời điểm đó.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'So sánh hào quang với khai báo. Ai khai "Villager" nhưng có hào quang → đáng nghi (có thể Sói giả Villager).',
    nightScript: '"Tiên Tri Hào Quang, hãy mở mắt. Những ai đã xem hoặc đổi bài đêm nay, hãy giơ ngón cái lên." — Tiên Tri Hào Quang quan sát và ghi nhớ. "Mọi người hạ ngón cái. Tiên Tri Hào Quang, hãy nhắm mắt lại."',
    howToPlay: 'Ban đêm: Thức dậy GIỮA ĐÊM (sau Kẻ Quậy ở thứ tự 7, trước Ngốc Làng ở 7.5).\n\n✨ Bạn nhận danh sách những người ĐÃ xem hoặc đổi bài đến thời điểm này.\n\n📋 CÓ HÀO QUANG (đã hành động trước Aura Seer):\n• 👁️ Vai XEM bài: Seer, Mystic Wolf, P.I., Witch (xem giữa), Apprentice Seer, Werewolf solo (peek center)\n• 🔄 Vai ĐỔI bài: Robber, Troublemaker, Alpha Wolf, Witch (đổi)\n• 🎭 Doppelganger: nếu copy vai active → có hào quang\n\n📋 KHÔNG CÓ HÀO QUANG:\n• Vai passive: Villager, Hunter, Tanner, Mason, Bodyguard, Prince, Cursed, Dream Wolf\n• Vai chỉ "nhìn đồng bọn": Werewolf (group), Minion (vì chỉ thấy Sói, không xem/đổi bài)\n• Vai chỉ "đặt khiên" (không xem/đổi card): Sentinel\n• Vai thức sau Aura Seer: Village Idiot, Drunk, Insomniac, Revealer\n\nBan ngày:\n1️⃣ SO SÁNH với khai báo của mọi người\n2️⃣ AI có hào quang + khai vai passive → ĐÁNG NGHI (có thể giả vờ)\n3️⃣ AI không có hào quang + khai Seer/Robber/PI/etc. → ĐÁNG NGHI (nói dối!)\n4️⃣ Đếm hào quang để biết bao nhiêu vai active đã thức\n\n📋 CHIẾN THUẬT:\n• Khai báo công khai danh sách → giúp Dân loại Sói\n• Hoặc giữ bí mật, chỉ chia sẻ cho người tin được → tránh bị Sói target\n• Đối chiếu Sói (nếu Sói có hành động — Mystic Wolf, Alpha Wolf, solo peek) vs khai báo của họ\n• Cẩn thận Doppelganger — họ có hào quang nhưng có thể đứng phe Sói\n\n⚠️ LƯU Ý: Bạn không biết HỌ LÀM GÌ, chỉ biết HỌ ĐÃ LÀM GÌ ĐÓ.\n\nMục tiêu: Phát hiện kẻ nói dối qua sự khác biệt giữa "hành động thực tế" và "khai báo".',
  },
  {
    id: 'bodyguard', name: 'Bodyguard', nameVi: 'Cận Vệ', emoji: '💪',
    team: 'village', teamLabel: 'Phe Dân', nightOrder: null, expansion: 'daybreak',
    lore: 'Cận Vệ từng là một chiến binh dày dạn trận mạc, giờ đây dành phần đời còn lại để bảo vệ người yếu đuối. Ông không thức dậy ban đêm — ông để giấc ngủ giữ cho cơ bắp tỉnh táo. Nhưng khi ban ngày đến và lá phiếu bay, ông sử dụng sức mạnh đặc biệt: thay vì kết tội, ông chọn bảo vệ. Người được Cận Vệ chỉ vào sẽ thoát khỏi bản án tử, bất kể bao nhiêu lá phiếu chống lại họ.',
    nightAction: 'Không thức dậy ban đêm. Khi vote: chỉ vào người muốn BẢO VỆ thay vì loại.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Đừng tiết lộ mình là Cận Vệ. Bảo vệ người bạn tin là Dân!',
    nightScript: 'Cận Vệ không thức dậy ban đêm.',
    howToPlay: 'Ban đêm: Không có hành động.\nBan ngày: Khi bỏ phiếu, thay vì chọn người để LOẠI, bạn chọn người để BẢO VỆ.\n💪 Người được bạn chỉ vào sẽ KHÔNG THỂ bị treo cổ!\n⚠️ Nếu người được bảo vệ bị vote nhiều nhất, người có phiếu cao thứ 2 (≥2 phiếu) sẽ bị loại thay.\nMục tiêu: Bảo vệ đúng người phe Dân. Đừng tiết lộ mình là Cận Vệ — Sói sẽ tránh vote người được bảo vệ.',
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
        <h2 className="text-moon-300 font-bold text-lg flex items-center gap-2"><Icon name="book" size={20} /> Thư viện nhân vật</h2>
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
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${tc.bg} hover:brightness-125 relative overflow-hidden`}
                >
                  <RoleIcon roleId={role.id} size={36} circular />
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

      {/* Night order */}
      <div className="mt-4 p-3 bg-white/5 rounded-xl">
        <p className="text-moon-400 text-xs font-semibold mb-2">🌙 Thứ tự thức dậy ban đêm</p>
        <div className="space-y-1">
          {roles
            .filter(r => r.nightOrder != null)
            .sort((a, b) => a.nightOrder - b.nightOrder)
            .map((r, i) => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="text-moon-400/60 text-[10px] font-mono w-4 text-right">{i + 1}</span>
                <RoleIcon roleId={r.id} size={16} circular />
                <span className="text-white/60 text-[11px]">{r.nameVi}</span>
                {i < roles.filter(r2 => r2.nightOrder != null && !r2.comingSoon).length - 1 && (
                  <span className="text-white/20 text-[10px] ml-auto">↓</span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Game flow guide */}
      <div className="mt-3 p-3 bg-moon-400/5 border border-moon-400/10 rounded-xl">
        <p className="text-moon-400 text-xs font-semibold mb-2">📖 Luồng chơi</p>
        <div className="space-y-2 text-[11px] leading-relaxed">
          <div>
            <p className="text-village-400 font-semibold">1. Nhận bài (15 giây)</p>
            <p className="text-white/40">Mỗi người nhận 1 bài ngẫu nhiên. 3 bài dư nằm ở giữa bàn. Lật bài để xem vai của bạn.</p>
          </div>
          <div>
            <p className="text-moon-400 font-semibold">2. Ban đêm</p>
            <p className="text-white/40">Các vai thức dậy theo thứ tự và thực hiện hành động. Kết thúc đêm, bài có thể đã bị hoán đổi — vai hiện tại có thể KHÁC vai ban đầu!</p>
          </div>
          <div>
            <p className="text-yellow-400 font-semibold">3. Thảo luận (5 phút)</p>
            <p className="text-white/40">Tất cả mở mắt, bàn luận. Khai báo vai, đối chất, tìm mâu thuẫn. Chưa được vote trong giai đoạn này.</p>
          </div>
          <div>
            <p className="text-wolf-400 font-semibold">4. Bỏ phiếu (1 phút)</p>
            <p className="text-white/40">Hết giờ thảo luận → chuyển sang vote. Chạm vào người bạn muốn loại. Ai bị vote nhiều nhất (≥2 phiếu) sẽ bị treo cổ.</p>
          </div>
          <div>
            <p className="text-purple-400 font-semibold">5. Kết quả</p>
            <p className="text-white/40">Lật bài toàn bộ. Phe Dân thắng nếu loại được Sói. Phe Sói thắng nếu không ai bị loại hoặc chỉ Dân bị loại. Tanner thắng nếu bị loại.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleDetail({ role, onBack }) {
  const tc = TEAM_COLOR[role.team];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <button onClick={onBack} className="text-moon-400 text-sm mb-3 hover:text-moon-300">← Quay lại</button>

      {/* Role card — full portrait */}
      <div className={`rounded-2xl border mb-4 ${tc.bg} overflow-hidden relative`}>
        <div className="flex flex-col items-center p-4">
          <div className="relative">
            <RoleIcon roleId={role.id} size={140} className="shadow-lg !rounded-xl" />
          </div>
          <div className="text-center mt-3">
            <h3 className="text-xl font-bold text-white">{role.nameVi}</h3>
            <span className="text-white/40 text-sm">{role.name}</span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.badge}`}>{role.teamLabel}</span>
              {role.nightOrder != null && <span className="text-white/30 text-[10px]">{role.nightOrder === 0 ? 'Đầu tiên' : `Đêm thứ ${role.nightOrder}`}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Lore / Backstory */}
      {role.lore && (
        <div className="mb-4 p-4 rounded-xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(196,168,107,0.06), rgba(255,255,255,0.02))',
            border: '1px solid rgba(196,168,107,0.12)',
          }}
        >
          <p className="text-moon-300/60 text-sm italic leading-relaxed">"{role.lore}"</p>
        </div>
      )}

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
      <svg width="16" height="16" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </button>
  );
}
