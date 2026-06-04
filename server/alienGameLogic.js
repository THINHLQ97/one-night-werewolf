const { ALIEN_ROLES, getAlienNightOrder, ALIEN_AFFILIATION, isAlienAffiliation } = require('./alienRoles');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const VALID_CENTER_SLOTS = ['center0', 'center1', 'center2'];

function isValidPlayerId(room, id) {
  return room.players.some(p => p.id === id);
}

// ─── Game Start ──────────────────────────────────────────────────────────────

function startAlienGame(room) {
  const { players, settings } = room;
  const roles = [...settings.selectedRoles];

  if (roles.length !== players.length + 3) {
    throw new Error(`Need exactly ${players.length + 3} roles for ${players.length} players`);
  }

  shuffle(roles);

  if (room.isSimulation && room.preferredHostRole) {
    const preferred = room.preferredHostRole;
    const idx = roles.indexOf(preferred);
    if (idx !== -1) {
      const hostPos = players.findIndex(p => p.id === room.hostId);
      if (hostPos !== -1 && hostPos < players.length) {
        [roles[hostPos], roles[idx]] = [roles[idx], roles[hostPos]];
      }
    }
  }

  const cards = {};
  players.forEach((p, i) => { cards[p.id] = roles[i]; });
  cards['center0'] = roles[players.length];
  cards['center1'] = roles[players.length + 1];
  cards['center2'] = roles[players.length + 2];

  room.originalCards = { ...cards };
  room.currentCards = { ...cards };
  room.state = 'role_reveal';
  room.exposedCenter = {};
  room.alienAppState = {};     // stores oracle decisions, alien instructions, etc.
  room.nightPhase = {
    roleOrder: getAlienNightOrder(settings.selectedRoles),
    currentRoleIndex: -1,
    pendingPlayerIds: [],
    pendingActions: [],
    resolver: null,
    timer: null,
    multiStepState: {},
  };
  room.dayPhase = null;
  room.results = null;
}

// ─── APP Instruction Generators (random each game) ──────────────────────────

// Returns the player index (seat position) for a player ID
function seatIndex(room, playerId) {
  return room.players.findIndex(p => p.id === playerId);
}

function getNeighborIds(room, playerId) {
  const idx = seatIndex(room, playerId);
  const len = room.players.length;
  const left = room.players[(idx - 1 + len) % len].id;
  const right = room.players[(idx + 1) % len].id;
  return { left, right, leftIdx: (idx - 1 + len) % len, rightIdx: (idx + 1) % len };
}

// ── Oracle Question Generator ──────────────────────────────────────────────
// Probabilities (custom-tuned):
//   Even/Odd             — 20%
//   Exchange (Drunk)     — 10%
//   Center               — 10%
//   Player Number        — 10%
//   Number Guess         — 15%
//   Change Team          — 35%
function generateOracleQuestion(room) {
  const playerCount = room.players.length;
  const roll = Math.random() * 100;

  // 0-20: Even/Odd (20%)
  if (roll < 20) {
    return {
      id: 'even_odd',
      group: 'info',
      type: 'choice',
      question: 'Số ghế của bạn là CHẴN hay LẺ?',
      options: ['Chẵn', 'Lẻ'],
      publicAnnounce: '🤖 → Oracle: Oracle, số ghế của bạn chẵn hay lẻ?',
    };
  }

  // 20-30: Exchange / Drunk action (10%)
  if (roll < 30) {
    return {
      id: 'exchange',
      group: 'action',
      type: 'choice',
      question: 'Bạn có muốn đổi bài của mình với 1 bài giữa không? (Không xem bài mới)',
      options: ['Có, đổi bài', 'Không'],
      publicAnnounce: '🤖 → Oracle: Oracle đang cân nhắc đổi bài...',
    };
  }

  // 30-40: Center cards (10%)
  if (roll < 40) {
    return {
      id: 'center',
      group: 'action',
      type: 'choice',
      question: 'Bạn có muốn xem 3 lá bài ở giữa không?',
      options: ['Có, xem 3 lá', 'Không'],
      publicAnnounce: '🤖 → Oracle: Oracle muốn xem 3 lá bài ở giữa?',
    };
  }

  // 40-50: Player Number (10%)
  if (roll < 50) {
    return {
      id: 'player_number',
      group: 'action',
      type: 'pick_number',
      question: `Bạn muốn xem bài của người chơi số mấy? (1-${playerCount})`,
      min: 1, max: playerCount,
      publicAnnounce: '🤖 → Oracle: Oracle muốn xem bài của người chơi số mấy?',
    };
  }

  // 50-65: Number guess 1-10 (15%)
  if (roll < 65) {
    const secretNumber = Math.floor(Math.random() * 10) + 1;
    return {
      id: 'number_guess',
      group: 'challenge',
      type: 'pick_number',
      question: 'Ta đang nghĩ đến một số từ 1 đến 10. Đó là số mấy?',
      min: 1, max: 10,
      secretNumber,
      publicAnnounce: '🤖 → Oracle: Oracle, hãy đoán số ta đang nghĩ...',
    };
  }

  // 65-100: Change Team (35%)
  // App picks an alien team that's in the game (here we have just "Alien" team)
  return {
    id: 'change_team',
    group: 'switch',
    type: 'choice',
    question: 'Bạn có muốn gia nhập phe ALIEN không? Bài Oracle sẽ trở thành Alien — bạn thức cùng phe Alien. Dù bị giết, phe của bạn vẫn thắng.',
    options: ['Có, gia nhập Alien', 'Không'],
    targetTeam: 'alien',
    publicAnnounce: '🤖 → Oracle: Oracle, bạn có muốn gia nhập phe Alien không?',
  };
}

