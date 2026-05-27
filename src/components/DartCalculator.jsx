import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, Check } from 'lucide-react';

const ALL_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20
];

// Returns row-specific config controlling calculator UI
const getRowConfig = (rowIndex) => {
  const numTargetMap = { 1: 20, 3: 19, 5: 18, 7: 17, 9: 16, 11: 15 };
  // Numeric target rows: number is fixed (from row label), pick multiplier directly
  if (numTargetMap[rowIndex]) {
    return {
      mode: 'fixed-target',
      target: numTargetMap[rowIndex],
      multipliers: ['single', 'double', 'triple'],
      showBulls: false,
      hint: `Only ${numTargetMap[rowIndex]}s count`
    };
  }
  if (rowIndex === 2) {
    return {
      mode: 'multiplier-locked',
      numbers: ALL_NUMBERS,
      multipliers: ['double'],
      showBulls: false,
      hint: 'Any double counts'
    };
  }
  if (rowIndex === 4) {
    return {
      mode: 'multiplier-locked',
      numbers: ALL_NUMBERS,
      multipliers: ['triple'],
      showBulls: false,
      hint: 'Any triple counts'
    };
  }
  if (rowIndex === 6) {
    return {
      mode: 'open',
      numbers: ALL_NUMBERS,
      multipliers: ['single', 'double', 'triple'],
      showBulls: true,
      hint: '3 darts must total exactly 51'
    };
  }
  if (rowIndex === 8) {
    return {
      mode: 'open',
      numbers: ALL_NUMBERS,
      multipliers: ['single', 'double', 'triple'],
      showBulls: true,
      hint: 'All 3 darts must be same colour'
    };
  }
  if (rowIndex === 10) {
    return {
      mode: 'open',
      numbers: ALL_NUMBERS,
      multipliers: ['single', 'double', 'triple'],
      showBulls: true,
      hint: 'All 3 darts must be 3 different colours'
    };
  }
  if (rowIndex === 12) {
    return {
      mode: 'bulls-only',
      numbers: [],
      multipliers: [],
      showBulls: true,
      hint: 'Only bulls count'
    };
  }
  return {
    mode: 'open',
    numbers: ALL_NUMBERS,
    multipliers: ['single', 'double', 'triple'],
    showBulls: true,
    hint: ''
  };
};

const MULTIPLIER_INFO = {
  single: { value: 1, label: 'Single' },
  double: { value: 2, label: 'Double' },
  triple: { value: 3, label: 'Triple' }
};

