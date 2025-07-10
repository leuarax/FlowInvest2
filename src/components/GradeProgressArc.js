import React from "react";

// Map grades to progress (0 = F, 1 = A+)
const gradeToProgress = {
  "F": 0,
  "D-": 0.1,
  "D": 0.2,
  "D+": 0.25,
  "C-": 0.3,
  "C": 0.4,
  "C+": 0.45,
  "B-": 0.5,
  "B": 0.6,
  "B+": 0.7,
  "A-": 0.8,
  "A": 0.9,
  "A+": 1,
};

function getProgress(grade) {
  return gradeToProgress[grade] ?? 0;
}

// Grade color utility (copied from Dashboard.js)
const getGradeColor = (grade) => {
  if (!grade) return '#64748b';
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A')) return '#10b981';
  if (upperGrade.startsWith('B')) return '#f59e0b';
  if (upperGrade.startsWith('C')) return '#f97316';
  if (upperGrade.startsWith('D')) return '#ef4444';
  if (upperGrade.startsWith('F')) return '#dc2626';
  return '#64748b';
};

const RADIUS = 40;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * 0.75; // 270 degrees
const ARC_OFFSET = CIRCUMFERENCE * 0.125; // Start at -135deg (bottom left)

export default function GradeProgressArc({ grade = "C", size = 100 }) {
  const progress = getProgress(grade);
  const dashArray = `${ARC_LENGTH} ${CIRCUMFERENCE}`;
  const dashOffset = ARC_LENGTH * (1 - progress) + ARC_OFFSET;
  const color = getGradeColor(grade);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Background arc */}
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke="#eee"
        strokeWidth={STROKE}
        strokeDasharray={dashArray}
        strokeDashoffset={ARC_OFFSET}
        strokeLinecap="round"
        transform="rotate(-202.5 50 50)"
      />
      {/* Progress arc */}
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-202.5 50 50)"
      />
      {/* Grade letter */}
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="2.5em"
        fontWeight="bold"
        fill={color}
        dominantBaseline="middle"
      >
        {grade}
      </text>
    </svg>
  );
} 