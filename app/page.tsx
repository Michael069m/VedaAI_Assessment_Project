"use client";

import React, { useState, useRef } from "react";
import {
  ExtractedQuestion,
  ExtractedAnswer,
  QuestionAnswerMapping,
  GradingResult,
} from "@/types/assessment";
import { boundingBoxToStyle } from "@/lib/geometry";
import QuestionList from "@/components/QuestionList";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
type AppState = "upload" | "processing" | "results";
type MobileTab = "questions" | "sheet";
type ViewerMode = "questionPaper" | "answerSheet";

interface SessionState {
  sessionId: string;
  questionPaperPages: string[];
  answerSheetPages: string[];
  questions: ExtractedQuestion[];
  answers: ExtractedAnswer[];
  mappings: QuestionAnswerMapping[];
  grading: GradingResult[];
}

/* ─────────────────────────────────────────────────────────
   Icons (inline SVG to avoid extra dependencies)
───────────────────────────────────────────────────────── */
function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9CA3AF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#F97316" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ClassroomIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#F97316" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function AssignmentIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#F97316" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}

function ExamIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#F97316" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function LibraryIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#F97316" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   VedaAI Logo
───────────────────────────────────────────────────────── */
function VedaLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="bg-black rounded-xl flex-shrink-0 flex items-center justify-center"
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M10 1L2 5.5V14.5L10 19L18 14.5V5.5L10 1Z"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <path
          d="M6 7L10 15L14 7"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Teacher Avatar
