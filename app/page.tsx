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
  return <img src="/icons/upload.svg" alt="Upload Icon" className="w-7 h-7" />;
}

function HomeIcon({ active }: { active?: boolean }) {
  return <img src="/icons/home.png" alt="Home Icon" className="w-4 h-4" />;
}

function ClassroomIcon({ active }: { active?: boolean }) {
  return <img src="/icons/class.png" alt="Class Icon" className="w-4 h-3" />;
}

function AssignmentIcon({ active }: { active?: boolean }) {
  return (
    <img
      src="/icons/assignments.png"
      alt="Assignment Icon"
      className="w-4 h-4"
    />
  );
}

function ExamIcon({ active }: { active?: boolean }) {
  return <img src="/icons/exams.png" alt="Exam Icon" className="w-4 h-4" />;
}

function LibraryIcon({ active }: { active?: boolean }) {
  return (
    <img src="/icons/library.png" alt="Library Icon" className="w-4 h-4" />
  );
}

/* ─────────────────────────────────────────────────────────
   VedaAI Logo
───────────────────────────────────────────────────────── */
function VedaLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className=" rounded-[14px] flex-shrink-0 flex items-center justify-center"
    >
      <img src="/icons/logo.png" alt="VedaAI Logo" className="" />
    </div>
  );
}

function SidebarSparkleIcon() {
  return <img src="/icons/ai-but.png" alt="Sparkle Icon" className="w-4 h-4" />;
}

function SidebarCollapseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 25 25"
      fill="none"
      className="text-[#8A8A8A]"
    >
      <rect
        x="3.5"
        y="4.5"
        width="18"
        height="17"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="5.5"
        x2="10"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SchoolCrest() {
  return (
    <img
      src="/icons/dps.png"
      alt="Sparkle Icon"
      className="w-[50px] h-[50px]"
    />
  );
}

