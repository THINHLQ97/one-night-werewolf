import { useState, useEffect } from 'react';

/**
 * OracleSpecialEvent — full-screen cinematic popup for the Oracle "guess a number" event.
 *
 * Two modes:
 *  - Interactive (isOracle=true): Oracle picks a number, sees result
 *  - Spectator   (isOracle=false): Other players watch the drama unfold
 *
 * Stages:
 *  1. intro    — show story popup
 *  2. picking  — Oracle picks, others see "Oracle đang suy nghĩ..."
 *  3. result   — show right/wrong popup with narrative
 *
 * Props:
 *  - isOracle      — bool, whether this player is the Oracle
 *  - oracleName    — string, name of Oracle player (for spectator mode)
 *  - onPick(num)   — called when Oracle chooses (interactive only)
 *  - onClose()     — called after result is acknowledged
 *  - result        — { correct, secretNumber, answer } when known
 */
export default function OracleSpecialEvent({ isOracle = false, oracleName = null, onPick, onClose, result }) {
  const [stage, setStage] = useState('intro');
  const [picked, setPicked] = useState(null);

  // Auto-advance to result stage when result arrives — with dramatic delay
  useEffect(() => {
    if (result && stage !== 'result') {
      // If still on 'picking' (Oracle just chose), add suspense delay
      if (stage === 'picking') {
        const delay = setTimeout(() => setStage('result'), 2500);
        return () => clearTimeout(delay);
      }
      setStage('result');
    }
  }, [result, stage]);

  function handlePick(num) {
    setPicked(num);
    onPick(num);
    // Stay on 'picking' stage; will auto-advance when result arrives
  }

  const imageSrc =
    stage === 'result' && result?.correct ? '/images/oracle special event/Pop-up-special-oracle-event-right.png' :
    stage === 'result' && !result?.correct ? '/images/oracle special event/Pop-up-special-oracle-event-wrong.png' :
    '/images/oracle special event/Pop-up-special-oracle-event.png';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 fade-in"
      style={{ animation: 'eventFadeIn 0.6s ease-out' }}>
      {/* Background star pulse */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.08) 0%, transparent 60%)',
        animation: 'oraclePulse 3s ease-in-out infinite',
      }} />

      <div className="relative max-w-2xl w-full px-4 flex flex-col items-center">
        {/* Popup image */}
        <div className="relative" style={{ animation: 'eventScaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <img
            src={imageSrc}
            alt="Oracle Special Event"
            className="max-w-full max-h-[60vh] object-contain drop-shadow-[0_0_30px_rgba(74,222,128,0.25)]"
            draggable={false}
          />
        </div>

        {/* ── STAGE 1: INTRO ───────────────────────────────────────── */}
        {stage === 'intro' && (
          <div className="mt-6 text-center px-4 max-w-lg" style={{ animation: 'eventFadeIn 1.2s ease-out 0.4s both' }}>
            <p className="text-emerald-300 text-sm sm:text-base leading-relaxed mb-2 italic">
              "Đêm đó, App ngoài hành tinh bỗng nổi giận. Một giọng nói lạnh lẽo vang lên:"
            </p>
            <p className="text-emerald-400 text-base sm:text-lg font-semibold mb-1" style={{ textShadow: '0 0 12px rgba(74,222,128,0.5)' }}>
              "Ta đang nghĩ đến một số từ 1 đến 10..."
            </p>
            <p className="text-white/60 text-xs sm:text-sm mb-4 italic">
              {isOracle
                ? `"Đoán đúng — bí mật của vũ trụ sẽ mở ra trước mắt ngươi.\nĐoán sai — cả làng sẽ săn lùng ngươi đến hơi thở cuối cùng."`
                : `"Nhà Tiên Tri đang đối mặt với thách thức tối thượng. Cả làng nín thở chờ đợi... Danh tính cô vẫn ẩn."`
              }
            </p>
            {isOracle ? (
              <button
                className="btn-primary text-sm px-6 py-2.5"
                onClick={() => setStage('picking')}
              >
                ⚡ Chấp nhận thách thức
              </button>
            ) : (
              <button
                className="btn-ghost text-sm px-6 py-2.5"
                onClick={() => setStage('picking')}
              >
                👁️ Quan sát
              </button>
            )}
          </div>
        )}

        {/* ── STAGE 2: PICKING NUMBER ──────────────────────────────── */}
        {stage === 'picking' && (
          <div className="mt-6 text-center px-4" style={{ animation: 'eventFadeIn 0.5s ease-out' }}>
            {isOracle ? (
              picked === null ? (
                <>
                  <p className="text-emerald-300 text-sm mb-3">Hãy chọn một số từ 1 đến 10:</p>
                  <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        className="aspect-square rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 text-lg font-bold hover:bg-emerald-500/25 hover:border-emerald-400 hover:scale-110 active:scale-95 transition-all"
                        style={{ textShadow: '0 0 8px rgba(74,222,128,0.5)' }}
                        onClick={() => handlePick(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/40 text-xs mt-3 italic">10% cơ hội đoán đúng. Hãy may mắn!</p>
                </>
              ) : (
                <div>
                  <p className="text-emerald-300 text-base mb-2">Bạn đã chọn:</p>
                  <div className="text-5xl font-bold text-emerald-400 mb-3" style={{ textShadow: '0 0 20px rgba(74,222,128,0.8)', animation: 'oraclePulse 1.5s ease-in-out infinite' }}>
                    {picked}
                  </div>
                  {result ? (
                    <p className="text-yellow-300/80 text-sm font-semibold" style={{ animation: 'eventFadeIn 0.5s ease-out' }}>
                      Vũ trụ đang phán xét...
                    </p>
                  ) : (
                    <p className="text-white/50 text-sm italic">Echo đang suy nghĩ...</p>
                  )}
                  <div className="mt-3 flex justify-center gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                        style={{ animation: `oracleDot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              // SPECTATOR MODE: just wait
              <div>
                {result ? (
                  <>
                    <p className="text-yellow-300/80 text-base font-semibold mb-2" style={{ animation: 'eventFadeIn 0.5s ease-out' }}>
                      Vũ trụ đang phán xét...
                    </p>
                    <p className="text-white/40 text-sm italic mb-3">Định mệnh sắp được phán quyết.</p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-300 text-base mb-2">
                      <strong className="text-emerald-200">Nhà Tiên Tri</strong> đang chọn số...
                    </p>
                    <p className="text-white/50 text-sm italic mb-3">Đừng can thiệp. Hãy chờ định mệnh phán xét.</p>
                  </>
                )}
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      style={{ animation: `oracleDot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 3: RESULT ──────────────────────────────────────── */}
        {stage === 'result' && result && (
          <div className="mt-6 text-center px-4 max-w-lg" style={{ animation: 'eventFadeIn 0.8s ease-out 0.3s both' }}>
            {result.correct ? (
              <>
                <p className="text-yellow-300 text-lg font-bold mb-1" style={{ textShadow: '0 0 14px rgba(253,224,71,0.6)' }}>
                  CHÍNH XÁC!
                </p>
                <p className="text-emerald-300 text-sm leading-relaxed mb-2 italic">
                  {isOracle
                    ? '"Ngươi đã đọc được tâm trí của ta. Một kẻ thật đặc biệt."'
                    : `"${oracleName || 'Oracle'} đã đoán đúng! Một thiên tài giữa loài người."`}
                </p>
                <p className="text-white/70 text-sm mb-4">
                  Bí mật của vũ trụ mở ra — <strong className="text-emerald-300">{isOracle ? 'Oracle thức suốt đêm, thấy mọi hành động!' : `${oracleName || 'Oracle'} sẽ thức suốt đêm và thấy mọi hành động.`}</strong>
                </p>
              </>
            ) : (
              <>
                <p className="text-wolf-400 text-lg font-bold mb-1" style={{ textShadow: '0 0 14px rgba(248,113,113,0.6)' }}>
                  SAI RỒI!
                </p>
                <p className="text-wolf-300 text-sm leading-relaxed mb-2 italic">
                  {isOracle
                    ? `"Ta nghĩ số ${result.secretNumber}. Ngươi đã chọc giận ta..."`
                    : `"Oracle đã đoán SAI! Tiếng vọng nổi giận — số đúng là ${result.secretNumber}. Nhưng danh tính Oracle vẫn ẩn..."`}
                </p>
                <p className="text-white/70 text-sm mb-2">
                  Mọi điều kiện thắng đã bị <strong className="text-wolf-400">HỦY BỎ</strong>.
                </p>
                <p className="text-yellow-300 text-sm font-semibold mb-4">
                  Mục tiêu mới: TÌM VÀ TIÊU DIỆT ORACLE!
                </p>
              </>
            )}
            <button
              className="btn-primary text-sm px-6 py-2.5"
              onClick={onClose}
            >
              Hiểu rồi
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes eventFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes eventScaleIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes oraclePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes oracleDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