// Process oracle answer — matches official One Night Alien app mechanics
function processOracleAnswer(room, playerId, question, answer) {
  const { currentCards } = room;
  const playerCount = room.players.length;

  switch (question.id) {
    // ── CHANGE TEAM (45%) ──
    // Yes → Oracle becomes Alien team (like Minion in Werewolf):
    //   • Oracle's card STAYS as 'oracle' (Cow/Mortician/Leader don't detect her as alien)
    //   • Oracle SEES who aliens are (one-way knowledge — aliens don't see Oracle)
    //   • Oracle wins with Alien team
    //   • Oracle's death does NOT count against alien win condition
    case 'change_team': {
      if (answer.includes('Có')) {
        room.alienAppState.oracleJoinedAlien = true;
        room.alienAppState.oraclePlayerId = playerId;

        // Reveal aliens to Oracle (one-way knowledge, like Minion sees wolves)
        const aliens = room.players.filter(p => isAlienAffiliation(room.originalCards[p.id]))
          .map(p => ({ id: p.id, name: p.name, seat: seatIndex(room, p.id) + 1, role: room.originalCards[p.id] }));

        return {
          questionId: question.id, answer,
          knownAliens: aliens,
          appReply: '🤖 → Oracle: Bạn đã gia nhập phe ALIEN (như Tay Sai). Bạn vẫn là Oracle nhưng giờ giúp phe Alien. Cow không tap bạn, Mortician không thấy bạn là Alien, nhưng bạn THẮNG cùng Alien. Dù bị giết, phe Alien vẫn thắng.',
          publicAnnounce: '🤖 → Oracle: Oracle đã PHẢN BỘI — gia nhập phe Alien!',
        };
      }
      return {
        questionId: question.id, answer,
        appReply: '🤖 → Oracle: Oracle chọn trung thành với phe Dân.',
        publicAnnounce: '🤖 → Oracle: Oracle đã đưa ra lựa chọn của mình.',
      };
    }

    // ── EXCHANGE (Drunk action) ──
    // App might tell Oracle NOT to do it (refuses)
    case 'exchange': {
      if (!answer.includes('Có')) {
        return {
          questionId: question.id, answer,
          appReply: '🤖 → Oracle: Khôn ngoan, giữ bài của mình.',
          publicAnnounce: '🤖 → Oracle: Oracle giữ nguyên bài.',
        };
      }
      // App has 30% chance to REFUSE the request (humorous)
      if (Math.random() < 0.30) {
        return {
          questionId: question.id, answer, refused: true,
          appReply: '🤖 → Oracle: Hmm... ta đổi ý rồi. KHÔNG đổi bài! Haha.',
          publicAnnounce: '🤖 → Oracle: Oracle muốn đổi bài — nhưng bị Tiếng vọng từ chối!',
        };
      }
      // Swap Oracle's card with random center slot
      const slot = pick(VALID_CENTER_SLOTS);
      const myRole = currentCards[playerId];
      currentCards[playerId] = currentCards[slot];
      currentCards[slot] = myRole;
      return {
        questionId: question.id, answer, swapped: true, slot,
        appReply: '🤖 → Oracle: Đã đổi bài Oracle với một bài giữa. Bạn KHÔNG biết bài mới!',
        publicAnnounce: '🤖 → Oracle: Oracle đã đổi bài với 1 lá giữa (mù).',
      };
    }

    // ── CENTER (Oracle asks to view 3, App teases by giving fewer) ──
    case 'center': {
      if (!answer.includes('Có')) {
        return {
          questionId: question.id, answer,
          appReply: '🤖 → Oracle: Không muốn xem? Cũng được.',
          publicAnnounce: '🤖 → Oracle: Oracle không xem bài giữa.',
        };
      }
      // App decides how many — usually less than 3 (humorous)
      const actual = pick([1, 1, 1, 2, 2, 3]); // weighted: mostly 1, sometimes 2, rarely 3
      const teases = {
        1: '🤖 → Oracle: 3 lá á?? Quá tham lam! Bạn chỉ được xem 1 LÁ thôi. Hahaha.',
        2: '🤖 → Oracle: 3 lá? Hmm... thôi cho bạn xem 2 lá là đủ.',
        3: '🤖 → Oracle: OK, hôm nay Tiếng vọng rộng lượng — bạn được xem CẢ 3 lá!',
      };
      const viewSlots = shuffle([...VALID_CENTER_SLOTS]).slice(0, actual);
      const seen = viewSlots.map(s => ({ slot: s, role: currentCards[s] }));
      return {
        questionId: question.id, answer, actualCount: actual, seen,
        appReply: teases[actual],
        publicAnnounce: `🤖 → Oracle: Oracle xin xem 3 lá — App cho xem ${actual} lá.`,
      };
    }

    // ── EVEN/ODD (App only broadcasts what Oracle said — no verification at all) ──
    case 'even_odd': {
      return {
        questionId: question.id, answer,
        publicAnnounce: `🤖 → Oracle: Oracle trả lời là số ${answer}.`,
      };
    }

    // ── PLAYER NUMBER (App might pick a DIFFERENT player — trolling) ──
    // EVERYONE knows which card Oracle viewed (broadcast publicly)
    case 'player_number': {
      const desiredIdx = Math.max(0, Math.min(playerCount - 1, parseInt(answer) - 1));
      let actualIdx = desiredIdx;
      let trollMessage = '';

      // 35% chance app picks a DIFFERENT player (humorous)
      if (Math.random() < 0.35) {
        const others = Array.from({ length: playerCount }, (_, i) => i).filter(i => i !== desiredIdx);
        actualIdx = pick(others);
        trollMessage = `🤖 → Oracle: Bạn muốn xem số ${desiredIdx + 1}? Haha, hôm nay App chọn cho bạn xem số ${actualIdx + 1}!`;
      } else {
        trollMessage = `🤖 → Oracle: Được đấy, hãy xem bài người chơi số ${actualIdx + 1}.`;
      }

      const targetPlayer = room.players[actualIdx];
      const targetRole = currentCards[targetPlayer.id];

      return {
        questionId: question.id,
        answer,
        desiredNumber: desiredIdx + 1,
        actualNumber: actualIdx + 1,
        seen: { id: targetPlayer.id, name: targetPlayer.name, role: targetRole },
        appReply: trollMessage,
        // Publicly broadcast which player number was viewed (per official rules)
        publicAnnounce: `🤖 → Oracle: Oracle đã xem bài của người chơi số ${actualIdx + 1} (${targetPlayer.name}).`,
      };
    }

    // ── NUMBER GUESS 1-10 ──
    // Correct (10%) → Oracle stays awake whole night (sees all night log)
    // Wrong  (90%) → Hunt Oracle mode (all win conditions cancelled)
    case 'number_guess': {
      const guess = parseInt(answer) || 0;
      const correct = guess === question.secretNumber;

      if (correct) {
        room.alienAppState.oracleStaysAwake = true;
        return {
          questionId: question.id, answer: guess, correct: true,
          secretNumber: question.secretNumber,
          appReply: `🤖 → Oracle: ${guess}... ĐÚNG RỒI! Không thể tin được! Oracle được THỨC SUỐT ĐÊM — bạn sẽ thấy mọi hành động!`,
          publicAnnounce: `🤖 → Oracle: Oracle đoán ĐÚNG! Oracle được thức suốt đêm.`,
          oracleChallenge: 'correct',
        };
      }

      // Wrong — Hunt Oracle mode
      room.alienAppState.oracleHuntMode = true;
      // Check if Oracle is in center (no one plays Oracle this game)
      const oracleInCenter = !room.players.some(p => room.originalCards[p.id] === 'oracle');
      if (oracleInCenter) {
        room.alienAppState.circleVoteOnly = true;
      }

      return {
        questionId: question.id, answer: guess, correct: false,
        secretNumber: question.secretNumber,
        oracleInCenter,
        appReply: `🤖 → Oracle: ${guess}?! SAI! Ta nghĩ số ${question.secretNumber}! Oracle đã chọc giận ta!`,
        publicAnnounce: oracleInCenter
          ? `🤖 → Oracle: Oracle đoán SAI! HỦY TẤT CẢ điều kiện thắng. Oracle ở bài giữa → chỉ thắng bằng CIRCLE VOTE!`
          : `🤖 → Oracle: Oracle đoán SAI! HỦY TẤT CẢ điều kiện thắng. MỤC TIÊU MỚI: GIẾT ORACLE!`,
        oracleChallenge: 'wrong',
      };
    }

    default:
      return { questionId: question.id, answer };
  }
}

