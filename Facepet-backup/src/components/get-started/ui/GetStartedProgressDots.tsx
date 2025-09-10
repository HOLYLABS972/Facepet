import React from 'react';

interface GetStartedProgressDotsProps {
  numberOfDots: number; // Total number of dots
  currentDot: number; // The active dot index (0-based)
}

const GetStartedProgressDots: React.FC<GetStartedProgressDotsProps> = ({
  numberOfDots,
  currentDot
}) => {
  return (
    <div className="flex gap-2.5">
      {Array.from({ length: numberOfDots }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 rounded transition-all duration-300 ease-in-out ${
            index === currentDot ? 'bg-primary w-6' : 'w-1.5 bg-[#bbc5d4]'
          }`}
        />
      ))}
    </div>
  );
};

export default GetStartedProgressDots;
