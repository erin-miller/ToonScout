import React from "react";

interface CardFlipProps {
  cardFront: React.ReactNode;
  cardBack: React.ReactNode;
  isFlipped: boolean;
}

const CardFlip: React.FC<CardFlipProps> = ({
  cardFront,
  cardBack,
  isFlipped,
}) => {
  return (
    <div style={{ perspective: "1000px" }} className="test-outline h-full">
      <div
        className="relative h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* front */}
        <div
          className="absolute h-full w-full"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          {cardFront}
        </div>

        {/* back */}
        <div
          className="absolute h-full w-full"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {cardBack}
        </div>
      </div>
    </div>
  );
};

export default CardFlip;