/* ─────────────────────────────────────────────────────────
   Teacher Avatar
───────────────────────────────────────────────────────── */
function TeacherAvatar() {
  return (
    <img
      src="/icons/teacher.png"
      alt="Teacher image"
      className="w-[180px] h-[180px]"
    />
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
      {/* <svg
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
      </svg> */}
      <img
        src="/icons/ani-star1.svg"
        alt="Sparkle Icon"
        className="animate-sparkle-1 absolute"
        width="80"
        height="80"
        style={{ top: "-8px", left: "30%", transform: "translateX(-50%)" }}
      />
      {/* Small star top-right */}
      <img
        src="/icons/ani-star2.svg"
        className="animate-sparkle-2 absolute"
        style={{ bottom: 0, left: 0 }}
        width="50"
        height="50"
        // viewBox="0 0 26 26"
      ></img>
      {/* Tiny star bottom-left */}
      <svg
        className="animate-sparkle-3 absolute"
        style={{ bottom: 8, right: 2 }}
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
  const w = collapsed ? 72 : 340;
  return (
    <aside
      className="m-[14px] hidden min-h-0 flex-shrink-0 flex-col overflow-hidden bg-white shadow-[0_18px_42px_rgba(0,0,0,0.16)] transition-all duration-300 md:flex"
      style={{
        width: w,
        height: "calc(100vh - 28px)",
        borderRadius: collapsed ? 18 : 14,
      }}
    >
      {/* Logo */}
      <div
        className={`flex items-center ${collapsed ? "justify-center px-3 pt-6" : "justify-between px-[30px] pt-[25px]"}`}
      >
        <div className="flex items-center gap-3">
          <VedaLogo size={44} />
          {!collapsed && (
            <span className="text-[30px] font-extrabold leading-none tracking-normal text-[#2D2D2D]">
              VedaAI
            </span>
          )}
        </div>
        {!collapsed && (
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8A8A8A]">
            <SidebarCollapseIcon />
          </button>
        )}
      </div>

      {/* AI Teacher's Toolkit */}
      {!collapsed && (
        <div className="px-[28px] pt-[72px]">
          <button
            className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full border-4 border-[#EF7855] px-5 text-[17px] font-medium leading-none text-white shadow-[inset_0_15px_28px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.18)]"
            style={{
              background:
                "radial-gradient(circle at 50% -20%, #555 0%, #363636 40%, #292929 100%)",
            }}
          >
            <SidebarSparkleIcon />
            AI Teacher&apos;s Toolkit
          </button>
        </div>
      )}

      {/* Nav */}
      <nav
        className={`flex-1 ${collapsed ? "px-3 pt-9" : "space-y-[12px] px-[31px] pt-[60px]"}`}
      >
        {[
          { label: "Home", Icon: HomeIcon, active: false },
          { label: "My Classroom", Icon: ClassroomIcon, active: false },
          { label: "Assignments", Icon: AssignmentIcon, active: false },
          { label: "Exams", Icon: ExamIcon, active: true },
          { label: "My Library", Icon: LibraryIcon, active: false },
        ].map(({ label, Icon, active }) => (
          <button
            key={label}
            className={`flex w-full items-center whitespace-nowrap transition-colors ${
              active
                ? "h-[44px] rounded-[8px] bg-[#EEEEEE] text-[#2D2D2D]"
                : "h-[39px] text-[#858585] hover:bg-[#F5F5F5] hover:text-[#3B3B3B]"
            } ${collapsed ? "justify-center rounded-xl" : "gap-3 px-3 text-[16px] font-normal"}`}
            style={{
              fontWeight: active ? 600 : 400,
            }}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center ${
                active ? "text-[#2D2D2D]" : "text-[#858585]"
              }`}
            >
              <Icon active={active} />
            </span>
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom: Settings + School */}
      {!collapsed && (
        <div className="px-[29px] pb-[25px]">
          <button className="mb-[16px] flex h-10 w-full items-center gap-3 px-3 text-[16px] font-normal text-[#858585] transition-colors hover:text-[#3B3B3B]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
          <div className="flex h-[91px] items-center gap-[14px] rounded-[12px] bg-[#EEEEEE] px-[17px]">
            <SchoolCrest />
            <div className="min-w-0">
              <div className="truncate text-[16px] font-bold leading-tight text-[#2D2D2D]">
                Delhi Public School
              </div>
              <div className="mt-2 truncate text-[14px] font-normal leading-tight text-[#5F5F5F]">
                Bokaro Steel City
              </div>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="px-4 pb-6">
          <button className="flex h-12 w-full items-center justify-center rounded-xl text-[#858585] hover:bg-[#F5F5F5]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 014.35 16.88l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 017.04 4.3l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06A2 2 0 0119.65 7.12l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
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
    <div className="mr-[24px] mt-[14px] hidden h-[60px] flex-shrink-0 items-center justify-between rounded-[12px] bg-white px-6 shadow-[0_14px_34px_rgba(0,0,0,0.08)] md:flex">
      <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#2D2D2D] transition-colors hover:bg-[#F5F5F5]">
          <img
            src="/icons/Arrow_Left.svg"
            alt="Arrow_Left Icon"
            className="w-5 h-5"
          />
        </button>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-[16px] font-medium text-[#8E8E8E]">Exams</span>
      </div>
      <div className="flex items-center gap-3">
        {showReset && (
          <button
            onClick={onReset}
            className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            ← New Session
          </button>
        )}
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F7] text-[#2D2D2D] transition-colors hover:bg-[#EEEEEE]">
          <img
            src="/icons/help.svg"
            alt="Notification Icon"
            className="w-5 h-5"
          />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F7] text-[#2D2D2D] transition-colors hover:bg-[#EEEEEE]">
          <img
            src="/icons/bell.svg"
            alt="Notification Icon"
            className="w-5 h-5"
          />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF5A1F]" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2D2D2D] transition-colors hover:bg-[#F7F7F7]">
          <img src="/icons/star.svg" alt="AI Icon" className="w-5 h-5" />
        </button>
        <div className="flex h-10 items-center gap-2 rounded-full pl-1 text-[16px] font-semibold text-[#2D2D2D]">
          <img
            src="/icons/avatar.svg"
            alt="Teacher image"
            className=" h-8 w-8"
          />

          <span>Madhur Rastogi</span>
          <svg
            width="16"
            height="16"
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
    <header className="md:hidden flex rounded-xl mx-2 my-3 items-center justify-between px-4 py-3 bg-white border-b border-[#E8E8EC] flex-shrink-0">
      <div className="flex items-center gap-2">
        <button className="text-gray-500 mr-1">
          <img
            src="/icons/Arrow_Left.svg"
            alt="Arrow_Left Icon"
            className="w-4 h-4"
          />
        </button>
        {/* <VedaLogo size={26} /> */}
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
          <img
            src="/icons/bell.svg"
            alt="Notification Icon"
            className="w-5 h-5"
          />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
        </button>
        <button className="text-gray-400 mx-1">
          <img src="/icons/avatar.svg" alt="User Icon" className="w-7 h-7" />
        </button>
        <button className="text-gray-700">
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
      className="rounded-[16px] border-2 border-dashed bg-white transition-all"
      style={{
        borderColor: dragging ? "#F97316" : file ? "#E5E7EB" : "#E5E7EB",
        background: dragging ? "#FFF7ED" : "white",
        cursor: file ? "default" : "pointer",
        minHeight: 128,
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
        <div className="h-full flex flex-wrap items-center justify-center">
          <div className="flex items-center gap-3 p-4 bg-[#F6F6F6] rounded-2xl relative">
            {/* PDF icon */}
            <div className="flex-shrink-0 w-10 h-12 rounded flex items-center justify-center">
              <img src="/icons/pdf.svg" alt="PDF Icon" className="w-10 h-10" />
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
              className="absolute right-[-8px] top-[-8px] bg-[#2B2B2BCC] w-6 h-6 rounded-full flex items-center justify-center text-white hover:text-gray-200 hover:bg-gray-800 transition-colors"
              style={{ fontSize: 12 }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex min-h-[124px] flex-col items-center justify-center px-4 py-6 text-center">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] bg-[#F3F3F3]">
            <UploadIcon />
          </div>
          <p className="mt-4 text-[16px] font-bold leading-none text-[#2D2D2D]">
            {label} <span style={{ color: "#F97316" }}>{colorLabel}</span>
          </p>
          <p className="mt-2 text-[13px] leading-none text-[#A3A3A3]">
            Max 10MB
          </p>
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
  highlightedAnswerIds,
  selectedPage,
  setSelectedPage,
  zoom,
  setZoom,
  mode,
  onModeChange,
}: {
  pages: string[];
  answers: ExtractedAnswer[];
  highlightedAnswerIds: string[];
  selectedPage: number;
  setSelectedPage: (p: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
}) {
  const isQuestionPaper = mode === "questionPaper";
  const highlightedAnswerIdSet = new Set(highlightedAnswerIds);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F3F4F6]">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2F3137] border-b border-[#26282D] flex-shrink-0 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white/80 hidden md:block">
            {isQuestionPaper ? "Question Paper" : "Answer Sheet"}
          </span>
          {/* <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-[11px] font-semibold">
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
          </div> */}
        </div>
        <div className="flex items-center gap-4">
          {/* Zoom */}
          <div className="flex items-center gap-1 text-xs text-white/70">
            <button
              type="button"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 font-bold"
            >
              −
            </button>
            <span className="w-10 text-center font-medium text-white">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 font-bold"
            >
              +
            </button>
          </div>
          {/* Page navigation */}
          <div className="flex items-center gap-1 text-xs text-white/70">
            <button
              type="button"
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
              type="button"
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
        className="min-h-0 flex-1 overflow-auto p-4"
        style={{ background: "#F3F4F6" }}
      >
        {pages[selectedPage - 1] ? (
          <div
            className="relative inline-block rounded-xl bg-white shadow-[0_16px_34px_rgba(15,23,42,0.10)] overflow-hidden"
            style={{
              width: `${zoom}%`,
              minWidth: zoom >= 100 ? "100%" : undefined,
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
                  .filter(() => highlightedAnswerIdSet.has(ans.id))
                  .filter((box) => box.page === selectedPage)
                  .map((box, bIdx) => {
                    const style = boundingBoxToStyle(box);
                    return (
                      <div
                        key={`${ans.id}-${bIdx}`}
                        className="rounded transition-all"
                        style={{
                          ...style,
                          position: "absolute",
                          border: "2px solid #16A34A",
                          background: "rgba(22,163,74,0.10)",
                          zIndex: 20,
                        }}
                      >
                        <span
                          className="absolute -top-6 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm"
                          style={{
                            background: "#16A34A",
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
  const [expandAllQuestions, setExpandAllQuestions] = useState(false);
  const [questionPanelWidth, setQuestionPanelWidth] = useState(388);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const asInputRef = useRef<HTMLInputElement>(null);
  const desktopSplitRef = useRef<HTMLDivElement>(null);

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
      }

      setSelectedQuestionId(null);
      setExpandAllQuestions(false);
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
    setExpandAllQuestions(false);
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

  const allMatchedAnswerIds =
    session?.mappings
      .filter((mapping) => mapping.status === "matched" && mapping.answerId)
      .map((mapping) => mapping.answerId!)
      .filter(
        (answerId, index, answerIds) => answerIds.indexOf(answerId) === index,
      ) ?? [];

  const highlightedAnswerIds = selectedAnswer
    ? [selectedAnswer.id]
    : expandAllQuestions
      ? allMatchedAnswerIds
      : [];

  const expandedQuestionIds = new Set(
    selectedQuestionId
      ? [selectedQuestionId]
      : expandAllQuestions
        ? (session?.questions.map((question) => question.id) ?? [])
        : [],
  );

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
    setExpandAllQuestions(false);
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

  const handleExpandAllQuestions = () => {
    setSelectedQuestionId(null);
    setExpandAllQuestions(true);
    setViewerMode("answerSheet");
    setSelectedPage(1);
  };

  const updateQuestionPanelWidth = (clientX: number) => {
    const splitContainer = desktopSplitRef.current;
    if (!splitContainer) return;

    const bounds = splitContainer.getBoundingClientRect();
    const nextWidth = clientX - bounds.left;
    const maxWidth = Math.max(360, bounds.width - 520);
    const clampedWidth = Math.min(Math.max(nextWidth, 320), maxWidth);
    setQuestionPanelWidth(clampedWidth);
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
      style={{
        background: `
          linear-gradient(0deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.04) 60%, rgba(255, 255, 255, 0) 100%),
          #e8eaed
        `,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ─── Sidebar ─── */}
      <Sidebar collapsed={isProcessing} />

      {/* ─── Main area ─── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden ">
        <MobileHeader onReset={resetAll} showReset={isResults} />
        {/* Top bars */}
        <DesktopTopBar onReset={resetAll} showReset={isResults} />
        <div className="mb-3 mr-5 flex min-h-0 flex-1 flex-col overflow-hidden py-4">
          {/* Error banner */}
          {error && (
            <div
              className="  flex-shrink-0 p-3 rounded-xl flex items-center justify-between gap-3 text-sm"
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
            <div className="flex flex-1 flex-col items-center overflow-auto px-5 pb-10 pt-[72px]">
              {/* Heading */}
              <h1 className="mb-3 text-center text-2xl font-extrabold leading-tight text-[#2D2D2D] md:text-[34px]">
                Upload{" "}
                <span
                  className="relative inline-block rounded-[7px] px-2.5 py-0.5 text-black md:text-[#F97316]  md:bg-[#FF935026] text-center justify-center"
                  // style={{ color: "#F97316", fontFamily: "Bricolage Grotesque" }}
                >
                  Question Paper &amp; Answer Sheets
                  {/* Orange highlight bar */}
                  <span
                    className="absolute inset-0 rounded-[8px]"
                    style={{
                      background: "#FFE7DB",
                      opacity: 0.72,
                      zIndex: -1,
                    }}
                  />
                </span>
              </h1>
              <p className="mb-6 text-[18px] font-normal leading-none text-[#2D2D2D]">
                Upload both files to get started
              </p>

              {/* Teacher avatar */}
              <TeacherAvatar />

              {/* Upload cards */}
              <div className="mt-7 grid w-full max-w-[760px] grid-cols-1 gap-4 rounded-[20px] bg-white/80 p-3 shadow-[0_24px_58px_rgba(0,0,0,0.08)] md:grid-cols-2">
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
                    handleFileSelect(
                      e.dataTransfer.files[0],
                      setAnswerSheetFile,
                    );
                  }}
                  onInputChange={(e) =>
                    handleFileSelect(e.target.files?.[0], setAnswerSheetFile)
                  }
                  onRemove={() => setAnswerSheetFile(null)}
                />
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  id="start-mapping-btn"
                  onClick={handleStartMapping}
                  disabled={!questionPaperFile || !answerSheetFile}
                  className="flex h-[42px] items-center gap-2 rounded-full px-7 text-[14px] font-semibold transition-all active:scale-95"
                  style={{
                    background:
                      questionPaperFile && answerSheetFile
                        ? "#111827"
                        : "#E5E7EB",
                    color:
                      questionPaperFile && answerSheetFile
                        ? "white"
                        : "#9CA3AF",
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
                <p className="max-w-lg text-center text-[13px] leading-relaxed text-[#787878]">
                  Once both files are uploaded, you&apos;ll be able to map
                  answers with questions
                </p>
              </div>
            </div>
          )}

          {/* ══════════════ LOADING SCREEN ══════════════ */}
          {appState === "processing" && (
            // <div className="px-2 py-2 h-full ">
            <div className="flex-1 bg-white flex h-full flex-col rounded-2xl items-center justify-center gap-4 px-4">
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
            // </div>
          )}

          {/* ══════════════ RESULTS SCREEN ══════════════ */}
          {appState === "results" && session && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                <div className="flex-1 overflow-auto bg-white md:hidden">
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
                    expandedQuestionIds={expandedQuestionIds}
                    onSelectQuestion={(qId) => {
                      handleSelectQuestion(qId);
                      setMobileTab("sheet");
                    }}
                  />
                </div>
              )}

              {/* ── Mobile: Answer Sheet panel ── */}
              {mobileTab === "sheet" && (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
                  <DocumentViewer
                    pages={activePages}
                    answers={session.answers}
                    highlightedAnswerIds={highlightedAnswerIds}
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
              <div
                ref={desktopSplitRef}
                className={`hidden min-h-0 flex-1 overflow-hidden md:flex ${
                  isDraggingSplit ? "cursor-col-resize select-none" : ""
                }`}
              >
                {/* Left panel: Questions */}
                <div
                  className="flex min-h-0 flex-shrink-0  flex-col overflow-hidden border-r border-[#E5E7EB] bg-[#FFFFFF80] rounded-2xl"
                  style={{ width: questionPanelWidth }}
                >
                  <div className="flex items-center  justify-between px-4 py-3 ">
                    <span className="text-[13px] font-bold text-gray-600">
                      Extracted Questions (from question paper)
                    </span>
                    <button
                      type="button"
                      onClick={handleExpandAllQuestions}
                      className="text-xs font-bold bg-white px-3 py-3 rounded-full transition-colors hover:bg-gray-50"
                      style={{
                        color: expandAllQuestions ? "#16A34A" : "#000000",
                      }}
                    >
                      Expand all
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    <QuestionList
                      questions={session.questions}
                      mappings={session.mappings}
                      grading={session.grading}
                      selectedQuestionId={selectedQuestionId}
                      expandedQuestionIds={expandedQuestionIds}
                      onSelectQuestion={handleSelectQuestion}
                    />
                  </div>
                </div>

                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize question and answer panels"
                  aria-valuemin={320}
                  aria-valuemax={900}
                  aria-valuenow={Math.round(questionPanelWidth)}
                  tabIndex={0}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setIsDraggingSplit(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateQuestionPanelWidth(event.clientX);
                  }}
                  onPointerMove={(event) => {
                    if (!isDraggingSplit) return;
                    updateQuestionPanelWidth(event.clientX);
                  }}
                  onPointerUp={(event) => {
                    setIsDraggingSplit(false);
                    if (
                      event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                      event.currentTarget.releasePointerCapture(
                        event.pointerId,
                      );
                    }
                  }}
                  onPointerCancel={() => setIsDraggingSplit(false)}
                  onDoubleClick={() => setQuestionPanelWidth(388)}
                  onKeyDown={(event) => {
                    if (
                      event.key !== "ArrowLeft" &&
                      event.key !== "ArrowRight"
                    ) {
                      return;
                    }

                    event.preventDefault();
                    const direction = event.key === "ArrowLeft" ? -24 : 24;
                    setQuestionPanelWidth((currentWidth) => {
                      const splitContainer = desktopSplitRef.current;
                      const containerWidth =
                        splitContainer?.getBoundingClientRect().width ?? 1280;
                      const maxWidth = Math.max(360, containerWidth - 520);
                      return Math.min(
                        Math.max(currentWidth + direction, 320),
                        maxWidth,
                      );
                    });
                  }}
                  className="group relative z-10 flex w-4 flex-shrink-0 cursor-col-resize items-stretch justify-center touch-none"
                >
                  {/* <div
                    className={`h-full w-full rounded-xl transition-colors ${
                      isDraggingSplit
                        ? "bg-emerald-500/10"
                        : "bg-transparent group-hover:bg-white/35"
                    }`}
                  /> */}
                  <div
                    className={`absolute top-1/2 h-17 w-4 -translate-y-1/2 rounded-full border border-slate-400 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.18)] transition-all ${
                      isDraggingSplit
                        ? "scale-110 border-emerald-400 bg-emerald-50"
                        : "group-hover:border-slate-300"
                    }`}
                  />
                </div>

                {/* Right panel: Answer sheet viewer */}
                <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#FFFFFF80]">
                  <DocumentViewer
                    pages={activePages}
                    answers={session.answers}
                    highlightedAnswerIds={highlightedAnswerIds}
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
    </div>
  );
}
