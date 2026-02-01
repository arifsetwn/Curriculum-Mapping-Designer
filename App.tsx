
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import * as XArrowsModule from 'react-xarrows';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { INITIAL_SEMESTERS, COLOR_OPTIONS } from './constants';
import { Semester, Course, Connection, CourseColor } from './types';

// Safely extract react-xarrows components
const Xarrow = (XArrowsModule as any).default || XArrowsModule;
const Xwrapper = (XArrowsModule as any).Xwrapper || (({ children }: any) => <>{children}</>);
const useXarrow = (XArrowsModule as any).useXarrow || (() => () => {});

const STORAGE_KEYS = {
  SEMESTERS: 'pti_2026_semesters',
  CONNECTIONS: 'pti_2026_connections'
};

// Helper for dynamic colors - Updated for new color scheme
const getCourseColorClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200'; // MKU
    case 'green': return 'bg-emerald-50 text-emerald-700 border-emerald-200'; // MKDK
    case 'white': return 'bg-white text-slate-700 border-slate-300 shadow-sm'; // MKBK (Changed to White)
    case 'purple': return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'; // MKKPB
    case 'gray': return 'bg-orange-50 text-orange-700 border-orange-200'; // MKPP
    case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200'; // MK Pilihan (Changed to Yellow)
    case 'red': return 'bg-rose-50 text-rose-700 border-rose-200'; // Legacy Red
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getSksBadgeClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-200/50 text-blue-800';
    case 'green': return 'bg-emerald-200/50 text-emerald-800';
    case 'white': return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'purple': return 'bg-fuchsia-200/50 text-fuchsia-800';
    case 'gray': return 'bg-orange-200/50 text-orange-800';
    case 'yellow': return 'bg-yellow-200/50 text-yellow-800';
    case 'red': return 'bg-rose-200/50 text-rose-800';
    default: return 'bg-slate-200 text-slate-800';
  }
};

const getFullLabel = (color: string) => {
  switch (color) {
    case 'blue': return 'Mata Kuliah Umum (MKU)';
    case 'green': return 'Mata Kuliah Dasar Kependidikan (MKDK)';
    case 'white': return 'Mata Kuliah Bidang Keahlian (MKBK)';
    case 'purple': return 'Mata Kuliah Keterampilan Proses Pembelajaran (MKKPB)';
    case 'gray': return 'Mata Kuliah Pengembangan Pendidikan (MKPP)';
    case 'yellow': return 'Mata Kuliah Pilihan';
    default: return 'Lainnya';
  }
};

const getAbbreviatedLabel = (color: string) => {
  switch (color) {
    case 'blue': return 'MKU';
    case 'green': return 'MKDK';
    case 'white': return 'MKBK';
    case 'purple': return 'MKKPB';
    case 'gray': return 'MKPP';
    case 'yellow': return 'Pilihan';
    default: return 'Lain';
  }
};

// --- Sub-components ---