// ── Alien Instruction Generator ────────────────────────────────────────────
// Probabilities match the official One Night Ultimate Alien app:
//   View         — 30% (each Alien views 1 card individually)
//   All View     — 30% (all Aliens together view 1 card)
//   Stare        — 20% (do nothing)
//   Left         — 5%  (pass card to left Alien)
//   Right        — 5%  (pass card to right Alien)
//   Show         — 10% (all Aliens show their cards to each other)
function generateAlienInstruction(room) {
  // Oracle override: force swap when oracleForceSwap activated
  if (room.alienAppState?.oracleForceSwap) {
    return {
      type: 'swap_cards',
      announce: 'Alien, hãy hoán đổi bài của các bạn với nhau.',
      publicAnnounce: '🤖 → Alien: Alien, hãy hoán đổi bài với nhau (Oracle kích hoạt).',
    };
  }

  // Target pool for View / All View
  const viewTargets = [
    { type: 'neighbor', label: 'hàng xóm' },
    { type: 'left', label: 'bên trái' },
    { type: 'right', label: 'bên phải' },
    { type: 'odd', label: 'người số LẺ bất kỳ' },
    { type: 'even', label: 'người số CHẴN bất kỳ' },
    { type: 'lower', label: 'người số THẤP hơn' },
    { type: 'higher', label: 'người số CAO hơn' },
    { type: 'center', label: 'ở giữa' },
  ];

  const roll = Math.random() * 100;

  // 0-30: Individual View (30%)
  if (roll < 30) {
    const target = pick(viewTargets);
    return {
      type: 'individual_view',
      target: target.type,
      targetLabel: target.label,
      announce: `Mỗi Alien, hãy xem bài của 1 người ${target.label}.`,
      publicAnnounce: `🤖 → Alien: Mỗi Alien, hãy xem 1 bài ${target.label}.`,
    };
  }

  // 30-60: Group View (30%)
  if (roll < 60) {
    const target = pick(viewTargets);
    return {
      type: 'group_view',
      target: target.type,
      targetLabel: target.label,
      announce: `Tất cả Alien cùng xem 1 bài ${target.label}.`,
      publicAnnounce: `🤖 → Alien: Tất cả Alien cùng xem 1 bài ${target.label}.`,
    };
  }

  // 60-80: Stare (20%)
  if (roll < 80) {
    return {
      type: 'stare',
      announce: 'Alien, hãy nhìn nhau rồi nhắm mắt lại.',
      publicAnnounce: '🤖 → Alien: Alien chỉ nhìn nhau, không hành động.',
    };
  }

  // 80-85: Left (5%) — cards rotate left
  if (roll < 85) {
    return {
      type: 'rotate_left',
      announce: 'Mỗi Alien, hãy đưa bài của mình cho Alien gần nhất BÊN TRÁI. Bạn sẽ nhận bài từ Alien gần nhất bên phải.',
      publicAnnounce: '🤖 → Alien: Tất cả Alien chuyền bài cho Alien gần nhất bên TRÁI.',
    };
  }

  // 85-90: Right (5%) — cards rotate right
  if (roll < 90) {
    return {
      type: 'rotate_right',
      announce: 'Mỗi Alien, hãy đưa bài của mình cho Alien gần nhất BÊN PHẢI. Bạn sẽ nhận bài từ Alien gần nhất bên trái.',
      publicAnnounce: '🤖 → Alien: Tất cả Alien chuyền bài cho Alien gần nhất bên PHẢI.',
    };
  }

  // 90-100: Show (10%) — all aliens reveal their current cards to each other
  return {
    type: 'show',
    announce: 'Mỗi Alien, hãy CHO các Alien khác xem bài của mình.',
    publicAnnounce: '🤖 → Alien: Tất cả Alien lộ bài cho nhau xem.',
  };
}

// ── Rascal Instruction Generator ───────────────────────────────────────────
function generateRascalInstruction(room) {
  // Tuned weights: Village Idiot 5%, others ~31.67% each (total 100%)
  const roll = Math.random() * 100;
  let chosenType;
  if (roll < 5) {
    chosenType = 'village_idiot';
  } else if (roll < 5 + 95 / 3) {
    chosenType = 'troublemaker';
  } else if (roll < 5 + (2 * 95) / 3) {
    chosenType = 'robber';
  } else {
    chosenType = 'drunk';
  }

  const mandatoryChance = {
    troublemaker: 0.4,
    robber: 0.4,
    drunk: 0.5,
    village_idiot: 0.3,
  };

  const chosen = {
    type: chosenType,
    mandatory: Math.random() < mandatoryChance[chosenType],
  };

  const verb = chosen.mandatory ? 'PHẢI' : 'CÓ THỂ';

  const labels = {
    troublemaker: `hoán đổi bài của 2 người chơi khác`,
    robber: `đổi bài của bạn với 1 người khác (xem bài mới)`,
    drunk: `đổi bài của bạn với 1 bài giữa (không xem)`,
    village_idiot: `xoay bài tất cả người khác sang trái hoặc phải`,
  };

  chosen.announce = `Quỷ Nhỏ, bạn ${verb} ${labels[chosen.type]}.`;
  chosen.publicAnnounce = `🤖 → Rascal: Rascal, bạn ${verb} ${labels[chosen.type]}.`;

  return chosen;
}

// ── Exposer Instruction Generator ──────────────────────────────────────────
function generateExposerInstruction() {
  const count = pick([1, 1, 1, 2, 2, 3]); // weighted toward 1
  const label = count === 1 ? '1 bài' : `${count} bài`;
  return {
    type: 'expose',
    count,
    announce: `Kẻ Phơi Bày, bạn CÓ THỂ lật ${label} ở giữa (hoặc không lật gì).`,
    publicAnnounce: `🤖 → Exposer: Exposer, bạn CÓ THỂ lật ${label} ở giữa.`,
  };
}

