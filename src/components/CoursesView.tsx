import React, { useState } from 'react';
import { User, Course } from '../types';
import { GraduationCap, FileText, CheckCircle2, Bookmark, Users, Clock, AlertTriangle } from 'lucide-react';

interface CoursesViewProps {
  user: User | null;
  courses: Course[];
  fetchCourses: () => void;
  onOpenAuth: () => void;
}

export default function CoursesView({ user, courses, fetchCourses, onOpenAuth }: CoursesViewProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleRegister = async (courseId: string) => {
    if (!user) {
      setErrorMsg('Por favor, faça login ou cadastre-se para se inscrever.');
      return;
    }

    setLoadingId(courseId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`/api/courses/${courseId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar inscrição.');
      }

      setSuccessMsg(`Inscrição realizada com sucesso!`);
      fetchCourses(); // refresh available slots and lists
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-bold text-brand-green-dark">Inscrição em Cursos & Oficinas</h1>
        <p className="text-xs text-slate-500 font-light">Programas gratuitos de qualificação profissional, inclusão digital e geração de renda da SEMPS Vera Cruz/BA.</p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-2xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 max-w-2xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Course List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const isEnrolled = user ? course.registeredUsers.includes(user.id) : false;
          const isFull = course.availableSlots <= 0;

          return (
            <div 
              key={course.id} 
              className={`bg-white rounded-3xl border ${isEnrolled ? 'border-brand-green bg-gradient-to-br from-brand-green-light/5 to-white shadow-sm' : 'border-slate-100 shadow-xs'} p-6 flex flex-col justify-between space-y-6 hover:shadow-md transition duration-300`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-2.5 py-1 rounded-full">
                    {course.category}
                  </span>
                  
                  {isEnrolled && (
                    <span className="text-[10px] font-bold text-brand-green bg-white border border-brand-green/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      ✔ Inscrito
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  {course.description}
                </p>

                {/* Requirements details */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5 font-light">
                  <p className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-brand-green" /> Requisitos de Inscrição:
                  </p>
                  <p className="text-slate-600 leading-normal">{course.requirements}</p>
                </div>
              </div>

              {/* Course specs & Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-green" /> {course.schedule}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <Users className="w-3.5 h-3.5 text-brand-green" /> {course.availableSlots} / {course.totalSlots} Vagas
                  </span>
                </div>

                {user ? (
                  isEnrolled ? (
                    <div className="w-full bg-emerald-50 text-emerald-800 text-xs font-bold text-center py-3 rounded-xl border border-emerald-200">
                      Você já está inscrito nesta turma!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(course.id)}
                      disabled={loadingId === course.id || isFull}
                      className={`w-full text-xs font-bold py-3 rounded-xl shadow-md transition ${
                        isFull 
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none' 
                          : 'bg-brand-green hover:bg-brand-green-dark text-white'
                      }`}
                    >
                      {loadingId === course.id ? 'Realizando inscrição...' : isFull ? 'Vagas Esgotadas' : 'Confirmar Inscrição Online'}
                    </button>
                  )
                ) : (
                  <button
                    onClick={onOpenAuth}
                    className="w-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-bold py-3 rounded-xl transition text-center"
                  >
                    Identifique-se para Realizar Inscrição
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