interface CourseCardProps {
  course: Course;
  index: number;
  onEdit: (course: Course) => void;
  onConnect: (courseId: string) => void;
  isConnecting: boolean;
  isSelectedForConnection: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  index, 
  onEdit, 
  onConnect, 
  isConnecting,
  isSelectedForConnection 
}) => {
  const updateXarrow = useXarrow();

  useEffect(() => {
    updateXarrow();
  }, [updateXarrow, course]);

  return (
    <Draggable draggableId={course.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          id={course.id}
          className={`
            relative p-3 mb-2 rounded-lg shadow-sm border transition-all cursor-pointer group/card
            ${snapshot.isDragging ? 'shadow-md ring-2 ring-indigo-400 opacity-90' : 'hover:shadow-md'}
            ${getCourseColorClasses(course.color)} 
            ${isSelectedForConnection ? 'ring-2 ring-indigo-600' : ''}
          `}
          onClick={() => isConnecting ? onConnect(course.id) : onEdit(course)}
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xs leading-tight pr-2">
                {course.name}
              </span>
              {course.description && (
                <div className="flex items-center gap-1 opacity-60 group-hover/card:opacity-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">Note</span>
                </div>
              )}
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${getSksBadgeClasses(course.color)}`}>
              {course.sks} SKS
            </span>
          </div>

          {/* Tooltip on Hover */}
          {course.description && (
            <div className="absolute left-1/2 -bottom-2 translate-y-full -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover/card:opacity-100 pointer-events-none transition-all z-[100] border border-slate-700">
              <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-indigo-300 uppercase tracking-widest text-[8px]">Catatan</div>
              <p className="font-medium leading-relaxed">{course.description}</p>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-t border-slate-700"></div>
            </div>
          )}

          {isConnecting && !isSelectedForConnection && (
            <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-lg transition-opacity hover:opacity-100 opacity-0 border-2 border-indigo-400 border-dashed">
               <span className="text-[10px] text-indigo-800 font-bold bg-white px-2 py-1 rounded shadow-sm">Pilih ini</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

interface SemesterColumnProps {
  semester: Semester;
  onEditCourse: (course: Course, semesterId: string) => void;
  onConnect: (courseId: string) => void;
  isConnecting: boolean;
  connectionSourceId: string | null;
}

const SemesterColumn: React.FC<SemesterColumnProps> = ({ 
  semester, 
  onEditCourse, 
  onConnect,
  isConnecting,
  connectionSourceId
}) => {
  const totalSks = semester.courses.reduce((sum, c) => sum + c.sks, 0);

  return (
    <div className="flex-shrink-0 w-64 bg-white border border-slate-200 rounded-xl flex flex-col mx-2 shadow-sm h-fit">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
        <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">{semester.title}</h3>
        <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full shadow-sm">
          {totalSks} SKS
        </span>
      </div>
      
      <Droppable droppableId={semester.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 flex-grow min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/30' : ''}`}
          >
            {semester.courses.map((course, index) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                index={index} 
                onEdit={(c) => onEditCourse(c, semester.id)}
                onConnect={onConnect}
                isConnecting={isConnecting}
                isSelectedForConnection={connectionSourceId === course.id}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const updateXarrow = useXarrow();

  // Initialize state from LocalStorage
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEMESTERS);
    try {
      return saved ? JSON.parse(saved) : INITIAL_SEMESTERS;
    } catch (e) {
      return INITIAL_SEMESTERS;
    }
  });
  
  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{ course: Course | null, semesterId: string } | null>(null);
  
  const [isConnectingMode, setIsConnectingMode] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<null | 'png' | 'pdf'>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const exportWrapperRef = useRef<HTMLDivElement>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
  }, [connections]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColIndex = semesters.findIndex(s => s.id === source.droppableId);
    const destColIndex = semesters.findIndex(s => s.id === destination.droppableId);

    const newSemesters = [...semesters];
    const [movedCourse] = newSemesters[sourceColIndex].courses.splice(source.index, 1);
    newSemesters[destColIndex].courses.splice(destination.index, 0, movedCourse);

    setSemesters(newSemesters);
    // Trigger arrow update after drop
    setTimeout(updateXarrow, 0);
  };

  const handleAddCourse = (semesterId: string) => {
    setEditingCourse({ 
      course: { id: `course-${Date.now()}`, name: '', sks: 2, color: CourseColor.Gray, description: '' }, 
      semesterId 
    });
    setIsModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const { course, semesterId } = editingCourse;
    if (!course?.name) return;

    setSemesters(prev => prev.map(sem => {
      if (sem.id === semesterId) {
        const existingIndex = sem.courses.findIndex(c => c.id === course.id);
        if (existingIndex > -1) {
          const updatedCourses = [...sem.courses];
          updatedCourses[existingIndex] = course;
          return { ...sem, courses: updatedCourses };
        }
        return { ...sem, courses: [...sem.courses, course] };
      }
      return sem;
    }));

    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = () => {
    if (!editingCourse || !editingCourse.course) return;
    const { course } = editingCourse;

    setSemesters(prev => prev.map(sem => ({
      ...sem,
      courses: sem.courses.filter(c => c.id !== course.id)
    })));
    
    setConnections(prev => prev.filter(conn => conn.fromId !== course.id && conn.toId !== course.id));
    
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleToggleConnectionMode = () => {
    setIsConnectingMode(!isConnectingMode);
    setConnectionSource(null);
  };

  const handleConnect = (courseId: string) => {
    if (!connectionSource) {
      setConnectionSource(courseId);
    } else {
      if (connectionSource !== courseId) {
        if (!connections.find(c => c.fromId === connectionSource && c.toId === courseId)) {
          setConnections(prev => [...prev, {
            id: `conn-${Date.now()}`,
            fromId: connectionSource,
            toId: courseId
          }]);
        }
      }
      setConnectionSource(null);
      setIsConnectingMode(false);
    }
  };

  const clearConnections = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Hapus semua panah prasyarat?")) {
      setConnections([]);
    }
  }, []);

  const resetBoard = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("⚠️ Reset Seluruh Board?\nSemua data mata kuliah dan panah akan dihapus dan dikembalikan ke awal.")) {
      const freshSemesters = JSON.parse(JSON.stringify(INITIAL_SEMESTERS));
      setSemesters(freshSemesters);
      setConnections([]);
      localStorage.removeItem(STORAGE_KEYS.SEMESTERS);
      localStorage.removeItem(STORAGE_KEYS.CONNECTIONS);
    }
  }, []);

  const handleScroll = () => {
    window.requestAnimationFrame(() => {
      updateXarrow();
    });
  };

  const handleExportImage = async () => {
    if (!exportWrapperRef.current) return;
    setIsExporting('png');

    try {
      const dataUrl = await toPng(exportWrapperRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        style: { padding: '40px' },
        width: exportWrapperRef.current.scrollWidth + 80,
        height: exportWrapperRef.current.scrollHeight + 80,
      });

      const link = document.createElement('a');
      link.download = `kurikulum-pti-2026-${new Date().toISOString().slice(0,10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
      alert('Gagal mengekspor gambar. Coba lagi.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!exportWrapperRef.current) return;
    setIsExporting('pdf');

    try {
      const dataUrl = await toPng(exportWrapperRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        style: { padding: '40px' },
        width: exportWrapperRef.current.scrollWidth + 80,
        height: exportWrapperRef.current.scrollHeight + 80,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [exportWrapperRef.current.scrollWidth + 80, exportWrapperRef.current.scrollHeight + 80]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, exportWrapperRef.current.scrollWidth + 80, exportWrapperRef.current.scrollHeight + 80);
      pdf.save(`kurikulum-pti-2026-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('oops, something went wrong!', err);
      alert('Gagal mengekspor PDF. Coba lagi.');
    } finally {
      setIsExporting(null);
    }
  };

  // Recalculate SKS for each category - Filtered to only include Smt 1-8
  const sksRecap = useMemo(() => {
    const recap: Record<string, number> = {
      [CourseColor.Blue]: 0,
      [CourseColor.Green]: 0,
      [CourseColor.White]: 0,
      [CourseColor.Purple]: 0,
      [CourseColor.Gray]: 0,
      [CourseColor.Yellow]: 0,
    };

    semesters.forEach(sem => {
      if (sem.id === 'semester-elective') return;
      sem.courses.forEach(course => {
        if (recap.hasOwnProperty(course.color)) {
          recap[course.color] += course.sks;
        }
      });
    });

    return recap;
  }, [semesters]);

  // Beban Inti: MKU + MKDK + MKBK + MKKPB + MKPP (Hanya Smt 1-8)
  const coreSks = useMemo(() => {
    return sksRecap[CourseColor.Blue] + 
           sksRecap[CourseColor.Green] + 
           sksRecap[CourseColor.White] + 
           sksRecap[CourseColor.Purple] + 
           sksRecap[CourseColor.Gray];
  }, [sksRecap]);

  // Total Seluruhnya di Smt 1-8 (termasuk jika ada MK Pilihan di dlm semester)
  const totalSksSmt1to8 = useMemo(() => {
    return Object.values(sksRecap).reduce((a: number, b: number) => a + b, 0);
  }, [sksRecap]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Kurikulum PTI 2026</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Curriculum Designer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              type="button"
              onClick={handleExportImage}
              disabled={!!isExporting}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs ${isExporting === 'png' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'} transition-all shadow-sm disabled:opacity-50`}
            >
              {isExporting === 'png' ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {isExporting === 'png' ? '...' : 'PNG'}
            </button>
            <button 
              type="button"
              onClick={handleExportPdf}
              disabled={!!isExporting}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs ${isExporting === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'} transition-all shadow-sm disabled:opacity-50`}
            >
              {isExporting === 'pdf' ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {isExporting === 'pdf' ? '...' : 'PDF'}
            </button>
          </div>

          <button 
            type="button"
            onClick={handleToggleConnectionMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isConnectingMode 
                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isConnectingMode ? 'Pilih Mata Kuliah...' : 'Buat Connector'}
          </button>

          <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button 
              type="button"
              onClick={clearConnections}
              className="text-slate-500 hover:text-red-500 p-2 transition-all rounded-lg bg-white border border-slate-100 hover:border-red-200 shadow-sm flex items-center justify-center"
              title="Bersihkan Connector (Trash)"
            >
              <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button 
              type="button"
              onClick={resetBoard}
              className="text-slate-500 hover:text-indigo-600 p-2 transition-all rounded-lg bg-white border border-slate-100 hover:border-indigo-200 shadow-sm flex items-center justify-center"
              title="Reset Seluruh Board (Refresh)"
            >
              <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div 
        ref={exportWrapperRef}
        className="flex-grow overflow-x-auto overflow-y-auto board-container relative bg-slate-50"
        onScroll={handleScroll}
      >
        <div id="curriculum-board" ref={boardRef} className="p-8 min-w-max">
          <Xwrapper>
            <div className="flex gap-4 min-w-max pb-12">
              <DragDropContext onDragEnd={onDragEnd}>
                {semesters.map((semester) => (
                  <div key={semester.id} className="relative group">
                    <SemesterColumn 
                      semester={semester} 
                      onEditCourse={(course, sid) => {
                        setEditingCourse({ course, semesterId: sid });
                        setIsModalOpen(true);
                      }}
                      onConnect={handleConnect}
                      isConnecting={isConnectingMode}
                      connectionSourceId={connectionSource}
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddCourse(semester.id)}
                      className="mt-4 w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-center gap-2 transition-all opacity-0 group-hover:opacity-100 font-bold text-xs uppercase"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah MK
                    </button>
                  </div>
                ))}
              </DragDropContext>
            </div>

            {connections.map((conn) => (
              <Xarrow
                key={conn.id}
                start={conn.fromId}
                end={conn.toId}
                color="#6366f1"
                strokeWidth={2}
                headSize={5}
                path="smooth"
                startAnchor="right"
                endAnchor="left"
                animateDrawing={true}
                curveness={0.8}
                divContainer="curriculum-board"
              />
            ))}
          </Xwrapper>

          {/* Export-Only Legend (shows at the bottom of the board) - Compact Version */}
          <div className="mt-12 border-t border-slate-200 pt-6 max-w-2xl bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">Keterangan Warna Kurikulum</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-6">
              {COLOR_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded border shadow-sm ${getCourseColorClasses(opt.value)} flex-shrink-0`} />
                  <span className="text-[11px] font-bold text-slate-600 leading-none">{getFullLabel(opt.value)}</span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 col-span-full mt-2 pt-3 border-t border-slate-50">
                 <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                 </div>
                 <span className="text-[11px] font-bold text-slate-600 leading-none">Garis Panah: Prasyarat Mata Kuliah (Prerequisite)</span>
              </div>
            </div>
            <div className="mt-5 pt-3 text-right">
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Kurikulum PTI 2026 Designer</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-x-auto">
        <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-hide">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3 shrink-0">Rekap SKS (Smt 1-8):</span>
          {COLOR_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-100 bg-slate-50 shrink-0 shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${getCourseColorClasses(opt.value)} border border-current opacity-70`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{getAbbreviatedLabel(opt.value)}:</span>
              <span className="text-xs font-black text-slate-800">{sksRecap[opt.value] || 0}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
           <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
             <span className="text-[10px] font-bold text-slate-500 uppercase">Beban Wajib:</span>
             <span className="text-xs font-black text-slate-700">{coreSks} SKS</span>
           </div>
           <div className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl shadow-lg shadow-indigo-100">
             <span className="text-[11px] font-black text-white/80 uppercase tracking-wider">Total Kredit (Smt 1-8)</span>
             <span className="text-sm font-black text-white">{totalSksSmt1to8} SKS</span>
           </div>
        </div>
      </footer>

      {/* Course Edit/Add Modal */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100 transform transition-all animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">Detail Mata Kuliah</h2>
            <form onSubmit={handleSaveCourse} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Mata Kuliah</label>
                <input 
                  required 
                  type="text" 
                  value={editingCourse.course?.name || ''}
                  onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, name: e.target.value }})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium"
                  placeholder="Contoh: Pemrograman Web"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Beban (SKS)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={editingCourse.course?.sks || 2}
                    onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, sks: parseInt(e.target.value) || 0 }})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
                  <select 
                    value={editingCourse.course?.color}
                    onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, color: e.target.value }})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer font-medium"
                  >
                    {COLOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Catatan / Deskripsi (Tooltip)</label>
                <textarea 
                  rows={3}
                  value={editingCourse.course?.description || ''}
                  onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, description: e.target.value }})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium resize-none"
                  placeholder="Tambahkan detail materi, dosen, atau info lainnya..."
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  Simpan
                </button>
              </div>
              
              <div className="flex justify-center pt-2">
                <button 
                  type="button" 
                  onClick={handleDeleteCourse} 
                  className="text-rose-500 text-[11px] font-black uppercase tracking-widest hover:text-rose-700 hover:underline transition-all"
                >
                  Hapus Mata Kuliah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
