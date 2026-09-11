"use client";

import { useState } from "react";
import { PlayCircle, Star, Lock, CheckCircle2, Crown } from "lucide-react";
import Link from "next/link";
import type { Lesson } from "@prisma/client";

// Grouping lessons by modules logically based on titles
type Module = {
  moduleTitle: string;
  lessons: Lesson[];
};

export default function LearnClient({ modules, isUserVIP }: { modules: Module[], isUserVIP: boolean }) {
  const [activeLesson, setActiveLesson] = useState<Lesson>(modules[0]?.lessons[0]);

  if (!activeLesson) return <div>Không có bài học nào.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
      
      {/* Left Area: Video Player & Info */}
      <div className="flex-1 space-y-6">
        
        {/* Video Player Container */}
        <div className="bg-slate-900 rounded-2xl aspect-video overflow-hidden relative shadow-lg border border-slate-200">
          {activeLesson.isVIP && !isUserVIP ? (
            // Paywall Overlay
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-center p-6 z-10 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Crown size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">Nội dung dành riêng cho thành viên VIP</h2>
              <p className="text-slate-400 mb-8 max-w-md">Bài học "<span className="text-white font-medium">{activeLesson.title}</span>" chứa kiến thức nâng cao giúp bạn x3 doanh thu. Nâng cấp ngay để mở khóa toàn bộ lộ trình!</p>
              <Link href="/pricing" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20">
                Nâng cấp VIP ngay
              </Link>
            </div>
          ) : (
            // Fake Video Player (Free or Unlocked)
            <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
              <PlayCircle size={72} className="text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all z-10" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">00:00 / 15:00</span>
                </div>
                <div className="bg-black/50 px-2 py-1 rounded text-xs font-mono">1080p HD</div>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-black text-slate-900">{activeLesson.title}</h1>
            <button className="shrink-0 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors flex items-center gap-2">
              <CheckCircle2 size={16} /> Đánh dấu hoàn thành
            </button>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            {activeLesson.content || "Nội dung bài học đang được cập nhật..."}
          </p>
        </div>
      </div>

      {/* Right Area: Playlist/Curriculum */}
      <div className="lg:w-[400px] xl:w-[450px] shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-120px)] sticky top-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-black text-lg text-slate-900 mb-1">Học Viện Seller Thực Chiến</h2>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "20%" }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Đã hoàn thành 1/15 bài học (20%)</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
            {modules.map((module, mIdx) => (
              <div key={mIdx}>
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2 px-2 pt-2">{module.moduleTitle}</h3>
                <ul className="space-y-1">
                  {module.lessons.map((lesson) => {
                    const isActive = activeLesson.id === lesson.id;
                    const isCompleted = false; // Mock for now
                    return (
                      <li key={lesson.id}>
                        <button 
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${
                            isActive 
                              ? "bg-blue-50 border border-blue-200 shadow-sm" 
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          {/* Thumbnail / Status */}
                          <div className="relative shrink-0">
                            {isCompleted ? (
                              <div className="w-24 aspect-video bg-green-100 rounded-md flex items-center justify-center text-green-600 border border-green-200">
                                <CheckCircle2 size={20} />
                              </div>
                            ) : (
                              <div className={`w-24 aspect-video rounded-md flex items-center justify-center relative overflow-hidden ${lesson.isVIP ? "bg-slate-900" : "bg-slate-800"}`}>
                                <div className={`absolute inset-0 opacity-50 ${lesson.isVIP ? "bg-gradient-to-br from-amber-600 to-orange-800" : "bg-gradient-to-br from-blue-600 to-purple-600"}`}></div>
                                {lesson.isVIP ? (
                                  <Lock size={16} className="text-yellow-400 relative z-10 opacity-80" />
                                ) : (
                                  <PlayCircle size={16} className="text-white relative z-10 opacity-80" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Title & Badge */}
                          <div className="flex-1 flex flex-col pt-0.5">
                            <span className={`text-sm font-bold line-clamp-2 leading-tight mb-1 ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                              {lesson.title}
                            </span>
                            <div className="mt-auto">
                              {lesson.isVIP ? (
                                <span className="inline-block bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">VIP</span>
                              ) : (
                                <span className="inline-block bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">FREE</span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
