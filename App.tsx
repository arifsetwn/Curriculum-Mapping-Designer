
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import * as XArrowsModule from 'react-xarrows';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { INITIAL_SEMESTERS, COLOR_OPTIONS } from './constants';
import { Semester, Course, Connection, CourseColor } from './types';

const Xarrow = (XArrowsModule as any).default || XArrowsModule;
const Xwrapper = (XArrowsModule as any).Xwrapper || (({ children }: any) => <>{children}</>);
const useXarrow = (XArrowsModule as any).useXarrow || (() => () => {});

const STORAGE_KEYS = {
  SEMESTERS: 'pti_2026_semesters',
  CONNECTIONS: 'pti_2026_connections'
};

const getCourseColorClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'green': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'white': return 'bg-white text-slate-700 border-slate-300 shadow-sm';
    case 'purple': return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    case 'gray': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default: return 'bg-white text-slate-700 border-slate-200';
  }
};

const getSksBadgeClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-100 text-blue-700';
    case 'green': return 'bg-emerald-100 text-emerald-700';
    case 'white': return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'purple': return 'bg-fuchsia-100 text-fuchsia-700';
    case 'gray': return 'bg-orange-100 text-orange-700';
    case 'yellow': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getLegendColorBox = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-50 border-blue-200';
    case 'green': return 'bg-emerald-50 border-emerald-200';
    case 'white': return 'bg-slate-50 border-slate-300';
    case 'purple': return 'bg-fuchsia-50 border-fuchsia-200';
    case 'gray': return 'bg-orange-50 border-orange-200';
    case 'yellow': return 'bg-yellow-50 border-yellow-200';
    default: return 'bg-white border-slate-200';
  }
};

const getFooterDotBorder = (color: string) => {
  switch (color) {
    case 'blue': return 'border-blue-500';
    case 'green': return 'border-emerald-500';
    case 'white': return 'border-slate-400';
    case 'purple': return 'border-fuchsia-500';
    case 'gray': return 'border-orange-500';
    case 'yellow': return 'border-yellow-500';
    default: return 'border-slate-300';
  }
};

const getCategoryShortLabel = (color: string) => {
  switch (color) {
    case 'blue': return 'MKU';
    case 'green': return 'MKDK';
    case 'white': return 'MKBK';
    case 'purple': return 'MKKPB';
    case 'gray': return 'MKPP';
    case 'yellow': return 'PILIHAN';
    default: return 'LAIN';
  }
};

// --- Sub-components ---