const DartCalculator = ({ rowIndex, rowLabel, onClose, onSubmit, onMiss }) => {
  const config = getRowConfig(rowIndex);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [darts, setDarts] = useState([]);
  const [showMultiplier, setShowMultiplier] = useState(false);

  const addDart = (dart) => {
    if (darts.length >= 3) return;
    setDarts([...darts, dart]);
    setShowMultiplier(false);
    setSelectedNumber(null);
  };

  const handleNumberClick = (number) => {
    if (darts.length >= 3) return;
    setSelectedNumber(number);
    // For multiplier-locked rows (DBL/TPL), auto-apply the locked multiplier
    if (config.multipliers.length === 1) {
      const mKey = config.multipliers[0];
      const m = MULTIPLIER_INFO[mKey];
      addDart({ display: `${m.label} ${number}`, score: number * m.value });
      return;
    }
    setShowMultiplier(true);
  };

  const handleBullClick = (type) => {
    if (darts.length >= 3) return;
    const score = type === 'green' ? 25 : 50;
    const label = type === 'green' ? 'Green Bull' : 'Red Bull';
    addDart({ display: label, score });
  };

  const handleMultiplierClick = (mKey) => {
    if (darts.length >= 3) return;
    const m = MULTIPLIER_INFO[mKey];
    let target = selectedNumber;
    if (config.mode === 'fixed-target') target = config.target;
    if (target == null) return;
    addDart({ display: `${m.label} ${target}`, score: target * m.value });
  };

  // Per-dart miss: this single dart scored 0 (continue to next dart)
  const handleDartMiss = () => {
    if (darts.length >= 3) return;
    addDart({ display: 'Miss (0)', score: 0 });
  };

  const handleBack = () => {
    if (showMultiplier) {
      setShowMultiplier(false);
      setSelectedNumber(null);
    } else if (darts.length > 0) {
      setDarts(darts.slice(0, -1));
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    const total = darts.reduce((sum, dart) => sum + dart.score, 0);
    onSubmit(total);
  };

  const totalScore = darts.reduce((sum, dart) => sum + dart.score, 0);
  const dartsComplete = darts.length === 3;
  const disabled = darts.length >= 3;

  // Decide what panel to show
  // - fixed-target rows skip number selection and go straight to multipliers
  // - other rows show numbers, then multipliers
  const showMultiplierPanel = config.mode === 'fixed-target' || showMultiplier;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-start justify-center p-3 overflow-y-auto">
      <div className="bg-[#121212] border border-[#262626] w-full max-w-md mt-4 mb-4">
        <div className="sticky top-0 bg-[#121212] border-b border-[#262626] p-3 flex items-center justify-between z-10">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#262626] h-9 w-9"
            data-testid="calc-back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex flex-col items-center">
            <h2
              className="text-lg font-black tracking-tighter uppercase text-white leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {rowLabel ? `ROW: ${rowLabel}` : 'DART CALCULATOR'}
            </h2>
            {config.hint && (
              <span className="text-[10px] tracking-wider text-[#A1A1AA] mt-0.5 uppercase">
                {config.hint}
              </span>
            )}
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#262626] h-9 w-9"
            data-testid="calc-close-btn"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="bg-[#0A0A0A] border border-[#262626] p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs tracking-wider uppercase text-[#A1A1AA] font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                DARTS: {darts.length}/3
              </span>
              <span className="text-3xl font-black text-[#007AFF]" style={{ fontFamily: "'IBM Plex Mono', monospace" }} data-testid="calc-running-total">
                {totalScore}
              </span>
            </div>

            <div className="space-y-1 min-h-[60px]">
              {[0, 1, 2].map((index) => {
                const dart = darts[index];
                return (
                  <div key={index} className="flex items-center justify-between text-sm border-b border-[#1A1A1A] py-1">
                    <span className="text-[#A1A1AA] text-xs" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      DART {index + 1}
                    </span>
                    {dart ? (
                      <div className="flex items-center gap-3" data-testid={`calc-dart-${index}`}>
                        <span className="text-white text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {dart.display}
                        </span>
                        <span className="text-[#007AFF] font-bold w-10 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          +{dart.score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#404040] text-xs italic">waiting...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {dartsComplete ? (
            <Button
              onClick={handleSubmit}
              className="w-full h-14 bg-[#007AFF] hover:bg-[#0066DD] text-white rounded-sm font-bold text-lg"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="calc-submit-btn"
            >
              <Check className="h-5 w-5 mr-2" />
              SUBMIT {totalScore} POINTS
            </Button>
          ) : showMultiplierPanel ? (
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#A1A1AA] mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {config.mode === 'fixed-target'
                  ? `PICK MULTIPLIER FOR ${config.target}`
                  : `MULTIPLIER FOR ${selectedNumber}`}
              </h3>

              <div className="space-y-2 mb-3">
                {config.multipliers.includes('single') && (
                  <Button
                    onClick={() => handleMultiplierClick('single')}
                    disabled={disabled}
                    className="w-full h-14 bg-[#1A1A1A] hover:bg-[#007AFF] text-white border border-[#262626] rounded-sm font-bold text-base disabled:opacity-30"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    data-testid="calc-single"
                  >
                    SINGLE = {(config.mode === 'fixed-target' ? config.target : selectedNumber)}
                  </Button>
                )}

                {config.multipliers.includes('double') && (
                  <Button
                    onClick={() => handleMultiplierClick('double')}
                    disabled={disabled}
                    className="w-full h-14 bg-[#1A1A1A] hover:bg-[#007AFF] text-white border border-[#262626] rounded-sm font-bold text-base disabled:opacity-30"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    data-testid="calc-double"
                  >
                    DOUBLE = {((config.mode === 'fixed-target' ? config.target : selectedNumber)) * 2}
                  </Button>
                )}

                {config.multipliers.includes('triple') && (
                  <Button
                    onClick={() => handleMultiplierClick('triple')}
                    disabled={disabled}
                    className="w-full h-14 bg-[#1A1A1A] hover:bg-[#007AFF] text-white border border-[#262626] rounded-sm font-bold text-base disabled:opacity-30"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    data-testid="calc-triple"
                  >
                    TRIPLE = {((config.mode === 'fixed-target' ? config.target : selectedNumber)) * 3}
                  </Button>
                )}
              </div>

              <Button
                onClick={handleDartMiss}
                disabled={disabled}
                className="w-full h-12 bg-[#1A1A1A] hover:bg-[#262626] text-[#A1A1AA] border border-[#262626] rounded-sm font-bold text-sm mb-2 disabled:opacity-30"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                data-testid="calc-miss-dart-btn"
              >
                MISS (+0 FOR THIS DART)
              </Button>

              <Button
                onClick={onMiss}
                className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white rounded-sm font-bold text-sm"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                data-testid="calc-miss-btn"
              >
                ALL DARTS MISSED (HALVE SCORE)
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#A1A1AA] mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {config.mode === 'bulls-only' ? 'SELECT BULL' : 'SELECT NUMBER'}
              </h3>

              {config.numbers.length > 0 && (
                <div className="grid gap-1.5 mb-3 grid-cols-5">
                  {config.numbers.map((num) => (
                    <Button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      disabled={disabled}
                      className="h-12 bg-[#1A1A1A] hover:bg-[#007AFF] active:bg-[#007AFF] text-white border border-[#262626] rounded-sm font-bold text-base p-0 disabled:opacity-30"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      data-testid={`calc-num-${num}`}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              )}

              {config.showBulls && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    onClick={() => handleBullClick('green')}
                    disabled={disabled}
                    className="h-12 bg-[#1A7A1A] hover:bg-[#1A9A1A] text-white rounded-sm font-bold text-sm disabled:opacity-30"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    data-testid="calc-green-bull"
                  >
                    GREEN BULL (25)
                  </Button>

                  <Button
                    onClick={() => handleBullClick('red')}
                    disabled={disabled}
                    className="h-12 bg-[#AA1A1A] hover:bg-[#CC2A2A] text-white rounded-sm font-bold text-sm disabled:opacity-30"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    data-testid="calc-red-bull"
                  >
                    RED BULL (50)
                  </Button>
                </div>
              )}

              <Button
                onClick={handleDartMiss}
                disabled={disabled}
                className="w-full h-12 bg-[#1A1A1A] hover:bg-[#262626] text-[#A1A1AA] border border-[#262626] rounded-sm font-bold text-sm mb-2 disabled:opacity-30"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                data-testid="calc-miss-dart-btn"
              >
                MISS (+0 FOR THIS DART)
              </Button>

              <Button
                onClick={onMiss}
                className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white rounded-sm font-bold text-sm"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                data-testid="calc-miss-btn"
              >
                ALL DARTS MISSED (HALVE SCORE)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DartCalculator;
