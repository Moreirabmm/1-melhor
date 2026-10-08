import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  User, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Unlock,
  Calendar,
  Settings,
  Menu,
  Activity,
  History,
  Target,
  Trash2
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// Utilities
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function generateMockHabitHistory() {
  const history = {};
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    history[dateStr] = Math.random() > 0.3; // 70% chance of true
  }
  return history;
}

// Mock Data
const INITIAL_DATA = {
  pessoal: {
    tabs: [
      { id: 'p1', name: 'Treino', color: 'bg-blue-500' },
      { id: 'p2', name: 'Saúde', color: 'bg-emerald-500' },
    ],
    tasks: {
      'p1': {
        primary: { id: 't1', title: 'Treino de Jiu-Jitsu (1h)', completed: false },
        secondary: [
          { id: 't2', title: 'Alongamento Matinal', completed: false },
          { id: 't3', title: 'Beber 3L de água', completed: false }
        ],
        habits: [
          { id: 'h1', title: 'Treinar 3x na semana', history: generateMockHabitHistory() }
        ]
      },
      'p2': {
        primary: { id: 't4', title: 'Consulta no dentista', completed: false },
        secondary: [
          { id: 't5', title: 'Tomar vitaminas', completed: false },
        ],
        habits: [
          { id: 'h2', title: 'Dormir 8h', history: generateMockHabitHistory() },
          { id: 'h3', title: 'Sem açúcar', history: generateMockHabitHistory() }
        ]
      }
    }
  },
  profissional: {
    tabs: [
      { id: 'pr1', name: 'Design & Projetos', color: 'bg-purple-500' },
    ],
    tasks: {
      'pr1': {
        primary: { id: 't6', title: 'Finalizar UI do App "1%"', completed: false },
        secondary: [
          { id: 't7', title: 'Revisar PRs no Github', completed: false },
        ],
        habits: [
          { id: 'h4', title: 'Deep Work (2h)', history: generateMockHabitHistory() }
        ]
      }
    }
  }
};