// ── Psychic Instruction Generator ──────────────────────────────────────────
// Per wiki: Psychic sees 1 or 2 cards. Targets: Neighbors / Odd / Even / Specific player numbers
function generatePsychicInstruction(room, playerId) {
  const count = Math.random() < 0.6 ? 1 : 2;
  const playerCount = room.players.length;
  const mySeat = seatIndex(room, playerId) + 1;

  // Build target options
  const variants = [
    { type: 'neighbors', label: count === 1 ? '1 hàng xóm bất kỳ' : 'cả 2 người hàng xóm' },
    { type: 'odd', label: count === 1 ? '1 người chơi số LẺ bất kỳ' : `${count} người chơi số LẺ` },
    { type: 'even', label: count === 1 ? '1 người chơi số CHẴN bất kỳ' : `${count} người chơi số CHẴN` },
    { type: 'specific', label: null }, // Filled below
  ];

  const chosen = pick(variants);

  // For 'specific' — pick random target player numbers (not self)
  if (chosen.type === 'specific') {
    const otherNums = Array.from({ length: playerCount }, (_, i) => i + 1).filter(n => n !== mySeat);
    const targets = shuffle([...otherNums]).slice(0, Math.min(count, otherNums.length));
    chosen.targetNumbers = targets;
    chosen.label = `bài người chơi số ${targets.join(', ')}`;
  }

  return {
    type: 'psychic_view',
    viewType: chosen.type,
    count,
    targetNumbers: chosen.targetNumbers || null,
    announce: `Psychic, hãy xem ${chosen.label}.`,
    publicAnnounce: `🤖 → Psychic: Psychic, hãy xem ${chosen.label}.`,
  };
}

// ── Mortician Instruction Generator ────────────────────────────────────────
function generateMorticianInstruction() {
  const viewCount = pick([0, 0, 1, 1, 1, 2]); // weighted
  if (viewCount === 0) {
    return {
      type: 'mortician_view', viewCount: 0,
      announce: 'Nhà Quàn, đêm nay bạn không được xem bài ai.',
      publicAnnounce: '🤖 → Mortician: Mortician, đêm nay bạn không được xem bài ai.',
    };
  }
  if (viewCount === 1) {
    const side = pick(['left', 'right', 'choice']);
    const sideLabel = side === 'left' ? 'bên trái' : side === 'right' ? 'bên phải' : 'bạn chọn';
    return {
      type: 'mortician_view', viewCount: 1, side,
      announce: `Nhà Quàn, hãy xem bài hàng xóm ${sideLabel}.`,
      publicAnnounce: `🤖 → Mortician: Mortician, hãy xem bài 1 hàng xóm.`,
    };
  }
  return {
    type: 'mortician_view', viewCount: 2,
    announce: 'Nhà Quàn, hãy xem bài cả 2 hàng xóm.',
    publicAnnounce: '🤖 → Mortician: Mortician, hãy xem bài cả 2 hàng xóm.',
  };
}

// ── Blob Instruction Generator ─────────────────────────────────────────────
// Official rules: blob member count depends on total player count.
// Direction: left, right, or split evenly to both sides (when even count).
function generateBlobInstruction(room, playerId) {
  const idx = seatIndex(room, playerId);
  const len = room.players.length;

  // Official blob member count table (excluding Blob itself)
  let otherCount;
  if (len <= 3) otherCount = 0;
  else if (len === 4) otherCount = 1;
  else if (len <= 6) otherCount = 2;
  else if (len <= 8) otherCount = 3;
  else otherCount = 4;

  const members = [playerId];
  let direction = null;

  if (otherCount > 0) {
    // Even count can split to both sides; odd count picks one side
    const canSplit = otherCount % 2 === 0;
    const directions = canSplit ? ['left', 'right', 'both'] : ['left', 'right'];
    direction = pick(directions);

    if (direction === 'both') {
      const half = otherCount / 2;
      for (let i = 1; i <= half; i++) {
        members.push(room.players[(idx - i + len) % len].id);
        members.push(room.players[(idx + i) % len].id);
      }
    } else if (direction === 'left') {
      for (let i = 1; i <= otherCount; i++) {
        members.push(room.players[(idx - i + len) % len].id);
      }
    } else {
      for (let i = 1; i <= otherCount; i++) {
        members.push(room.players[(idx + i) % len].id);
      }
    }
  }

  const uniqueMembers = [...new Set(members)];

  // Build descriptive announce with direction info
  let directionLabel;
  if (otherCount === 0) {
    directionLabel = 'Blob không nhiễm ai thêm.';
  } else if (direction === 'both') {
    directionLabel = `${otherCount / 2} người bên trái và ${otherCount / 2} người bên phải của Blob đã nhiễm Blob.`;
  } else if (direction === 'left') {
    directionLabel = `${otherCount} người bên trái của Blob đã nhiễm Blob.`;
  } else {
    directionLabel = `${otherCount} người bên phải của Blob đã nhiễm Blob.`;
  }

  // Build member names for public announce
  const blobMemberNames = uniqueMembers.map(id => {
    const p = room.players.find(pp => pp.id === id);
    return p ? p.name : '?';
  });

  return {
    type: 'blob_absorb',
    members: uniqueMembers,
    direction: otherCount > 0 ? direction : null,
    otherCount,
    memberNames: blobMemberNames,
    announce: 'Blob, hãy xem ai thuộc Blob của bạn.',
    publicAnnounce: `🤖 → Blob: ${directionLabel}`,
  };
}

// ─── Night Action Data (sent to player) ──────────────────────────────────────

