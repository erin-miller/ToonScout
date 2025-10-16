import React from "react";
import { DamageInfo, AccuracyInfo, LURE_ROUNDS } from "@/app/utils/gagDamage";

export type GagTooltipProps = {
  track: string;
  gagLevel: number;
  damageInfo: DamageInfo | null;
  baseDamageInfo: DamageInfo | null;
  accuracyInfo: AccuracyInfo | null;
  isOrganic: boolean;
  isHovered: boolean;
  isRightmost: boolean;
};

const GagTooltip: React.FC<GagTooltipProps> = ({
  track,
  gagLevel,
  damageInfo,
  baseDamageInfo,
  accuracyInfo,
  isOrganic,
  isHovered,
  isRightmost,
}) => {
  const tooltipPositionClass = isRightmost ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div
      className={`absolute bottom-full ${tooltipPositionClass} mb-2 bg-gray-900 text-white text-sm font-bold rounded px-3 py-2 whitespace-nowrap`}
      style={{
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'opacity 0.2s, visibility 0.2s'
      }}
    >
      {track === "Lure" ? (
        <div className="flex flex-col gap-1">
          <div>
            ROUNDS LURED: {isOrganic ? LURE_ROUNDS[gagLevel - 1] + 1 : LURE_ROUNDS[gagLevel - 1]}
            {isOrganic && (
              <> ({LURE_ROUNDS[gagLevel - 1]} + 1)</>
            )}
          </div>
          {accuracyInfo && (
            <div className="text-xs font-normal">
              Accuracy: {accuracyInfo.organic ?? accuracyInfo.base}%
              {accuracyInfo.organic && accuracyInfo.organic !== accuracyInfo.base && (
                <> ({accuracyInfo.base}% + {accuracyInfo.organic - accuracyInfo.base}%)</>
              )}
            </div>
          )}
        </div>
      ) : damageInfo ? (
        <div className="flex flex-col gap-1">
          <div>
            {track === "Toon-Up" ? "HEALING: " : "DAMAGE: "}
            {isOrganic && baseDamageInfo ? (
              <>{damageInfo.value} ({baseDamageInfo.value} + {damageInfo.value - baseDamageInfo.value})</>
            ) : (
              <>{damageInfo.value}</>
            )}
          </div>
          {accuracyInfo && (
            <div className="text-xs font-normal">
              Accuracy: {accuracyInfo.organic ?? accuracyInfo.base}%
              {accuracyInfo.organic && accuracyInfo.organic !== accuracyInfo.base && (
                <> ({accuracyInfo.base}% + {accuracyInfo.organic - accuracyInfo.base}%)</>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>Level {gagLevel} {track}</div>
      )}
      <div
        className={`absolute top-full ${isRightmost ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgb(17, 24, 39)'
        }}
      ></div>
    </div>
  );
};

export default GagTooltip;