export default function App() {
  // Initialize state from localStorage or fallback to defaults
  const [mode, setMode] = useState(() => localStorage.getItem('app_mode') || 'pessoal');
  
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('app_data');
    return savedData ? JSON.parse(savedData) : INITIAL_DATA;
  });
  
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('app_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  
  const [calendarUrl, setCalendarUrl] = useState(() => localStorage.getItem('app_calendar') || '');
  
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('app_active_tab');
    if (savedTab) return savedTab;
    const firstTab = data[mode]?.tabs[0];
    return firstTab ? firstTab.id : 'p1';
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditingCalendar, setIsEditingCalendar] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [appView, setAppView] = useState(() => localStorage.getItem('app_view') || 'tarefas'); // 'tarefas' | 'agenda'

  // Editable States
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [editingTabColor, setEditingTabColor] = useState("bg-emerald-500");
  
  const PREDEFINED_COLORS = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-red-500', 'bg-amber-500', 'bg-pink-500', 'bg-teal-500'
  ];

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [habitPeriod, setHabitPeriod] = useState("week"); // 'week' | 'month' | '3months'

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('app_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('app_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('app_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('app_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('app_calendar', calendarUrl);
  }, [calendarUrl]);

  useEffect(() => {
    localStorage.setItem('app_view', appView);
  }, [appView]);

  // Sync active tab when mode changes if current active tab is not in the new mode
  useEffect(() => {
    const firstTab = data[mode].tabs[0];
    if (firstTab && !data[mode].tabs.find(t => t.id === activeTab)) {
      setActiveTab(firstTab.id);
    }
  }, [mode, data, activeTab]);

  const currentTabs = data[mode].tabs;
  const currentArea = data[mode].tasks[activeTab] || { primary: null, secondary: [], habits: [] };
  const isPrimaryCompleted = currentArea.primary?.completed;

  // --- TAB MANAGEMENT ---
  const handleAddTab = () => {
    const newId = 't_' + Math.random().toString(36).substr(2, 9);
    const randomColor = PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
    setData(prev => {
      const newData = { ...prev };
      newData[mode].tabs.push({ id: newId, name: 'Nova Área', color: randomColor });
      newData[mode].tasks[newId] = { primary: null, secondary: [], habits: [] };
      return newData;
    });
    setActiveTab(newId);
    setEditingTabId(newId);
    setEditingTabName('Nova Área');
    setEditingTabColor(randomColor);
  };

  const handleDeleteTab = (tabId) => {
    if (!window.confirm("Deseja realmente excluir esta área e todas as suas tarefas?")) return;
    
    setData(prev => {
      const newData = { ...prev };
      newData[mode].tabs = newData[mode].tabs.filter(t => t.id !== tabId);
      delete newData[mode].tasks[tabId];
      return newData;
    });
    
    if (activeTab === tabId) {
      const remainingTabs = data[mode].tabs.filter(t => t.id !== tabId);
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].id : null);
    }
  };

  const handleRenameTabSubmit = (tabId) => {
    if (!editingTabName.trim()) {
      setEditingTabId(null);
      return;
    }
    setData(prev => {
      const newData = { ...prev };
      const tab = newData[mode].tabs.find(t => t.id === tabId);
      if (tab) {
        tab.name = editingTabName;
        tab.color = editingTabColor;
      }
      return newData;
    });
    setEditingTabId(null);
  };

  const handleTabKeyDown = (e, tabId) => {
    if (e.key === 'Enter') handleRenameTabSubmit(tabId);
    if (e.key === 'Escape') setEditingTabId(null);
  };

  // --- TASK MANAGEMENT ---
  const handleToggleTask = (taskId, isPrimary) => {
    // We only toggle the Primary Task (Gargalo). Secondary tasks are locked.
    if (!isPrimary) return;

    setData(prev => {
      const newData = { ...prev };
      const area = newData[mode].tasks[activeTab];
      if (!area || !area.primary || area.primary.id !== taskId) return prev;

      // Mark as completed
      const taskTitle = area.primary.title;
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#E6F4EA', '#2E5339']
      });

      // Add to logs
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      setLogs(currentLogs => [{ id: Math.random().toString(), title: taskTitle, time: timeString }, ...currentLogs]);

      // Waterfall: Move first secondary to primary
      if (area.secondary.length > 0) {
        area.primary = area.secondary.shift();
      } else {
        area.primary = null;
      }

      return newData;
    });
  };

  const handleAddTask = (isPrimary) => {
    const newId = 'tk_' + Math.random().toString(36).substr(2, 9);
    setData(prev => {
      const newData = { ...prev };
      if (isPrimary) {
        newData[mode].tasks[activeTab].primary = { id: newId, title: 'Nova Missão', completed: false };
      } else {
        newData[mode].tasks[activeTab].secondary.push({ id: newId, title: 'Nova Tarefa', completed: false });
      }
      return newData;
    });
    setEditingTaskId(newId);
    setEditingTaskTitle(isPrimary ? 'Nova Missão' : 'Nova Tarefa');
  };

  const handleRenameTaskSubmit = (taskId, isPrimary) => {
    if (!editingTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    setData(prev => {
      const newData = { ...prev };
      const area = newData[mode].tasks[activeTab];
      if (isPrimary && area.primary?.id === taskId) {
        area.primary.title = editingTaskTitle;
      } else {
        const t = area.secondary.find(x => x.id === taskId);
        if (t) t.title = editingTaskTitle;
      }
      return newData;
    });
    setEditingTaskId(null);
  };

  const handleTaskKeyDown = (e, taskId, isPrimary) => {
    if (e.key === 'Enter') handleRenameTaskSubmit(taskId, isPrimary);
    if (e.key === 'Escape') setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId, isPrimary) => {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;
    setData(prev => {
      const newData = { ...prev };
      const area = newData[mode].tasks[activeTab];
      if (isPrimary && area.primary?.id === taskId) {
        area.primary = null;
      } else {
        area.secondary = area.secondary.filter(t => t.id !== taskId);
      }
      return newData;
    });
  };

  // --- HABIT MANAGEMENT ---
  const handleAddHabit = () => {
    const newId = 'h_' + Math.random().toString(36).substr(2, 9);
    setData(prev => {
      const newData = { ...prev };
      newData[mode].tasks[activeTab].habits = newData[mode].tasks[activeTab].habits || [];
      newData[mode].tasks[activeTab].habits.push({ 
        id: newId, 
        title: 'Novo Hábito', 
        history: {} 
      });
      return newData;
    });
    setTimeout(() => {
      const name = window.prompt("Nome do novo hábito:", "Novo Hábito");
      if (name) {
        setData(prev => {
          const newData = { ...prev };
          const habit = newData[mode].tasks[activeTab].habits.find(h => h.id === newId);
          if (habit) habit.title = name;
          return newData;
        });
      }
    }, 50);
  };

  const toggleHabitDay = (habitId, dateStr) => {
    setData(prev => {
      const newData = { ...prev };
      const habit = newData[mode].tasks[activeTab].habits.find(h => h.id === habitId);
      if (habit) {
        habit.history[dateStr] = !habit.history[dateStr];
      }
      return newData;
    });
  };

  const handleDeleteHabit = (habitId) => {
    if (!window.confirm("Deseja realmente excluir este hábito e seu histórico?")) return;
    setData(prev => {
      const newData = { ...prev };
      const area = newData[mode].tasks[activeTab];
      area.habits = area.habits.filter(h => h.id !== habitId);
      return newData;
    });
  };

  const getHabitChartData = (history, period) => {
    let days = 7;
    if (period === 'month') days = 30;
    if (period === '3months') days = 90;
    
    const today = new Date();
    const interval = eachDayOfInterval({ start: subDays(today, days - 1), end: today });
    
    return interval.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        name: format(date, period === 'week' ? 'EEEEEE' : 'dd/MM', { locale: ptBR }),
        dateStr,
        completed: history[dateStr] ? 1 : 0
      };
    });
  };

  return (
    <div className="flex flex-col h-screen bg-brand-cream overflow-hidden text-gray-900">
      {/* TOP BAR */}
      <header className="h-16 border-b-2 border-black flex items-center justify-between px-6 shrink-0 bg-white shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 border-sketch transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-sketch font-bold text-2xl tracking-wide flex items-center gap-2">
            1% Melhor <span className="text-brand-emerald">a Cada Dia</span>
          </h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-1 border-sketch relative cursor-pointer" onClick={() => setMode(prev => prev === 'pessoal' ? 'profissional' : 'pessoal')}>
          <div 
            className={cn(
              "absolute inset-y-1 w-1/2 bg-white border-2 border-black rounded-sm shadow-sketch-black-sm transition-all duration-300 ease-in-out z-0",
              mode === 'pessoal' ? "left-1" : "left-[calc(50%-4px)]"
            )}
          />
          <button className={cn(
            "relative z-10 px-4 py-1 font-sans font-semibold text-sm flex items-center gap-2 transition-colors",
            mode === 'pessoal' ? "text-brand-moss" : "text-gray-500"
          )}>
            <User className="w-4 h-4" /> Pessoal
          </button>
          <button className={cn(
            "relative z-10 px-4 py-1 font-sans font-semibold text-sm flex items-center gap-2 transition-colors",
            mode === 'profissional' ? "text-brand-moss" : "text-gray-500"
          )}>
            <Briefcase className="w-4 h-4" /> Profissional
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setAppView(prev => prev === 'tarefas' ? 'agenda' : 'tarefas')}
            className={cn(
              "px-4 py-1.5 font-sketch font-bold text-lg rounded-lg border-sketch transition-all flex items-center gap-2",
              appView === 'agenda' 
                ? "bg-brand-emerald text-white shadow-none translate-y-0.5" 
                : "bg-white text-brand-moss shadow-sketch-black hover:-translate-y-0.5"
            )}
          >
            <Calendar className="w-5 h-5" />
            {appView === 'agenda' ? 'Voltar às Tarefas' : 'Abrir Agenda'}
          </button>
          
          <div className="w-px h-8 bg-gray-300 mx-2"></div>

          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-gray-100 border-sketch rounded-full">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {appView === 'tarefas' ? (
          <>
            {/* SIDEBAR */}
            <aside className={cn(
          "bg-brand-mint border-r-2 border-black flex flex-col transition-all duration-300 ease-in-out shrink-0 z-10",
          sidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden"
        )}>
          <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
            <h2 className="font-sketch font-bold text-lg mb-2 text-brand-moss border-b-2 border-brand-moss/20 pb-2">
              Áreas {mode === 'pessoal' ? 'Pessoais' : 'Profissionais'}
            </h2>
            
            {currentTabs.map(tab => (
              <div key={tab.id} className="relative group flex flex-col gap-1">
                {editingTabId === tab.id ? (
                  <div className="bg-white border-sketch shadow-sketch-black p-3 flex flex-col gap-2 relative z-20">
                    <input
                      autoFocus
                      type="text"
                      value={editingTabName}
                      onChange={(e) => setEditingTabName(e.target.value)}
                      onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                      className="w-full text-left font-sans font-medium text-black outline-none border-b border-gray-200 pb-1"
                    />
                    <div className="flex gap-1.5 justify-between">
                      {PREDEFINED_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setEditingTabColor(color)}
                          className={cn(
                            "w-5 h-5 rounded-full border shadow-sm transition-transform hover:scale-110",
                            color,
                            editingTabColor === color ? "border-black border-2 scale-110" : "border-transparent"
                          )}
                          title="Escolher cor"
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => handleRenameTabSubmit(tab.id)}
                      className="w-full text-xs bg-brand-moss text-white font-semibold py-1 rounded"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="w-full relative flex items-center">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      onDoubleClick={() => {
                        setEditingTabId(tab.id);
                        setEditingTabName(tab.name);
                        setEditingTabColor(tab.color || 'bg-emerald-500');
                      }}
                      className={cn(
                        "w-full text-left pl-6 pr-10 py-3 font-sans font-medium transition-all select-none relative overflow-hidden",
                        activeTab === tab.id 
                          ? "bg-white border-sketch shadow-sketch-black text-black scale-[1.02]" 
                          : "hover:bg-white/50 border-2 border-transparent text-gray-700 hover:border-sketch hover:shadow-none"
                      )}
                    >
                      <div className={cn("absolute left-0 top-0 bottom-0 w-3 border-r border-black/10", tab.color || 'bg-gray-300')} />
                      <span className="truncate block">{tab.name}</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteTab(tab.id)}
                      className="absolute right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                      title="Excluir Área"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button 
              onClick={handleAddTab}
              className="mt-2 text-left px-4 py-3 font-sans font-medium text-brand-emerald flex items-center gap-2 border-2 border-dashed border-brand-emerald rounded-lg hover:bg-brand-emerald/10 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova Área
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-y-auto p-8 relative">
          
          <div className="max-w-3xl w-full mx-auto flex flex-col gap-8 pb-12">
            
            {/* GARGALO - MISSÃO PRIMÁRIA */}
            <section>
              <h2 className="font-sketch font-bold text-2xl mb-4 text-brand-moss flex items-center gap-2">
                <Activity className="w-6 h-6 text-red-500" />
                O Gargalo do Dia
              </h2>
              
              {currentArea.primary ? (
                <div 
                  className={cn(
                    "p-6 bg-white border-sketch shadow-sketch flex items-center gap-4 transition-all duration-500 group hover:-translate-y-1 hover:shadow-lg"
                  )}
                >
                  <button 
                    onClick={() => handleToggleTask(currentArea.primary.id, true)}
                    className="shrink-0"
                    title="Concluir Gargalo"
                  >
                    <Circle className="w-10 h-10 text-gray-300 group-hover:text-brand-emerald transition-all" />
                  </button>
                  <div className="flex-1">
                    <p className="font-sans font-semibold text-gray-500 text-sm uppercase tracking-wide mb-1">Missão Primária</p>
                    
                    {editingTaskId === currentArea.primary.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onBlur={() => handleRenameTaskSubmit(currentArea.primary.id, true)}
                        onKeyDown={(e) => handleTaskKeyDown(e, currentArea.primary.id, true)}
                        className="w-full font-sketch font-bold text-3xl bg-gray-50 border-b-2 border-brand-emerald outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <h3 
                          onClick={() => {
                            setEditingTaskId(currentArea.primary.id);
                            setEditingTaskTitle(currentArea.primary.title);
                          }}
                          className="font-sketch font-bold text-3xl transition-all cursor-text flex-1 text-black"
                          title="Clique para editar"
                        >
                          {currentArea.primary.title}
                        </h3>
                        <button 
                          onClick={() => handleDeleteTask(currentArea.primary.id, true)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                          title="Excluir Missão"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => handleAddTask(true)}
                  className="w-full p-8 border-2 border-dashed border-brand-emerald bg-brand-mint/20 rounded-xl text-center text-brand-moss font-sketch text-lg hover:bg-brand-mint/50 transition-colors"
                >
                  + Adicionar Missão Primária
                </button>
              )}
            </section>

            {/* TAREFAS SECUNDÁRIAS */}
            <section className="mt-4">
              <h2 className="font-sketch font-bold text-xl mb-4 text-gray-700 flex items-center gap-2">
                Fila de Espera (Secundárias)
                <Lock className="w-5 h-5 text-gray-400" />
              </h2>
              
              <div className="flex flex-col gap-3">
                {currentArea.secondary.map(task => (
                  <div 
                    key={task.id}
                    className="p-4 bg-white border-sketch-reverse shadow-sketch-black-sm flex items-center gap-3 transition-all duration-300 opacity-60 grayscale cursor-not-allowed"
                  >
                     <div className="shrink-0" title="Bloqueado até se tornar o Gargalo">
                        <Lock className="w-6 h-6 text-gray-400" />
                     </div>
                    
                    {editingTaskId === task.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onBlur={() => handleRenameTaskSubmit(task.id, false)}
                        onKeyDown={(e) => handleTaskKeyDown(e, task.id, false)}
                        className="w-full font-sans font-medium text-lg bg-gray-50 border-b-2 border-gray-400 outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-between w-full flex-1 group/task">
                        <span 
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditingTaskTitle(task.title);
                          }}
                          className="font-sans font-medium text-lg flex-1 cursor-text text-gray-800"
                          title="Clique para editar"
                        >
                          {task.title}
                        </span>
                        <button 
                          onClick={() => handleDeleteTask(task.id, false)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                          title="Excluir Tarefa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                <button 
                  onClick={() => handleAddTask(false)}
                  className="mt-2 text-left font-sans font-medium text-gray-500 hover:text-black flex items-center gap-2 w-fit px-2 py-1 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" /> Adicionar na Fila
                </button>
              </div>
            </section>
            
            {/* DASHBOARD DE HÁBITOS POR ÁREA */}
            <section className="mt-12 pt-8 border-t-2 border-dashed border-gray-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sketch font-bold text-2xl text-brand-moss flex items-center gap-2">
                  <Target className="w-6 h-6 text-brand-emerald" />
                  Métricas da Área: {currentTabs.find(t => t.id === activeTab)?.name}
                </h2>
                
                <div className="flex items-center gap-4">
                  {/* Select Período */}
                  <div className="flex items-center bg-gray-100 p-1 border-sketch">
                    <button 
                      onClick={() => setHabitPeriod('week')}
                      className={cn("px-3 py-1 font-sans text-xs font-bold transition-all", habitPeriod === 'week' ? "bg-white border-2 border-black shadow-sm" : "text-gray-500 hover:text-black")}
                    >
                      7 Dias
                    </button>
                    <button 
                      onClick={() => setHabitPeriod('month')}
                      className={cn("px-3 py-1 font-sans text-xs font-bold transition-all", habitPeriod === 'month' ? "bg-white border-2 border-black shadow-sm" : "text-gray-500 hover:text-black")}
                    >
                      30 Dias
                    </button>
                    <button 
                      onClick={() => setHabitPeriod('3months')}
                      className={cn("px-3 py-1 font-sans text-xs font-bold transition-all", habitPeriod === '3months' ? "bg-white border-2 border-black shadow-sm" : "text-gray-500 hover:text-black")}
                    >
                      3 Meses
                    </button>
                  </div>

                  <button 
                    onClick={handleAddHabit}
                    className="text-sm font-sans font-semibold text-brand-emerald hover:text-brand-moss flex items-center gap-1 bg-brand-emerald/10 px-3 py-1.5 rounded-lg border border-brand-emerald/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Novo Hábito
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                {(currentArea.habits || []).map(habit => {
                  const chartData = getHabitChartData(habit.history, habitPeriod);
                  const completedDays = chartData.filter(d => d.completed === 1).length;
                  const totalDays = chartData.length;
                  const percentage = Math.round((completedDays / totalDays) * 100);
                  
                  // Últimos 7 dias para a barra de marcação rápida
                  const last7Days = getHabitChartData(habit.history, 'week');
                  
                  return (
                    <div key={habit.id} className="bg-white p-6 border-sketch shadow-sketch-black flex flex-col gap-4 group/habit">
                      {/* Cabecalho do Habito */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="font-sketch font-bold text-gray-800 text-2xl cursor-pointer hover:underline"
                              onClick={() => {
                                const name = window.prompt("Renomear hábito:", habit.title);
                                if (name) {
                                  setData(prev => {
                                    const newData = { ...prev };
                                    const h = newData[mode].tasks[activeTab].habits.find(x => x.id === habit.id);
                                    if (h) h.title = name;
                                    return newData;
                                  });
                                }
                              }}
                              title="Clique para renomear"
                            >
                              {habit.title}
                            </span>
                            <button 
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover/habit:opacity-100 transition-opacity p-1"
                              title="Excluir Hábito"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-sm font-sans text-gray-500 font-medium">
                            {completedDays} de {totalDays} dias concluídos ({percentage}%)
                          </span>
                        </div>

                        {/* Marcação Rápida (Sempre mostra os últimos 7 dias) */}
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-xs text-gray-400 font-sans font-bold uppercase tracking-wider">Registrar (Últimos 7 dias)</span>
                          <div className="flex gap-1.5">
                            {last7Days.map((day) => (
                              <button 
                                key={day.dateStr}
                                onClick={() => toggleHabitDay(habit.id, day.dateStr)}
                                className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all group",
                                  day.completed 
                                    ? "bg-brand-emerald border-brand-emerald text-white" 
                                    : "bg-gray-50 border-gray-200 hover:border-brand-emerald hover:bg-brand-emerald/10"
                                )}
                                title={day.name}
                              >
                                {day.completed ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-emerald">{day.name.charAt(0)}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Gráfico do Período */}
                      <div className="h-40 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                              tickLine={false} 
                              axisLine={false} 
                              interval={habitPeriod === '3months' ? 14 : habitPeriod === 'month' ? 4 : 0}
                            />
                            <Tooltip 
                              cursor={{ fill: '#F3F4F6' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white border-2 border-black p-2 shadow-sketch-black-sm">
                                      <p className="font-sans font-bold text-sm">{format(new Date(data.dateStr + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                                      <p className={cn("text-xs font-bold", data.completed ? "text-brand-emerald" : "text-gray-500")}>
                                        {data.completed ? 'Concluído' : 'Não concluído'}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="completed" radius={[4, 4, 0, 0]} maxBarSize={40}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.completed ? '#10B981' : '#E5E7EB'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                    </div>
                  );
                })}
                
                {!(currentArea.habits?.length > 0) && (
                  <div className="text-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                    <p className="font-sketch text-gray-500 text-lg">Nenhum hábito rastreado nesta área ainda.</p>
                  </div>
                )}
              </div>
            </section>
            
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-80 bg-white border-l-2 border-black flex flex-col shrink-0 z-10 overflow-y-auto">
          {/* Activity Log */}
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="font-sketch font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Hoje
            </h3>
            
            <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-gray-200">
              {logs.map(log => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute left-[3px] top-1.5 w-2 h-2 rounded-full bg-brand-emerald shadow-[0_0_0_4px_white]"></div>
                  <p className="font-sans font-medium text-sm text-gray-800">{log.title}</p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">{log.time}</p>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-gray-400 italic text-sm pl-4">Nenhuma atividade.</p>
              )}
            </div>
          </div>
        </aside>
          </>
        ) : (
          /* AGENDA FULL SCREEN VIEW */
          <main className="flex-1 bg-gray-50 flex flex-col overflow-hidden relative z-0 p-8">
            <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-6">
              <header className="flex items-center justify-between shrink-0">
                <h1 className="font-sketch font-bold text-4xl text-brand-moss flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-blue-500" />
                  Minha Agenda
                </h1>
                
                {calendarUrl && (
                  <button 
                    onClick={() => setIsEditingCalendar(!isEditingCalendar)}
                    className="text-sm font-semibold text-brand-emerald bg-brand-mint/30 px-4 py-2 rounded border border-brand-emerald/30 hover:bg-brand-mint transition-colors"
                  >
                    Trocar Calendário
                  </button>
                )}
              </header>

              {(isEditingCalendar || !calendarUrl) && (
                <div className="bg-white border-2 border-blue-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm shrink-0">
                  <p className="font-sans font-medium text-gray-700">
                    Cole o link de incorporação (Embed URL) do seu Google Calendar abaixo:
                  </p>
                  <input 
                    type="text" 
                    placeholder="<iframe src='https://calendar.google.com/calendar/embed?src=...' />"
                    className="w-full p-3 border-2 border-blue-200 rounded outline-none focus:border-blue-500 font-mono text-sm"
                    value={calendarUrl}
                    onChange={e => {
                      let val = e.target.value;
                      if (val.includes('<iframe') && val.includes('src="')) {
                        const match = val.match(/src="([^"]+)"/);
                        if (match) val = match[1];
                      }
                      setCalendarUrl(val);
                    }}
                  />
                  <button 
                    onClick={() => setIsEditingCalendar(false)}
                    className="w-fit bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition-colors"
                  >
                    Salvar Agenda
                  </button>
                </div>
              )}

              {calendarUrl && !isEditingCalendar ? (
                <div className="flex-1 rounded-xl overflow-hidden border-2 border-sketch shadow-sketch-black bg-white relative">
                  <iframe 
                    src={calendarUrl} 
                    style={{ border: 0 }} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="yes"
                    title="Google Calendar"
                  ></iframe>
                </div>
              ) : (
                !calendarUrl && (
                  <div className="flex-1 border-4 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-white/50">
                    <p className="text-gray-400 font-sketch text-2xl">Insira o link acima para visualizar sua agenda</p>
                  </div>
                )
              )}
            </div>
          </main>
        )}

      </div>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-brand-cream border-sketch shadow-sketch-black max-w-md w-full p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sketch font-bold text-2xl text-brand-moss flex items-center gap-2">
                <Settings className="w-6 h-6 text-brand-emerald" />
                Configurações
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-500 hover:text-black font-sans font-bold"
              >
                X
              </button>
            </div>
            
            <div className="flex flex-col gap-4 font-sans text-sm">
              <div className="flex flex-col gap-1 border-b border-gray-200 pb-4">
                <label className="font-semibold text-gray-700">Seu Nome</label>
                <input 
                  type="text" 
                  placeholder="Nome do Usuário" 
                  className="p-2 border border-gray-300 rounded outline-none focus:border-brand-emerald"
                  defaultValue="Usuário 1%"
                />
              </div>
              
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <span className="font-semibold text-gray-700">Efeitos de Confete</span>
                <button className="w-10 h-5 bg-brand-emerald rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <span className="font-semibold text-gray-700">Tema Claro / Escuro</span>
                <span className="text-gray-400 text-xs italic">(Em breve)</span>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={() => {
                    if (window.confirm("Isso apagará todo o histórico e restaurará as tarefas iniciais. Tem certeza?")) {
                      localStorage.removeItem('app_data');
                      localStorage.removeItem('app_logs');
                      localStorage.removeItem('app_mode');
                      localStorage.removeItem('app_active_tab');
                      localStorage.removeItem('app_calendar');
                      window.location.reload();
                    }
                  }}
                  className="w-full py-2 border-2 border-dashed border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  Resetar Dados Mockados
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="mt-2 w-full py-3 bg-brand-moss text-white font-sketch text-lg rounded shadow-sm hover:bg-brand-moss/90 transition-colors"
            >
              Salvar e Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