function getAlienNightActionData(room, phase, playerId) {
  const { players } = room;
  const nameMap = {};
  players.forEach(p => { nameMap[p.id] = p.name; });

  switch (phase) {
    case 'oracle': {
      const q = room.alienAppState.oracleQuestion;
      return {
        question: q,
        playerCount: players.length,
        playerNumbers: players.map((p, i) => ({ number: i + 1, id: p.id, name: p.name })),
      };
    }

    case 'aliens': {
      // Aliens only see each other — Oracle (if joined) is hidden (like Minion in Werewolf)
      const allAliens = players.filter(p => isAlienAffiliation(room.originalCards[p.id]))
        .map(p => ({ id: p.id, name: p.name, seat: seatIndex(room, p.id) + 1 }));
      const instruction = room.alienAppState.alienInstruction;
      const otherPlayers = players.filter(p => p.id !== playerId)
        .map(p => ({ id: p.id, name: p.name, seat: seatIndex(room, p.id) + 1 }));

      // Resolve targets based on instruction type
      let viewTargets = null;
      if (instruction.type === 'individual_view' || instruction.type === 'group_view') {
        viewTargets = resolveViewTargets(room, playerId, instruction.target);
      }

      // Cow info: Aliens know who is Cow (they see Cow put fist out)
      const cowPlayer = players.find(p => room.originalCards[p.id] === 'cow');
      let cowAdjacent = false;
      if (cowPlayer) {
        const { left, right } = getNeighborIds(room, playerId);
        cowAdjacent = cowPlayer.id === left || cowPlayer.id === right;
      }

      return {
        aliens: allAliens,
        instruction,
        otherPlayers,
        viewTargets,
        cowAdjacent,
        cowPlayerId: cowPlayer?.id || null,
        cowPlayerName: cowPlayer?.name || null,
        playerNumbers: players.map((p, i) => ({ id: p.id, name: p.name, seat: i + 1 })),
      };
    }

    case 'groob_zerb': {
      const partners = players.filter(p => {
        const r = room.originalCards[p.id];
        return r === 'groob' || r === 'zerb';
      }).map(p => ({ id: p.id, name: p.name }));
      return { partners };
    }

    case 'leader': {
      // Leader sees REAL aliens raising thumbs — Oracle (if joined) doesn't (she's hidden like Minion)
      const alienPlayers = players.filter(p => isAlienAffiliation(room.originalCards[p.id]))
        .map(p => ({ id: p.id, name: p.name, role: room.originalCards[p.id] }));
      const hasGroobAndZerb = players.some(p => room.originalCards[p.id] === 'groob')
        && players.some(p => room.originalCards[p.id] === 'zerb');
      return { alienPlayers, hasGroobAndZerb };
    }

    case 'cow': {
      // Check which neighbors are aliens — Cow learns left/right separately
      const cowIdx = seatIndex(room, playerId);
      const len = players.length;
      const leftPlayer = players[(cowIdx - 1 + len) % len];
      const rightPlayer = players[(cowIdx + 1) % len];
      const leftIsAlien = isAlienAffiliation(room.originalCards[leftPlayer.id]);
      const rightIsAlien = isAlienAffiliation(room.originalCards[rightPlayer.id]);
      return {
        leftIsAlien,
        rightIsAlien,
        wasTapped: leftIsAlien || rightIsAlien,
        leftPlayer: { id: leftPlayer.id, name: leftPlayer.name },
        rightPlayer: { id: rightPlayer.id, name: rightPlayer.name },
      };
    }

    case 'rascal': {
      const instruction = room.alienAppState.rascalInstruction;
      const otherPlayers = players.filter(p => p.id !== playerId).map(p => ({ id: p.id, name: p.name }));
      return { instruction, otherPlayers };
    }

    case 'exposer': {
      const instruction = room.alienAppState.exposerInstruction;
      return { instruction, exposedCenter: room.exposedCenter || {} };
    }

    case 'psychic': {
      const instruction = room.alienAppState.psychicInstructions?.[playerId]
        || generatePsychicInstruction(room, playerId);
      const targets = resolveViewTargets(room, playerId, instruction.viewType, instruction);
      return { instruction, viewTargets: targets };
    }

    case 'mortician': {
      const instruction = room.alienAppState.morticianInstruction;
      const { left, right } = getNeighborIds(room, playerId);
      const neighbors = {
        left: { id: left, name: nameMap[left] },
        right: { id: right, name: nameMap[right] },
      };

      let viewableCards = {};
      if (instruction.viewCount === 2) {
        viewableCards[left] = room.currentCards[left];
        viewableCards[right] = room.currentCards[right];
      } else if (instruction.viewCount === 1) {
        if (instruction.side === 'left') {
          viewableCards[left] = room.currentCards[left];
        } else if (instruction.side === 'right') {
          viewableCards[right] = room.currentCards[right];
        }
        // 'choice' → player picks, handled in processAction
      }

      return { instruction, neighbors, viewableCards };
    }

    case 'blob': {
      const instruction = room.alienAppState.blobInstruction;
      const memberNames = instruction.members.map(id => ({ id, name: nameMap[id] }));
      return { instruction, members: memberNames };
    }

    default:
      return {};
  }
}

function resolveViewTargets(room, playerId, targetType, instruction) {
  const players = room.players;
  const idx = seatIndex(room, playerId);
  const len = players.length;
  const mySeat = idx + 1;

  switch (targetType) {
    // ── Alien-style targets (kept for backward compatibility) ──
    case 'neighbor': {
      const left = players[(idx - 1 + len) % len];
      const right = players[(idx + 1) % len];
      return [{ id: left.id, name: left.name, seat: ((idx - 1 + len) % len) + 1 }, { id: right.id, name: right.name, seat: ((idx + 1) % len) + 1 }];
    }
    case 'left': {
      const i = (idx - 1 + len) % len;
      return [{ id: players[i].id, name: players[i].name, seat: i + 1 }];
    }
    case 'right': {
      const i = (idx + 1) % len;
      return [{ id: players[i].id, name: players[i].name, seat: i + 1 }];
    }
    case 'center':
      return VALID_CENTER_SLOTS.map(s => ({ id: s, name: s === 'center0' ? 'Giữa 1' : s === 'center1' ? 'Giữa 2' : 'Giữa 3' }));

    // ── Psychic targets (per wiki) ──
    case 'neighbors': {
      const left = players[(idx - 1 + len) % len];
      const right = players[(idx + 1) % len];
      return [
        { id: left.id, name: left.name, seat: ((idx - 1 + len) % len) + 1 },
        { id: right.id, name: right.name, seat: ((idx + 1) % len) + 1 },
      ];
    }
    case 'odd': {
      return players.map((p, i) => ({ id: p.id, name: p.name, seat: i + 1 }))
        .filter(p => p.seat % 2 === 1 && p.seat !== mySeat);
    }
    case 'even': {
      return players.map((p, i) => ({ id: p.id, name: p.name, seat: i + 1 }))
        .filter(p => p.seat % 2 === 0 && p.seat !== mySeat);
    }
    case 'lower': {
      return players.map((p, i) => ({ id: p.id, name: p.name, seat: i + 1 }))
        .filter(p => p.seat < mySeat);
    }
    case 'higher': {
      return players.map((p, i) => ({ id: p.id, name: p.name, seat: i + 1 }))
        .filter(p => p.seat > mySeat);
    }
    case 'specific': {
      const nums = instruction?.targetNumbers || [];
      return nums.map(n => {
        const p = players[n - 1];
        return p ? { id: p.id, name: p.name, seat: n } : null;
      }).filter(Boolean);
    }

    default:
      return players.filter(p => p.id !== playerId).map((p, i) => ({ id: p.id, name: p.name, seat: i + 1 }));
  }
}

