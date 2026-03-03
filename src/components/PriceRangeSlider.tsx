import { useCallback, useEffect, useState, useRef } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const PriceRangeSlider = ({ min, max, value, onChange }: PriceRangeSliderProps) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  const handleChangeMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(v);
    minValRef.current = v;
    onChange([v, maxVal]);
  };

  const handleChangeMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(v);
    maxValRef.current = v;
    onChange([minVal, v]);
  };

  const getPercent = useCallback(
    (value: number) => {
      if (max === min) return 0;
      return Math.round(((value - min) / (max - min)) * 100);
    },
    [min, max]
  );
  
  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  const thumbClass = "pointer-events-none absolute h-1 w-full appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-200 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

  return (
    <div className="relative flex w-full items-center h-4">
      <div className="absolute w-full h-1.5 rounded-full bg-zinc-600/50"></div>
      <div
        className="absolute h-1.5 rounded-full bg-zinc-400"
        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
      ></div>

      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={handleChangeMin}
        className={thumbClass + ` z-10 ${minVal > max - 10 ? 'z-30' : ''}`}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={handleChangeMax}
        className={thumbClass + " z-20"}
      />
    </div>
  );
};

export default PriceRangeSlider;