───────────────────────────────────────────────────────── */
function TeacherAvatar() {
  return (
    <div className="relative mx-auto" style={{ width: 120, height: 120 }}>
      {/* Glow rings */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, #FED7AA 0%, #FFF7ED 55%, transparent 75%)",
        }}
      />
      {/* Avatar circle */}
      <div
        className="absolute inset-3 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: "#FFF7ED",
          border: "3px solid white",
          boxShadow: "0 4px 20px rgba(249,115,22,0.2)",
        }}
      >
        <svg viewBox="0 0 80 96" width="72" height="72" fill="none">
          {/* Body / shirt */}
          <rect x="15" y="62" width="50" height="34" rx="4" fill="#F97316" />
          {/* Collar */}
          <path d="M30 62 L40 75 L50 62" fill="#EA580C" />
          {/* Head */}
          <circle cx="40" cy="40" r="20" fill="#FDDCB5" />
          {/* Hair */}
          <path
            d="M20 36 Q22 14 40 16 Q58 14 60 36 Q58 22 40 22 Q22 22 20 36Z"
            fill="#7C3AED"
          />
          {/* Eyes */}
          <ellipse cx="34" cy="40" rx="2.5" ry="3" fill="#4B2D1A" />
          <ellipse cx="46" cy="40" rx="2.5" ry="3" fill="#4B2D1A" />
          {/* Eye shine */}
          <circle cx="35" cy="39" r="0.8" fill="white" />
          <circle cx="47" cy="39" r="0.8" fill="white" />
          {/* Smile */}
          <path
            d="M34 50 Q40 55 46 50"
            stroke="#C2855A"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Books held */}
          <rect
            x="54"
            y="66"
            width="12"
            height="16"
            rx="1.5"
            fill="white"
            opacity="0.9"
          />
          <rect
            x="52"
            y="69"
            width="12"
            height="16"
            rx="1.5"
            fill="#E0E7FF"
            opacity="0.7"
          />
        </svg>
      </div>
      {/* Decorative dots */}
      <div
        className="animate-pulse-dot absolute top-3 right-5 w-2.5 h-2.5 rounded-full"
        style={{ background: "#F97316", opacity: 0.6 }}
      />
      <div
        className="animate-pulse-dot absolute bottom-4 left-4 w-2 h-2 rounded-full"
        style={{ background: "#FDBA74", opacity: 0.7, animationDelay: "0.5s" }}
      />
      <div
        className="animate-pulse-dot absolute top-10 left-0 w-1.5 h-1.5 rounded-full"
        style={{ background: "#FED7AA", opacity: 0.8, animationDelay: "1s" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sparkle Loading Animation
───────────────────────────────────────────────────────── */
function SparkleLoader() {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 100, height: 100 }}
    >
      {/* Large center star */}
      <svg
        className="animate-sparkle-1 absolute"
        style={{ top: "10%", left: "50%", transform: "translateX(-50%)" }}
        width="52"
        height="52"
        viewBox="0 0 52 52"
      >
        <path
          d="M26 0L29.5 22.5L52 26L29.5 29.5L26 52L22.5 29.5L0 26L22.5 22.5L26 0Z"
          fill="#F97316"
        />
      </svg>
      {/* Small star top-right */}
      <svg
        className="animate-sparkle-2 absolute"
        style={{ top: 0, right: 0 }}
        width="26"
        height="26"
        viewBox="0 0 26 26"
      >
        <path
          d="M13 0L14.8 11.2L26 13L14.8 14.8L13 26L11.2 14.8L0 13L11.2 11.2L13 0Z"
          fill="#FB923C"
        />
      </svg>
      {/* Tiny star bottom-left */}
      <svg
        className="animate-sparkle-3 absolute"
        style={{ bottom: 8, left: 2 }}
        width="18"
        height="18"
        viewBox="0 0 18 18"
      >
        <path
          d="M9 0L10.2 7.8L18 9L10.2 10.2L9 18L7.8 10.2L0 9L7.8 7.8L9 0Z"
          fill="#FDBA74"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sidebar Navigation
───────────────────────────────────────────────────────── */
function Sidebar({ collapsed }: { collapsed: boolean }) {
  const w = collapsed ? 56 : 176;
  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 bg-white border-r border-gray-100 transition-all duration-300 overflow-hidden"
      style={{ width: w }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-gray-50">
        <VedaLogo size={32} />
        {!collapsed && (
          <span className="font-bold text-base text-gray-900 whitespace-nowrap">
            VedaAI
          </span>
        )}
      </div>

      {/* AI Teacher's Toolkit */}
      {!collapsed && (
        <div className="px-2.5 pt-3 pb-1">
          <button
            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold whitespace-nowrap"
            style={{ background: "#F97316" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 0L6.9 5.1L12 6L6.9 6.9L6 12L5.1 6.9L0 6L5.1 5.1L6 0Z"
                fill="white"
              />
            </svg>
            AI Teacher&apos;s Toolkit
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {[
          { label: "Home", Icon: HomeIcon, active: false },
          { label: "My Classroom", Icon: ClassroomIcon, active: false },
          { label: "Assignments", Icon: AssignmentIcon, active: false },
          { label: "Exams", Icon: ExamIcon, active: true },
          { label: "My Library", Icon: LibraryIcon, active: false },
        ].map(({ label, Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              active
                ? "bg-orange-50 text-orange-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Icon active={active} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom: Settings + User */}
      {!collapsed && (
        <div className="border-t border-gray-100 p-2.5 space-y-1">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: "#F97316" }}
            >
              D
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">
                Delhi Public School
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                Bokaro Steel City
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
   Top breadcrumb bar (desktop)
───────────────────────────────────────────────────────── */
function DesktopTopBar({
  onReset,
  showReset,
}: {
  onReset: () => void;
  showReset: boolean;
}) {
  return (
    <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-white border-b border-[#E8E8EC] flex-shrink-0 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button className="text-gray-400 hover:text-gray-600">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-gray-600 text-sm font-medium">Exams</span>
      </div>
      <div className="flex items-center gap-3">
        {showReset && (
          <button
            onClick={onReset}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 border border-[#E5E7EB] rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            ← New Session
          </button>
        )}
        <button className="text-gray-400 hover:text-gray-600">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        </button>
        <button className="text-gray-400 hover:text-gray-600 relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
        </button>
        <button className="w-5 h-5 text-orange-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 0L9 7L16 8L9 9L8 16L7 9L0 8L7 7L8 0Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
            M
          </div>
          <span>Madhur Rastogi</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Mobile Top Header
───────────────────────────────────────────────────────── */
function MobileHeader({
  onReset,
  showReset,
}: {
  onReset: () => void;
  showReset: boolean;
}) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8E8EC] flex-shrink-0">
      <div className="flex items-center gap-2">
        <button className="text-gray-500 mr-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <VedaLogo size={26} />
        <span className="font-bold text-base text-gray-900">VedaAI</span>
      </div>
      <div className="flex items-center gap-2">
        {showReset && (
          <button
            onClick={onReset}
            className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1"
          >
            New
          </button>
        )}
        <button className="relative text-gray-400">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
        </button>
        <button className="text-gray-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
        <button className="text-gray-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Upload Drop Zone Card
───────────────────────────────────────────────────────── */
function UploadCard({
  label,
  colorLabel,
  file,
  dragging,
  inputRef,
  onAreaClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  onRemove,
}: {
  label: string;
  colorLabel: string;
  file: File | null;
  dragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onAreaClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div
      onClick={() => !file && onAreaClick()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="bg-white rounded-2xl border-2 border-dashed transition-all"
      style={{
        borderColor: dragging ? "#F97316" : file ? "#E5E7EB" : "#E5E7EB",
        background: dragging ? "#FFF7ED" : "white",
        cursor: file ? "default" : "pointer",
        minHeight: 120,
      }}
    >
      <input
        type="file"
        ref={inputRef}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onInputChange}
      />

      {file ? (
        /* Filled state */
        <div className="flex items-center gap-3 p-4">
          {/* PDF icon */}
          <div
            className="flex-shrink-0 w-10 h-12 rounded flex items-center justify-center"
            style={{ background: "#EF4444" }}
          >
            <span className="text-white text-[10px] font-bold">PDF</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatSize(file.size)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            style={{ fontSize: 12 }}
          >
            ✕
          </button>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center text-center py-8 px-4">
          <UploadIcon />
          <p className="mt-2.5 text-sm font-semibold text-gray-700">
            {label} <span style={{ color: "#F97316" }}>{colorLabel}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Document Viewer Panel
───────────────────────────────────────────────────────── */
function DocumentViewer({
  pages,
  answers,
  selectedAnswerId,
  selectedPage,
  setSelectedPage,
  zoom,
  setZoom,
  mode,
  onModeChange,
}: {
  pages: string[];
  answers: ExtractedAnswer[];
  selectedAnswerId: string | null;
  selectedPage: number;
  setSelectedPage: (p: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
}) {
  const isQuestionPaper = mode === "questionPaper";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F3F4F6]">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2F3137] border-b border-[#26282D] flex-shrink-0 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white/80 hidden md:block">
            {isQuestionPaper ? "Question Paper" : "Answer Sheet"}
          </span>
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => onModeChange("questionPaper")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                isQuestionPaper
                  ? "bg-white text-[#111827]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Question Paper
            </button>
            <button
              type="button"
              onClick={() => onModeChange("answerSheet")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                !isQuestionPaper
                  ? "bg-white text-[#111827]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Answer Sheet
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Zoom */}
          <div className="flex items-center gap-1 text-xs text-white/70">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 font-bold"
            >
              −
            </button>
            <span className="w-10 text-center font-medium text-white">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 font-bold"
            >
              +
            </button>
          </div>
          {/* Page navigation */}
          <div className="flex items-center gap-1 text-xs text-white/70">
            <button
              onClick={() => setSelectedPage(Math.max(1, selectedPage - 1))}
              disabled={selectedPage <= 1}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30 font-bold"
            >
              ‹
            </button>
            <span className="font-medium whitespace-nowrap text-white">
              Page {selectedPage} of {pages.length}
            </span>
            <button
              onClick={() =>
                setSelectedPage(Math.min(pages.length, selectedPage + 1))
              }
              disabled={selectedPage >= pages.length}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30 font-bold"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Image canvas */}
      <div
        className="flex-1 overflow-auto p-4"
        style={{ background: "#F3F4F6" }}
      >
        {pages[selectedPage - 1] ? (
          <div
            className="relative inline-block rounded-xl bg-white shadow-[0_16px_34px_rgba(15,23,42,0.10)] overflow-hidden"
            style={{
              transformOrigin: "top left",
              transform: `scale(${zoom / 100})`,
              width: `${10000 / zoom}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 page previews are rendered from uploaded files */}
            <img
              src={pages[selectedPage - 1]}
              alt={`Answer Sheet Page ${selectedPage}`}
              className="w-full"
              style={{ display: "block" }}
            />
            {/* Bounding box overlays */}
            {!isQuestionPaper &&
              answers.flatMap((ans) =>
                ans.boundingBoxes
                  .filter((box) => box.page === selectedPage)
                  .map((box, bIdx) => {
                    const isSelected = selectedAnswerId === ans.id;
                    const style = boundingBoxToStyle(box);
                    return (
                      <div
                        key={`${ans.id}-${bIdx}`}
                        className="rounded transition-all"
                        style={{
                          ...style,
                          position: "absolute",
                          border: `2px solid ${isSelected ? "#F97316" : "#0D9488"}`,
                          background: isSelected
                            ? "rgba(249,115,22,0.08)"
                            : "rgba(13,148,136,0.06)",
                          zIndex: isSelected ? 20 : 10,
                        }}
                      >
                        <span
                          className="absolute -top-6 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm"
                          style={{
                            background: isSelected ? "#F97316" : "#0D9488",
                          }}
                        >
                          {ans.detectedQuestionNumber
                            ? `Q${ans.detectedQuestionNumber}`
                            : ans.id}
                        </span>
                      </div>
                    );
                  }),
              )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No page image available
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────────────────── */
export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [answerSheetFile, setAnswerSheetFile] = useState<File | null>(null);
  const [qpDragging, setQpDragging] = useState(false);
  const [asDragging, setAsDragging] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState("Starting...");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [selectedPage, setSelectedPage] = useState(1);
  const [mobileTab, setMobileTab] = useState<MobileTab>("questions");
  const [viewerMode, setViewerMode] = useState<ViewerMode>("answerSheet");
  const [zoom, setZoom] = useState(100);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const asInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    file: File | undefined,
    setter: (f: File | null) => void,
  ) => {
    if (!file) return;
    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (
      !validTypes.includes(file.type) &&
      !/\.(pdf|png|jpg|jpeg|webp)$/i.test(file.name)
    ) {
      setError(
        "Invalid file type. Only PDF, PNG, and JPG files are supported.",
      );
      return;
    }
    setError(null);
    setter(file);
  };

  const handleStartMapping = async () => {
    if (!questionPaperFile || !answerSheetFile) return;
    setAppState("processing");
    setError(null);

    try {
      // Step 1: Upload & rasterize
      setProcessingLabel("Uploading files...");
      const formData = new FormData();
      formData.append("questionPaper", questionPaperFile);
      formData.append("studentAnswerSheet", answerSheetFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed.");
      const { sessionId } = uploadData;

      // Step 2: Extract questions
      setProcessingLabel("Extracting questions from paper...");
      const qRes = await fetch("/api/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const qData = await qRes.json();
      if (!qRes.ok)
        throw new Error(qData.error || "Question extraction failed.");

      // Step 3: Extract answers
      setProcessingLabel("Extracting student answers...");
      const aRes = await fetch("/api/extract-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const aData = await aRes.json();
      if (!aRes.ok) throw new Error(aData.error || "Answer extraction failed.");

      // Step 4: Map
      setProcessingLabel("Mapping questions to answers...");
      const mRes = await fetch("/api/map-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const mData = await mRes.json();
      if (!mRes.ok) throw new Error(mData.error || "Mapping failed.");

      // Step 5: Grade
      setProcessingLabel("Grading with AI...");
      const gRes = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const gData = await gRes.json();
      if (!gRes.ok) throw new Error(gData.error || "Grading failed.");

      // Fetch full session state
      setProcessingLabel("Finalizing results...");
      const sessionRes = await fetch(`/api/session/${sessionId}`);
      if (!sessionRes.ok) {
        // Session endpoint may not exist yet — build from individual responses
        const built: SessionState = {
          sessionId,
          questionPaperPages: uploadData.questionPaperPages ?? [],
          answerSheetPages: uploadData.answerSheetPages ?? [],
          questions: qData.questions ?? [],
          answers: aData.answers ?? [],
          mappings: mData.mappings ?? [],
          grading: gData.grading ?? [],
        };
        setSession(built);
        if (built.questions.length > 0)
          setSelectedQuestionId(built.questions[0].id);
      } else {
        const sessionData = await sessionRes.json();
        const s: SessionState = sessionData.session ?? {
          sessionId,
          questionPaperPages: uploadData.questionPaperPages ?? [],
          answerSheetPages: uploadData.answerSheetPages ?? [],
          questions: qData.questions ?? [],
          answers: aData.answers ?? [],
          mappings: mData.mappings ?? [],
          grading: gData.grading ?? [],
        };
        setSession(s);
        if (s.questions.length > 0) setSelectedQuestionId(s.questions[0].id);
      }

      setAppState("results");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setAppState("upload");
    }
  };

  const resetAll = () => {
    setAppState("upload");
    setQuestionPaperFile(null);
    setAnswerSheetFile(null);
    setSession(null);
    setError(null);
    setSelectedQuestionId(null);
    setSelectedPage(1);
    setViewerMode("answerSheet");
    setZoom(100);
  };

  /* ── Derived: which answer is highlighted in the viewer ── */
  const selectedMapping = session?.mappings.find(
    (m) => m.questionId === selectedQuestionId && m.status === "matched",
  );
  const selectedAnswer = selectedMapping
    ? (session?.answers.find((a) => a.id === selectedMapping.answerId) ?? null)
    : null;

  const clampPage = (page: number, mode: ViewerMode): number => {
    const maxPages =
      mode === "questionPaper"
        ? (session?.questionPaperPages.length ?? 1)
        : (session?.answerSheetPages.length ?? 1);

    return Math.max(1, Math.min(page, maxPages));
  };

  const handleChangeViewerMode = (mode: ViewerMode) => {
    setViewerMode(mode);
    setSelectedPage((currentPage) => clampPage(currentPage, mode));
  };

  const handleSelectQuestion = (qId: string) => {
    const question = session?.questions.find((item) => item.id === qId) ?? null;
    setSelectedQuestionId(qId);
    if (question) {
      const matchedMapping = session?.mappings.find(
        (mapping) => mapping.questionId === qId && mapping.status === "matched",
      );
      const matchedAnswer = matchedMapping
        ? (session?.answers.find(
            (answer) => answer.id === matchedMapping.answerId,
          ) ?? null)
        : null;

      setViewerMode("answerSheet");
      setSelectedPage(
        matchedAnswer?.boundingBoxes[0]?.page ??
          clampPage(question.page, "questionPaper"),
      );
    }
  };

  const activePages =
    viewerMode === "questionPaper"
      ? (session?.questionPaperPages ?? [])
      : (session?.answerSheetPages ?? []);

  const isProcessing = appState === "processing";
  const isResults = appState === "results";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#F3F4F6", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ─── Sidebar ─── */}
      <Sidebar collapsed={isProcessing} />

      {/* ─── Main area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bars */}
        <MobileHeader onReset={resetAll} showReset={isResults} />
        <DesktopTopBar onReset={resetAll} showReset={isResults} />

        {/* Error banner */}
        {error && (
          <div
            className="mx-4 mt-3 flex-shrink-0 p-3 rounded-xl flex items-center justify-between gap-3 text-sm"
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="font-bold text-red-400 hover:text-red-600 text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* ══════════════ UPLOAD SCREEN ══════════════ */}
        {appState === "upload" && (
          <div className="flex-1 overflow-auto flex flex-col items-center justify-center px-5 py-10">
            {/* Heading */}
            <h1 className="text-2xl md:text-[28px] font-extrabold text-gray-900 text-center leading-tight mb-2">
              Upload{" "}
              <span
                className="relative inline-block"
                style={{ color: "#F97316" }}
              >
                Question Paper &amp; Answer Sheets
                {/* Orange highlight bar */}
                <span
                  className="absolute bottom-0 left-0 right-0 rounded"
                  style={{
                    height: 6,
                    background: "#FED7AA",
                    opacity: 0.55,
                    bottom: -1,
                    zIndex: -1,
                  }}
                />
              </span>
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Upload both files to get started
            </p>

            {/* Teacher avatar */}
            <TeacherAvatar />

            {/* Upload cards */}
            <div className="w-full max-w-xl mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <UploadCard
                label="Upload"
                colorLabel="Question Paper"
                file={questionPaperFile}
                dragging={qpDragging}
                inputRef={qpInputRef}
                onAreaClick={() => qpInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setQpDragging(true);
                }}
                onDragLeave={() => setQpDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setQpDragging(false);
                  handleFileSelect(
                    e.dataTransfer.files[0],
                    setQuestionPaperFile,
                  );
                }}
                onInputChange={(e) =>
                  handleFileSelect(e.target.files?.[0], setQuestionPaperFile)
                }
                onRemove={() => setQuestionPaperFile(null)}
              />
              <UploadCard
                label="Upload"
                colorLabel="Answer Sheet"
                file={answerSheetFile}
                dragging={asDragging}
                inputRef={asInputRef}
                onAreaClick={() => asInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setAsDragging(true);
                }}
                onDragLeave={() => setAsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setAsDragging(false);
                  handleFileSelect(e.dataTransfer.files[0], setAnswerSheetFile);
                }}
                onInputChange={(e) =>
                  handleFileSelect(e.target.files?.[0], setAnswerSheetFile)
                }
                onRemove={() => setAnswerSheetFile(null)}
              />
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <button
                id="start-mapping-btn"
                onClick={handleStartMapping}
                disabled={!questionPaperFile || !answerSheetFile}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all active:scale-95"
                style={{
                  background:
                    questionPaperFile && answerSheetFile
                      ? "#111827"
                      : "#E5E7EB",
                  color:
                    questionPaperFile && answerSheetFile ? "white" : "#9CA3AF",
                  cursor:
                    questionPaperFile && answerSheetFile
                      ? "pointer"
                      : "not-allowed",
                  boxShadow:
                    questionPaperFile && answerSheetFile
                      ? "0 2px 12px rgba(17,24,39,0.18)"
                      : "none",
                }}
              >
                Start Mapping
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
                Once both files are uploaded, you&apos;ll be able to map answers
                with questions
              </p>
            </div>
          </div>
        )}

        {/* ══════════════ LOADING SCREEN ══════════════ */}
        {appState === "processing" && (
          <div className="flex-1 bg-white flex flex-col items-center justify-center gap-4 px-4">
            <SparkleLoader />
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mt-2">
                Extracting...
              </h2>
              <p className="text-sm text-gray-400 mt-1.5">
                This may take a while
              </p>
              <p className="text-xs text-gray-300 mt-3">{processingLabel}</p>
            </div>
          </div>
        )}

        {/* ══════════════ RESULTS SCREEN ══════════════ */}
        {appState === "results" && session && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ── Mobile: tab switcher ── */}
            <div className="md:hidden flex border-b border-gray-200 bg-white flex-shrink-0">
              {(["questions", "sheet"] as MobileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    color: mobileTab === tab ? "#111827" : "#9CA3AF",
                    borderBottom:
                      mobileTab === tab
                        ? "2px solid #111827"
                        : "2px solid transparent",
                  }}
                >
                  {tab === "questions"
                    ? "Questions"
                    : viewerMode === "questionPaper"
                      ? "Question Paper"
                      : "Answer Sheet"}
                </button>
              ))}
            </div>

            {/* ── Mobile: Questions panel ── */}
            {mobileTab === "questions" && (
              <div className="md:hidden flex-1 overflow-auto bg-white">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">
                    Extracted Questions (from question paper)
                  </span>
                </div>
                <QuestionList
                  questions={session.questions}
                  mappings={session.mappings}
                  grading={session.grading}
                  selectedQuestionId={selectedQuestionId}
                  onSelectQuestion={(qId) => {
                    handleSelectQuestion(qId);
                    setMobileTab("sheet");
                  }}
                />
              </div>
            )}

            {/* ── Mobile: Answer Sheet panel ── */}
            {mobileTab === "sheet" && (
              <div className="md:hidden flex-1 overflow-hidden flex flex-col">
                <DocumentViewer
                  pages={activePages}
                  answers={session.answers}
                  selectedAnswerId={selectedAnswer?.id ?? null}
                  selectedPage={selectedPage}
                  setSelectedPage={setSelectedPage}
                  zoom={zoom}
                  setZoom={setZoom}
                  mode={viewerMode}
                  onModeChange={handleChangeViewerMode}
                />
              </div>
            )}

            {/* ── Desktop: two-panel layout ── */}
            <div className="hidden md:flex flex-1 overflow-hidden">
              {/* Left panel: Questions */}
              <div
                className="flex flex-col bg-[#F8F9FB] border-r border-[#E5E7EB] overflow-hidden flex-shrink-0"
                style={{ width: 388 }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">
                    Extracted Questions (from question paper)
                  </span>
                  <button
                    className="text-xs font-medium"
                    style={{ color: "#F97316" }}
                  >
                    Expand all
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <QuestionList
                    questions={session.questions}
                    mappings={session.mappings}
                    grading={session.grading}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={handleSelectQuestion}
                  />
                </div>
              </div>

              {/* Right panel: Answer sheet viewer */}
              <div className="flex-1 overflow-hidden bg-[#F3F4F6]">
                <DocumentViewer
                  pages={activePages}
                  answers={session.answers}
                  selectedAnswerId={selectedAnswer?.id ?? null}
                  selectedPage={selectedPage}
                  setSelectedPage={setSelectedPage}
                  zoom={zoom}
                  setZoom={setZoom}
                  mode={viewerMode}
                  onModeChange={handleChangeViewerMode}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