// ─── Process Night Action ────────────────────────────────────────────────────

function processAlienNightAction(room, playerId, phase, action) {
  const { currentCards } = room;

  switch (phase) {
    case 'oracle': {
      const q = room.alienAppState.oracleQuestion;
      if (!q) return {};
      return processOracleAnswer(room, playerId, q, action.answer);
    }

    case 'aliens': {
      const instruction = room.alienAppState.alienInstruction;

      if (instruction.type === 'swap_cards') {
        // Only REAL aliens swap (Oracle who joined as Minion-style doesn't physically swap)
        const alienIds = room.players
          .filter(p => isAlienAffiliation(room.originalCards[p.id]))
          .map(p => p.id);
        if (alienIds.length >= 2) {
          const cards = alienIds.map(id => currentCards[id]);
          cards.unshift(cards.pop());
          alienIds.forEach((id, i) => { currentCards[id] = cards[i]; });
        }
        return { swapped: true };
      }

      if (instruction.type === 'individual_view') {
        if (action.targetId) {
          const role = currentCards[action.targetId];
          const target = room.players.find(p => p.id === action.targetId);
          return { seen: { id: action.targetId, name: target?.name || action.targetId, role } };
        }
        return {};
      }

      if (instruction.type === 'group_view') {
        if (action.targetId) {
          const role = currentCards[action.targetId];
          const target = room.players.find(p => p.id === action.targetId);
          return { seen: { id: action.targetId, name: target?.name || action.targetId, role } };
        }
        return {};
      }

      // ── ROTATE LEFT/RIGHT — cards rotate among real aliens (nearest alien neighbor) ──
      if (instruction.type === 'rotate_left' || instruction.type === 'rotate_right') {
        const realAliens = room.players
          .map((p, i) => ({ id: p.id, name: p.name, seat: i }))
          .filter(p => isAlienAffiliation(room.originalCards[p.id]));

        // Build transfer map before swapping
        const transfers = {};
        if (realAliens.length >= 2) {
          const oldCards = realAliens.map(p => currentCards[p.id]);
          if (instruction.type === 'rotate_left') {
            // Each alien gives card to the nearest alien on their LEFT
            for (let i = 0; i < realAliens.length; i++) {
              const receiver = realAliens[(i - 1 + realAliens.length) % realAliens.length];
              transfers[receiver.id] = { fromId: realAliens[i].id, fromName: realAliens[i].name };
            }
            const last = oldCards.pop();
            oldCards.unshift(last);
          } else {
            // Each alien gives card to the nearest alien on their RIGHT
            for (let i = 0; i < realAliens.length; i++) {
              const receiver = realAliens[(i + 1) % realAliens.length];
              transfers[receiver.id] = { fromId: realAliens[i].id, fromName: realAliens[i].name };
            }
            const first = oldCards.shift();
            oldCards.push(first);
          }
          realAliens.forEach((p, i) => { currentCards[p.id] = oldCards[i]; });
        }

        const myTransfer = transfers[playerId];
        return {
          rotated: instruction.type,
          newRole: currentCards[playerId],
          receivedFrom: myTransfer ? myTransfer.fromName : null,
        };
      }

      // ── SHOW — reveal each alien's current card to all aliens ──
      if (instruction.type === 'show') {
        const realAliens = room.players.filter(p => isAlienAffiliation(room.originalCards[p.id]));
        const revealed = realAliens.map(p => ({
          id: p.id,
          name: p.name,
          seat: seatIndex(room, p.id) + 1,
          role: currentCards[p.id],
        }));
        return { shown: true, revealed };
      }

      // ── STARE / NOTHING — just acknowledge ──
      return {};
    }

    case 'groob_zerb':
      return {};

    case 'leader':
      return {};

    case 'cow':
      return {};

    case 'rascal': {
      const instruction = room.alienAppState.rascalInstruction;

      if (action.skip && !instruction.mandatory) {
        return { skipped: true };
      }

      switch (instruction.type) {
        case 'troublemaker': {
          if (!action.target1 || !action.target2) return {};
          if (!isValidPlayerId(room, action.target1) || !isValidPlayerId(room, action.target2)) return {};
          if (action.target1 === playerId || action.target2 === playerId) return {};
          if (action.target1 === action.target2) return {};
          const r1 = currentCards[action.target1];
          const r2 = currentCards[action.target2];
          currentCards[action.target1] = r2;
          currentCards[action.target2] = r1;
          return { action: 'troublemaker' };
        }
        case 'robber': {
          if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
          if (action.targetPlayer === playerId) return {};
          const myOld = currentCards[playerId];
          const theirRole = currentCards[action.targetPlayer];
          currentCards[playerId] = theirRole;
          currentCards[action.targetPlayer] = myOld;
          return { action: 'robber', newRole: theirRole };
        }
        case 'drunk': {
          if (!action.centerSlot || !VALID_CENTER_SLOTS.includes(action.centerSlot)) return {};
          const myRole = currentCards[playerId];
          const centerRole = currentCards[action.centerSlot];
          currentCards[playerId] = centerRole;
          currentCards[action.centerSlot] = myRole;
          return { action: 'drunk' };
        }
        case 'village_idiot': {
          if (!action.direction || !['left', 'right'].includes(action.direction)) return {};
          const otherIds = room.players.filter(p => p.id !== playerId).map(p => p.id);
          if (otherIds.length < 2) return {};
          const roles = otherIds.map(id => currentCards[id]);
          if (action.direction === 'left') {
            const first = roles.shift();
            roles.push(first);
          } else {
            const last = roles.pop();
            roles.unshift(last);
          }
          otherIds.forEach((id, i) => { currentCards[id] = roles[i]; });
          return { action: 'village_idiot', direction: action.direction };
        }
        default:
          return {};
      }
    }

    case 'exposer': {
      const instruction = room.alienAppState.exposerInstruction;
      if (action.skip) return { skipped: true };

      const slots = action.centerSlots || [];
      if (slots.length !== instruction.count && slots.length !== 0) return { invalid: true };
      if (!slots.every(s => VALID_CENTER_SLOTS.includes(s))) return { invalid: true };

      room.exposedCenter = room.exposedCenter || {};
      slots.forEach(s => { room.exposedCenter[s] = currentCards[s]; });
      return { exposed: slots.map(s => ({ slot: s, role: currentCards[s] })) };
    }

    case 'psychic': {
      const inst = room.alienAppState.psychicInstructions?.[playerId];
      const count = inst?.count || 1;

      // For 'specific' or 'neighbors' (count==2): auto-reveal all targets
      if (inst && (inst.viewType === 'specific' || (inst.viewType === 'neighbors' && count === 2))) {
        const targets = resolveViewTargets(room, playerId, inst.viewType, inst);
        const seen = targets.map(t => ({ id: t.id, name: t.name, seat: t.seat, role: currentCards[t.id] }));
        return { seen, multi: true };
      }

      // For pick-based (odd, even, neighbors-1, etc.): player picks from given pool
      if (action.targetIds && Array.isArray(action.targetIds)) {
        const seen = action.targetIds.map(id => ({ id, role: currentCards[id] }));
        return { seen, multi: true };
      }
      if (action.targetId) {
        const role = currentCards[action.targetId];
        return { seen: { id: action.targetId, role } };
      }
      return {};
    }

    case 'mortician': {
      const instruction = room.alienAppState.morticianInstruction;
      if (instruction.viewCount === 0) return {};

      if (instruction.side === 'choice' && action.targetId) {
        return { seen: { id: action.targetId, role: currentCards[action.targetId] } };
      }
      // Auto-resolved in actionData
      return {};
    }

    case 'blob':
      return {};

    default:
      return {};
  }
}

