import React from "react";

type ProgressBarProps = {
  currExp: number;
  maxExp: number;
  bgColor?: string;
  overlayColor?: string;
  textColor?: string;
  type?: "default" | "togo";
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  currExp,
  maxExp,
  bgColor = "bg-orange-300",
  overlayColor = "bg-orange-700",
  textColor = "text-amber-950",
  type = "default",
}) => {
  const progressText =
    type === "default"
      ? `${currExp} / ${maxExp}`
      : `${maxExp - currExp} to go!`;

  return (
    <div
      className={`flex relative w-full ${bgColor} border-2 border-amber-600 rounded-lg items-center justify-center text-xl lg:text-md 2xl:text-xl`}
    >
      {/* Background overlay */}
      <div
        className={`absolute inset-0 z-0 h-full ${overlayColor} opacity-20`}
        style={{
          width: `${(currExp / maxExp) * 100}%`,
        }}
      ></div>

      {/* Progress */}
      <div className={`relative z-10 ${textColor} text-2xl`}>
        {progressText}
      </div>
    </div>
  );
};

export default ProgressBar;
