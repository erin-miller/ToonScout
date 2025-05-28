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
    <div
      className="h-52 transition-transform duration-500"
      style={{
        transformStyle: "preserve-3d",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        perspective: "1000px",
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
  );
};

export default CardFlip;