// ─── Pre-generate all app instructions for the night ─────────────────────────

function generateNightInstructions(room) {
  const state = {};
  const roleSet = new Set(room.settings.selectedRoles);

  if (roleSet.has('oracle')) {
    state.oracleQuestion = generateOracleQuestion(room);
  }

  // Alien instruction generated after oracle (may depend on oracle decision)
  // Will be generated in runAlienNightPhase after oracle phase

  if (roleSet.has('rascal')) {
    state.rascalInstruction = generateRascalInstruction(room);
  }

  if (roleSet.has('exposer')) {
    state.exposerInstruction = generateExposerInstruction();
  }

  if (roleSet.has('psychic')) {
    state.psychicInstructions = {};
    let hasPsychicPlayer = false;
    room.players.forEach(p => {
      if (room.originalCards[p.id] === 'psychic') {
        state.psychicInstructions[p.id] = generatePsychicInstruction(room, p.id);
        hasPsychicPlayer = true;
      }
    });
    if (!hasPsychicPlayer) {
      // Psychic in center — generate PHANTOM instruction for identical broadcast
      const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)];
      const phantom = generatePsychicInstruction(room, randomPlayer.id);
      state.psychicPhantomInstruction = { ...phantom, phantom: true };
    }
  }

  if (roleSet.has('mortician')) {
    state.morticianInstruction = generateMorticianInstruction();
  }

  if (roleSet.has('blob')) {
    const blobPlayer = room.players.find(p => room.originalCards[p.id] === 'blob');
    if (blobPlayer) {
      state.blobInstruction = generateBlobInstruction(room, blobPlayer.id);
    } else {
      // Blob in center — generate a PHANTOM instruction (random seat) so public
      // announce uses identical format to maintain mystery
      const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)];
      const phantom = generateBlobInstruction(room, randomPlayer.id);
      // Strip the members so no one actually thinks they're in the Blob
      state.blobInstruction = { ...phantom, members: [], phantom: true };
    }
  }

  room.alienAppState = state;
}

function generateAlienInstructionPostOracle(room) {
  room.alienAppState.alienInstruction = generateAlienInstruction(room);
}

// ─── Vote & Results ──────────────────────────────────────────────────────────

function alienTallyVotes(room) {
  const { players, dayPhase } = room;
  const votes = dayPhase.votes;

  const tally = {};
  players.forEach(p => { tally[p.id] = 0; });
  Object.values(votes).forEach(targetId => {
    if (tally[targetId] !== undefined) tally[targetId]++;
  });

  const maxVotes = Math.max(0, ...Object.values(tally));
  const eliminated = maxVotes >= 2
    ? players.filter(p => tally[p.id] === maxVotes).map(p => p.id)
    : [];

  return { tally, eliminated };
}