interface CourseCardProps {
  course: Course;
  index: number;
  onEdit: (course: Course) => void;
  onConnect: (courseId: string) => void;
  isDesignerMode: boolean;
  isSelectedForConnection: boolean;
  connectionSource: string | null;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  index, 
  onEdit, 
  onConnect, 
  isDesignerMode,
  isSelectedForConnection,
  connectionSource
}) => {
  const updateXarrow = useXarrow();

  useEffect(() => {
    updateXarrow();
  }, [updateXarrow, course]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDesignerMode) {
      onConnect(course.id);
    } else {
      onEdit(course);
    }
  };

  return (
    <Draggable draggableId={course.id} index={index} isDragDisabled={isDesignerMode}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          id={course.id}
          onClick={handleClick}
          className={`
            relative p-3 mb-3 rounded-xl shadow-sm border transition-all cursor-pointer group/card z-20
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-400 opacity-90 scale-105 z-50' : 'hover:shadow-md'}
            ${getCourseColorClasses(course.color)} 
            ${isSelectedForConnection ? 'ring-4 ring-indigo-500 shadow-indigo-200 scale-105' : ''}
            ${isDesignerMode && connectionSource && !isSelectedForConnection ? 'hover:ring-2 hover:ring-indigo-300' : ''}
            ${isDesignerMode ? 'hover:scale-[1.02]' : ''}
          `}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-grow flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[11px] leading-tight">
                {course.name}
              </span>
              {course.description && (
                <div className="group/info relative inline-flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-800 text-white text-[10px] font-medium leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 pointer-events-none z-[100] text-center normal-case tracking-normal">
                    {course.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 whitespace-nowrap ${getSksBadgeClasses(course.color)}`}>
              {course.sks} SKS
            </span>
          </div>

          {isDesignerMode && (
            <div className="absolute -top-1 -right-1 flex gap-1">
              {isSelectedForConnection ? (
                <div className="bg-indigo-600 text-white rounded-full p-1 shadow-lg animate-pulse">
                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
              ) : (
                <div className="bg-white text-indigo-400 rounded-full p-1 shadow-sm border border-indigo-100 opacity-0 group-hover/card:opacity-100 transition-opacity">
                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                </div>
              )}
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
  isDesignerMode: boolean;
  connectionSourceId: string | null;
}

const SemesterColumn: React.FC<SemesterColumnProps> = ({ 
  semester, 
  onEditCourse, 
  onConnect,
  isDesignerMode,
  connectionSourceId
}) => {
  const totalSks = semester.courses.reduce((sum, c) => sum + c.sks, 0);

  return (
    <div className="flex-shrink-0 w-64 bg-white border border-slate-200 rounded-2xl flex flex-col mx-2 shadow-sm h-fit relative transition-all">
      <div className={`p-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl transition-colors ${isDesignerMode ? 'bg-indigo-50/30' : 'bg-slate-50/50'}`}>
        <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">{semester.title}</h3>
        <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full shadow-sm">
          {totalSks} SKS
        </span>
      </div>
      
      <Droppable droppableId={semester.id} isDropDisabled={isDesignerMode}>
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
                isDesignerMode={isDesignerMode}
                isSelectedForConnection={connectionSourceId === course.id}
                connectionSource={connectionSourceId}
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
  const [isDesignerMode, setIsDesignerMode] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<null | 'png' | 'pdf'>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const exportWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
  }, [connections]);

  // Force update on mount and changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateXarrow();
    }, 100);
    return () => clearTimeout(timer);
  }, [connections, semesters, updateXarrow, isDesignerMode]);

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
    setTimeout(updateXarrow, 50);
  };

  const handleAddCourse = (semesterId: string) => {
    setEditingCourse({ 
      course: { id: `course-${Date.now()}`, name: '', sks: 2, color: CourseColor.White, description: '' }, 
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

  const handleDeleteConnection = (id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
    setSelectedConnectionId(null);
  };

  const toggleConnectionPath = (id: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === id) {
        const types: ('smooth' | 'grid' | 'straight')[] = ['smooth', 'grid', 'straight'];
        const currentIdx = types.indexOf(conn.pathType || 'smooth');
        const nextType = types[(currentIdx + 1) % types.length];
        return { ...conn, pathType: nextType };
      }
      return conn;
    }));
  };

  const addControlPoint = (id: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === id) {
        const fromEl = document.getElementById(conn.fromId);
        const toEl = document.getElementById(conn.toId);
        const boardEl = document.getElementById('curriculum-board');
        
        let newPoint = { x: 400, y: 300 };
        
        if (fromEl && toEl && boardEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          const boardRect = boardEl.getBoundingClientRect();
          
          const startX = fromRect.right - boardRect.left;
          const startY = fromRect.top + fromRect.height / 2 - boardRect.top;
          const endX = toRect.left - boardRect.left;
          const endY = toRect.top + toRect.height / 2 - boardRect.top;
          
          const points = conn.controlPoints || [];
          if (points.length === 0) {
            newPoint = { x: (startX + endX) / 2, y: (startY + endY) / 2 };
          } else {
            const last = points[points.length - 1];
            newPoint = { x: (last.x + endX) / 2, y: (last.y + endY) / 2 };
          }
        }
        
        const points = conn.controlPoints || [];
        return { ...conn, controlPoints: [...points, newPoint] };
      }
      return conn;
    }));
    setTimeout(updateXarrow, 50);
  };

  const clearControlPoints = (id: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === id) {
        return { ...conn, controlPoints: undefined };
      }
      return conn;
    }));
    setTimeout(updateXarrow, 50);
  };

  const removeControlPoint = (connId: string, index: number) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === connId && conn.controlPoints) {
        const newPoints = [...conn.controlPoints];
        newPoints.splice(index, 1);
        return { ...conn, controlPoints: newPoints.length > 0 ? newPoints : undefined };
      }
      return conn;
    }));
    setTimeout(updateXarrow, 50);
  };

  const updateControlPoint = (connId: string, pointIndex: number, x: number, y: number) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === connId && conn.controlPoints) {
        const newPoints = [...conn.controlPoints];
        newPoints[pointIndex] = { x, y };
        return { ...conn, controlPoints: newPoints };
      }
      return conn;
    }));
    // Live update
    window.requestAnimationFrame(() => updateXarrow());
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
            toId: courseId,
            pathType: 'smooth'
          }]);
        }
      }
      setConnectionSource(null);
    }
  };

  const handleScroll = () => {
    window.requestAnimationFrame(() => {
      updateXarrow();
    });
  };

  const handleExportImage = async () => {
    if (!exportWrapperRef.current) return;
    setIsExporting('png');
    const prevSelected = selectedConnectionId;
    setSelectedConnectionId(null);
    
    try {
      await new Promise(r => setTimeout(r, 200));
      const dataUrl = await toPng(exportWrapperRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        style: { padding: '60px' },
        width: exportWrapperRef.current.scrollWidth + 120,
        height: exportWrapperRef.current.scrollHeight + 120,
      });
      const link = document.createElement('a');
      link.download = `kurikulum-export.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Gagal mengekspor gambar.');
    } finally {
      setIsExporting(null);
      setSelectedConnectionId(prevSelected);
    }
  };

  const sksRecap = useMemo(() => {
    const recap: Record<string, number> = {
      [CourseColor.Blue]: 0, [CourseColor.Green]: 0, [CourseColor.White]: 0,
      [CourseColor.Purple]: 0, [CourseColor.Gray]: 0, [CourseColor.Yellow]: 0,
    };
    semesters.forEach(sem => {
      if (sem.id === 'semester-elective') return;
      sem.courses.forEach(course => { if (recap.hasOwnProperty(course.color)) recap[course.color] += course.sks; });
    });
    return recap;
  }, [semesters]);

  const totalSksSmt1to8 = useMemo(() => 
    (Object.values(sksRecap) as number[]).reduce((a: number, b: number) => a + b, 0)
  , [sksRecap]);

  const totalWajib = useMemo(() => {
    return (Object.entries(sksRecap) as [string, number][])
      .filter(([color]) => color !== CourseColor.Yellow)
      .reduce((sum, [_, val]) => sum + val, 0);
  }, [sksRecap]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans" onClick={() => setSelectedConnectionId(null)}>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-[60] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Kurikulum PTI 2026</h1>
            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isDesignerMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              {isDesignerMode ? 'Designer Mode (Design Path)' : 'Input Mode (Manage MK)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDesignerMode(false); setConnectionSource(null); setSelectedConnectionId(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${!isDesignerMode ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              INPUT MK
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDesignerMode(true); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${isDesignerMode ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              DESIGN PATH
            </button>
          </div>

          <button onClick={handleExportImage} disabled={!!isExporting} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm" title="Ekspor Gambar">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </nav>

      <div 
        ref={exportWrapperRef}
        className="flex-grow overflow-x-auto overflow-y-auto board-container relative bg-slate-50"
        onScroll={handleScroll}
      >
        <div id="curriculum-board" ref={boardRef} className="p-10 min-w-max relative pb-32">
          {/* Connection Toolbar */}
          {isDesignerMode && selectedConnectionId && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 rounded-2xl shadow-2xl p-2 flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
               <button 
                 onClick={(e) => { e.stopPropagation(); toggleConnectionPath(selectedConnectionId); }}
                 className="p-2 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 px-3"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                   {connections.find(c => c.id === selectedConnectionId)?.pathType || 'smooth'}
                 </span>
               </button>
               
               <div className="w-px h-6 bg-slate-700 mx-1"></div>

               <button 
                 onClick={(e) => { e.stopPropagation(); addControlPoint(selectedConnectionId); }}
                 className="p-2 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 px-3"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                 </svg>
                 <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Add Point</span>
               </button>

               <button 
                 onClick={(e) => { e.stopPropagation(); clearControlPoints(selectedConnectionId); }}
                 className="p-2 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 px-3"
                 title="Hapus Semua Titik"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                 </svg>
                 <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Reset Path</span>
               </button>

               <div className="w-px h-6 bg-slate-700 mx-1"></div>

               <button 
                 onClick={(e) => { e.stopPropagation(); handleDeleteConnection(selectedConnectionId); }}
                 className="p-2 hover:bg-rose-600 text-white rounded-xl transition-colors"
                 title="Hapus Garis"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
               </button>
            </div>
          )}

          <Xwrapper>
            {/* Semester Layer */}
            <div className="relative flex gap-4 min-w-max">
              <DragDropContext onDragEnd={onDragEnd}>
                {semesters.map((semester) => (
                  <div key={semester.id} className="relative group">
                    <SemesterColumn 
                      semester={semester} 
                      onEditCourse={(course, sid) => { setEditingCourse({ course, semesterId: sid }); setIsModalOpen(true); }}
                      onConnect={handleConnect}
                      isDesignerMode={isDesignerMode}
                      connectionSourceId={connectionSource}
                    />
                    {!isDesignerMode && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddCourse(semester.id); }}
                        className="mt-4 w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all opacity-0 group-hover:opacity-100 font-black text-[9px] uppercase tracking-widest bg-white/50"
                      >
                        + Tambah MK
                      </button>
                    )}
                  </div>
                ))}
              </DragDropContext>
            </div>

            {/* Multiple Control Point Handles */}
            {/* Render ALWAYS but conditionally hidden so Xarrows can attach */}
            {!isExporting && connections.map(conn => {
              if (!conn.controlPoints || conn.controlPoints.length === 0) return null;
              return conn.controlPoints.map((point, idx) => {
                const handleId = `handle-id-${conn.id}-${idx}`;
                const centeredLeft = point.x - 12;
                const centeredTop = point.y - 12;

                return (
                  <div 
                    key={`handle-${conn.id}-${idx}`}
                    id={handleId}
                    style={{ 
                      left: `${centeredLeft}px`, 
                      top: `${centeredTop}px`,
                      width: '24px',
                      height: '24px',
                      position: 'absolute',
                      zIndex: 200,
                      opacity: isDesignerMode ? 1 : 0,
                      pointerEvents: isDesignerMode ? 'auto' : 'none',
                      transition: 'opacity 0.2s ease',
                      visibility: 'visible', // Must be visible for layout engines, usually
                    }}
                    onMouseDown={(e) => {
                      if (!isDesignerMode) return;
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const initialX = point.x;
                      const initialY = point.y;

                      const onMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        updateControlPoint(conn.id, idx, initialX + deltaX, initialY + deltaY);
                      };

                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      };

                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                      setSelectedConnectionId(conn.id);
                    }}
                    onDoubleClick={(e) => {
                      if (!isDesignerMode) return;
                      e.stopPropagation();
                      removeControlPoint(conn.id, idx);
                    }}
                    className={`rounded-full border-2 bg-white shadow-xl cursor-move transition-transform hover:scale-110 flex items-center justify-center ${selectedConnectionId === conn.id ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-400 opacity-80 hover:opacity-100'}`}
                    title="Double click to remove point"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedConnectionId === conn.id ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                  </div>
                );
              });
            })}

            {/* Connection Layer */}
            {connections.map((conn) => {
              const isSelected = selectedConnectionId === conn.id;
              const color = isSelected ? "#8b5cf6" : (isDesignerMode ? "#f59e0b" : "#6366f1");
              const strokeWidth = isSelected ? 6 : (isDesignerMode ? 4 : 3);
              const headSize = isSelected ? 6 : (isDesignerMode ? 4 : 5);
              const path = conn.pathType || "smooth";
              const curveness = (conn.pathType === 'straight' || conn.pathType === 'grid') ? 0 : 0.4;
              const opacity = isDesignerMode ? (isSelected ? 1 : 0.5) : 0.35;
              const svgProps = { pointerEvents: "none" };

              if (conn.controlPoints && conn.controlPoints.length > 0) {
                const segments = [];
                
                // Segment 1: Start Course to First Handle
                segments.push(
                  <Xarrow
                    key={`${conn.id}-seg-0`}
                    start={conn.fromId}
                    end={`handle-id-${conn.id}-0`}
                    color={color}
                    strokeWidth={strokeWidth}
                    showHead={false}
                    path={path}
                    startAnchor="right"
                    endAnchor="middle"
                    curveness={curveness}
                    zIndex={10}
                    SVGcanvasProps={svgProps}
                    passProps={{ 
                      onClick: (e: any) => { if (isDesignerMode) { e.stopPropagation(); setSelectedConnectionId(conn.id); } },
                      style: { cursor: isDesignerMode ? 'pointer' : 'default', pointerEvents: isDesignerMode ? 'auto' : 'none', opacity } 
                    }}
                    divContainer="curriculum-board"
                  />
                );

                // Intermediate segments: Handle to Handle
                for (let i = 0; i < conn.controlPoints.length - 1; i++) {
                  segments.push(
                    <Xarrow
                      key={`${conn.id}-seg-mid-${i}`}
                      start={`handle-id-${conn.id}-${i}`}
                      end={`handle-id-${conn.id}-${i+1}`}
                      color={color}
                      strokeWidth={strokeWidth}
                      showHead={false}
                      path={path}
                      startAnchor="middle"
                      endAnchor="middle"
                      curveness={curveness}
                      zIndex={10}
                      SVGcanvasProps={svgProps}
                      passProps={{ 
                        onClick: (e: any) => { if (isDesignerMode) { e.stopPropagation(); setSelectedConnectionId(conn.id); } },
                        style: { cursor: isDesignerMode ? 'pointer' : 'default', pointerEvents: isDesignerMode ? 'auto' : 'none', opacity } 
                      }}
                      divContainer="curriculum-board"
                    />
                  );
                }

                // Final segment: Last Handle to Destination Course
                segments.push(
                  <Xarrow
                    key={`${conn.id}-seg-last`}
                    start={`handle-id-${conn.id}-${conn.controlPoints.length - 1}`}
                    end={conn.toId}
                    color={color}
                    strokeWidth={strokeWidth}
                    headSize={headSize}
                    path={path}
                    startAnchor="middle"
                    endAnchor="left"
                    curveness={curveness}
                    zIndex={10}
                    SVGcanvasProps={svgProps}
                    passProps={{ 
                      onClick: (e: any) => { if (isDesignerMode) { e.stopPropagation(); setSelectedConnectionId(conn.id); } },
                      style: { cursor: isDesignerMode ? 'pointer' : 'default', pointerEvents: isDesignerMode ? 'auto' : 'none', opacity } 
                    }}
                    divContainer="curriculum-board"
                  />
                );

                return <React.Fragment key={`frag-${conn.id}`}>{segments}</React.Fragment>;
              }

              // Normal single segment
              return (
                <Xarrow
                  key={conn.id}
                  start={conn.fromId}
                  end={conn.toId}
                  color={color}
                  strokeWidth={strokeWidth}
                  headSize={headSize}
                  path={path}
                  startAnchor="right"
                  endAnchor="left"
                  curveness={curveness}
                  zIndex={10}
                  SVGcanvasProps={svgProps}
                  passProps={{ 
                    onClick: (e: any) => {
                      if (isDesignerMode) {
                        e.stopPropagation();
                        setSelectedConnectionId(conn.id);
                      }
                    },
                    style: { 
                      cursor: isDesignerMode ? 'pointer' : 'default', 
                      pointerEvents: isDesignerMode ? 'auto' : 'none', 
                      transition: 'all 0.1s ease', 
                      opacity: isDesignerMode ? (isSelected ? 1 : 0.5) : 0.35 
                    } 
                  }}
                  divContainer="curriculum-board"
                />
              );
            })}
          </Xwrapper>

          {/* Legend Section */}
          <div className="mt-20 max-w-4xl bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative z-30 ml-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">Keterangan Warna Kurikulum</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-8">
              {COLOR_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-md border-2 ${getLegendColorBox(opt.value)} flex-shrink-0`} />
                  <span className="text-[11px] font-black text-slate-600 tracking-tight leading-none uppercase">
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-10 border-t border-slate-50 pt-6">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Garis Panah: Prasyarat Mata Kuliah (Prerequisite)</span>
            </div>

            <div className="absolute bottom-4 right-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
               Kurikulum PTI 2026 Designer
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-[60] shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 overflow-x-auto">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-4 border-r border-slate-100 whitespace-nowrap">Rekap SKS (SMT 1-8):</span>
           <div className="flex items-center gap-2">
             {COLOR_OPTIONS.map(opt => (
               <div key={opt.value} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100/60 whitespace-nowrap">
                 <div className={`w-2 h-2 rounded-full border-2 ${getFooterDotBorder(opt.value)} bg-white`} />
                 <span className="text-[10px] font-black text-slate-700 tracking-tight">
                   {getCategoryShortLabel(opt.value)}: <span className="ml-1 text-indigo-600 font-black">{sksRecap[opt.value] || 0}</span>
                 </span>
               </div>
             ))}
           </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
           <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beban Wajib:</span>
             <span className="text-[11px] font-black text-slate-800 tracking-tight">{totalWajib} SKS</span>
           </div>
           <div className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-4">
             <span className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none">Total Kredit</span>
             <span className="text-[11px] font-black text-white tracking-tight leading-none">{totalSksSmt1to8} SKS</span>
           </div>
        </div>
      </footer>

      {/* Course Editor Modal */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-slate-100 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-8">Detail Mata Kuliah</h2>
            <form onSubmit={handleSaveCourse} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Nama Mata Kuliah</label>
                <input required type="text" value={editingCourse.course?.name || ''} onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, name: e.target.value }})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Beban SKS</label>
                  <input type="number" min="1" value={editingCourse.course?.sks || 2} onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, sks: parseInt(e.target.value) || 0 }})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Kategori</label>
                  <select value={editingCourse.course?.color} onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, color: e.target.value }})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer font-bold">
                    {COLOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label.split('(')[0]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Catatan / Deskripsi</label>
                <textarea 
                  rows={3} 
                  value={editingCourse.course?.description || ''} 
                  onChange={(e) => setEditingCourse({...editingCourse, course: { ...editingCourse.course!, description: e.target.value }})} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-xs resize-none placeholder:text-slate-300" 
                  placeholder="Contoh: Prasyarat Algoritma Pemrograman..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest">Batal</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 text-xs tracking-widest uppercase">Simpan</button>
              </div>
              <div className="flex justify-center">
                <button type="button" onClick={handleDeleteCourse} className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-rose-700 transition-all">Hapus Mata Kuliah</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
