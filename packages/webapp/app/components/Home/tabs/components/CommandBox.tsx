import React from "react";

interface CommandBoxProps {
  command: {
    title: string;
    description: string;
    color: string;
  };
}

const CommandBox: React.FC<CommandBoxProps> = ({ command }) => {
  const cmdText = `text-${command.color}`;
  const cmdBorder = `border-${command.color}`;

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-1200 p-4 md:p-6 rounded-xl shadow-md ${cmdBorder}`}
    >
      <h3
        className={`text-2xl font-semibold font-impress mb-2 md:mb-2 ${cmdText}`}
      >
        {command.title}
      </h3>
      <p className="text-lg text-gray-800 dark:text-gray-400 font-impress mb-2">
        {command.description}
      </p>
    </div>
  );
};

export default CommandBox;