function determineAlienWinners(room, eliminated) {
  const { players, currentCards } = room;
  const winners = [];

  // Hunt Oracle mode (supreme challenge failed) → ALL other win conditions cancelled
  // Everyone must kill Oracle. If Oracle survives, Oracle wins alone.
  if (room.alienAppState?.oracleHuntMode) {
    const oraclePlayer = players.find(p => currentCards[p.id] === 'oracle');
    if (oraclePlayer) {
      const oracleKilled = eliminated.includes(oraclePlayer.id);
      if (oracleKilled) {
        // Everyone except Oracle wins
        players.forEach(p => { if (p.id !== oraclePlayer.id) winners.push(p.id); });
      } else {
        // Oracle survived — Oracle wins alone!
        winners.push(oraclePlayer.id);
      }
      return { winners: [...new Set(winners)], huntOracleMode: true };
    }
    // Oracle card is in center — no one is Oracle → everyone loses this absurd situation
    // But we give everyone a "win" since it's nobody's fault
    players.forEach(p => winners.push(p.id));
    return { winners: [...new Set(winners)], huntOracleMode: true, oracleInCenter: true };
  }

  // ── Leader Trap: if ALL aliens (alien, syntheticalien, groob, zerb) voted for Leader → Alien team auto-wins
  // (Wiki: "Village team loses and Alien team wins if all aliens point to Leader, even if an alien is killed.")
  // Digital adaptation: "pointing" → "voting"
  const leaderPlayer = players.find(p => currentCards[p.id] === 'leader');
  if (leaderPlayer) {
    const aliensInPlay = players.filter(p => isAlienAffiliation(currentCards[p.id]));
    const votes = room.dayPhase?.votes || {};
    if (aliensInPlay.length > 0) {
      const allVotedLeader = aliensInPlay.every(a => votes[a.id] === leaderPlayer.id);
      if (allVotedLeader) {
        // Leader Trap! Alien team wins (every alien wins, plus Oracle if joined alien)
        const trapWinners = aliensInPlay.map(a => a.id);
        if (room.alienAppState?.oracleJoinedAlien) {
          const oraclePlayer = players.find(p => room.originalCards[p.id] === 'oracle');
          if (oraclePlayer) trapWinners.push(oraclePlayer.id);
        }
        return { winners: [...new Set(trapWinners)], leaderTrap: true };
      }
    }
  }

  // Check Synthetic Alien
  const syntheticPlayer = players.find(p => currentCards[p.id] === 'syntheticalien');
  const syntheticKilled = syntheticPlayer && eliminated.includes(syntheticPlayer.id);
  if (syntheticKilled) {
    // Synthetic wins, everyone else loses
    return { winners: [syntheticPlayer.id], syntheticWin: true };
  }

  // Check Groob/Zerb rivalry
  const hasGroob = players.some(p => currentCards[p.id] === 'groob');
  const hasZerb = players.some(p => currentCards[p.id] === 'zerb');
  const bothGroobZerb = hasGroob && hasZerb;

  // Groob/Zerb individual wins
  if (bothGroobZerb) {
    const groobPlayer = players.find(p => currentCards[p.id] === 'groob');
    const zerbPlayer = players.find(p => currentCards[p.id] === 'zerb');
    const groobDead = eliminated.includes(groobPlayer.id);
    const zerbDead = eliminated.includes(zerbPlayer.id);

    if (zerbDead && !groobDead) winners.push(groobPlayer.id);
    if (groobDead && !zerbDead) winners.push(zerbPlayer.id);
  }

  // Leader win condition (under G+Z rivalry: leader wins only if both G+Z and leader survive)
  // Note: leaderPlayer already computed earlier for Leader Trap check
  if (leaderPlayer) {
    if (bothGroobZerb) {
      const groobPlayer = players.find(p => currentCards[p.id] === 'groob');
      const zerbPlayer = players.find(p => currentCards[p.id] === 'zerb');
      const bothAlive = !eliminated.includes(groobPlayer.id) && !eliminated.includes(zerbPlayer.id);
      if (bothAlive && !eliminated.includes(leaderPlayer.id)) {
        winners.push(leaderPlayer.id);
      }
    } else {
      // Leader wins with village
      // (handled below in village win check)
    }
  }

  // Check if all aliens pointed to Leader → Alien team auto-wins
  // (This is handled during leader phase — stored in alienAppState)

  // All alien-affiliated players (for elimination check — Groob/Zerb are still aliens)
  const allAlienPlayerIds = players.filter(p => isAlienAffiliation(currentCards[p.id])).map(p => p.id);

  // "Core" alien team for win rewards (excludes Groob/Zerb when they have rivalry)
  const coreAlienPlayerIds = players.filter(p => {
    const r = currentCards[p.id];
    return r === 'alien' || (r === 'groob' && !bothGroobZerb) || (r === 'zerb' && !bothGroobZerb);
  }).map(p => p.id);

  // Oracle joined alien (like Minion)? — Oracle's card stays 'oracle', but she wins with alien team.
  // Her death does NOT count as alien killed (since her card isn't alien).
  const oracleJoinedAlien = room.alienAppState?.oracleJoinedAlien;
  const oraclePlayer = players.find(p => currentCards[p.id] === 'oracle');
  const oracleId = oracleJoinedAlien ? oraclePlayer?.id : null;

  // Check if ANY alien-affiliated player was eliminated (including Groob/Zerb)
  const eliminatedAlien = eliminated.some(id => allAlienPlayerIds.includes(id));

  // Oracle-as-minion check (legacy support if oracleBecomesMinion set)
  const oracleIsMinion = room.alienAppState?.oracleBecomesMinion;

  if (allAlienPlayerIds.length > 0) {
    if (eliminatedAlien) {
      // Village wins (an alien was killed)
      players.forEach(p => {
        const r = currentCards[p.id];
        if (!isAlienAffiliation(r) && r !== 'blob' && r !== 'mortician' && r !== 'syntheticalien') {
          // Exclude Oracle if she joined alien team — she loses with alien
          if (oracleJoinedAlien && p.id === oracleId) return;
          if (!bothGroobZerb || r !== 'leader') {
            winners.push(p.id);
          }
        }
        if (r === 'leader' && !bothGroobZerb && !eliminated.includes(p.id)) {
          if (!(oracleJoinedAlien && p.id === oracleId)) winners.push(p.id);
        }
      });
    } else {
      // No alien killed → alien team wins. Oracle (if joined) also wins.
      // NOTE: When Groob+Zerb rivalry is active, they are NOT in coreAlienPlayerIds.
      // They have their own win condition (rival must die) — they do NOT auto-win with alien team.
      coreAlienPlayerIds.forEach(id => winners.push(id));
      if (oracleIsMinion && oraclePlayer) winners.push(oraclePlayer.id);
      // Oracle joined alien → wins (even if she was killed — her death doesn't count)
      if (oracleJoinedAlien && oraclePlayer) winners.push(oraclePlayer.id);
    }
  } else {
    // No aliens among players → village wins if no one eliminated
    if (eliminated.length === 0) {
      players.forEach(p => {
        const r = currentCards[p.id];
        if (r !== 'blob' && r !== 'mortician' && r !== 'syntheticalien') {
          winners.push(p.id);
        }
      });
    }
  }

  // Mortician: wins if at least 1 neighbor killed & self survives
  const morticianPlayer = players.find(p => currentCards[p.id] === 'mortician');
  if (morticianPlayer && !eliminated.includes(morticianPlayer.id)) {
    const { left, right } = getNeighborIds(room, morticianPlayer.id);
    if (eliminated.includes(left) || eliminated.includes(right)) {
      winners.push(morticianPlayer.id);
    }
  }

  // Blob: wins if all blob members survive
  const blobInstruction = room.alienAppState?.blobInstruction;
  if (blobInstruction) {
    const allSurvived = blobInstruction.members.every(id => !eliminated.includes(id));
    if (allSurvived) {
      const blobPlayer = players.find(p => currentCards[p.id] === 'blob');
      if (blobPlayer) winners.push(blobPlayer.id);
    }
  }

  return { winners: [...new Set(winners)] };
}

function computeAlienResults(room) {
  const { tally, eliminated } = alienTallyVotes(room);
  const { winners, leaderTrap, huntOracleMode, syntheticWin, oracleInCenter } = determineAlienWinners(room, eliminated);

  room.results = {
    tally,
    votes: { ...(room.dayPhase?.votes || {}) },
    eliminated,
    winners,
    leaderTrap: leaderTrap || false,
    huntOracleMode: huntOracleMode || false,
    syntheticWin: syntheticWin || false,
    oracleInCenter: oracleInCenter || false,
    finalCards: { ...room.currentCards },
    originalCards: { ...room.originalCards },
    exposedCenter: room.exposedCenter || {},
    alienAppState: room.alienAppState || {},
  };
  room.state = 'results';
  return room.results;
}

module.exports = {
  startAlienGame,
  generateNightInstructions,
  generateAlienInstructionPostOracle,
  getAlienNightActionData,
  processAlienNightAction,
  computeAlienResults,
  alienTallyVotes,
  getNeighborIds,
  isAlienAffiliation,
};
