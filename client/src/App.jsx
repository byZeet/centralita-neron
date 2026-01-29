import { useState, useEffect, useRef } from 'react';
import { Phone, User, Clock, CheckCircle, XCircle, MinusCircle, LogIn, Monitor, RefreshCw, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class merging
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const STATUS_CONFIG = {
    available: { label: 'Libre', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: CheckCircle },
    busy: { label: 'Ocupado', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', icon: XCircle },
    away: { label: 'Ausente', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: MinusCircle },
    offline: { label: 'Desconectado', color: 'text-textMuted', bg: 'bg-surfaceHighlight', border: 'border-surfaceHighlight', icon: Monitor },
};

function StatusBadge({ status, className }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
    const Icon = config.icon;

    return (
        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md transition-all duration-300 whitespace-nowrap", config.bg, config.border, className)}>
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
            <span className={cn("text-xs font-medium truncate", config.color)}>{config.label}</span>
        </div>
    );
}

const SHIFT_CONFIG = {
    morning: { label: 'Mañana', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    afternoon: { label: 'Tarde', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' }
};

function OperatorCard({ operator }) {
    const shift = SHIFT_CONFIG[operator.shift]; // No fallback to morning

    return (
        <div className="bg-surface/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center hover:bg-surface/80 transition-all duration-300 backdrop-blur-sm group gap-2 text-center shadow-sm w-full">
            <div className="w-10 h-10 min-w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                {operator.name.charAt(0).toUpperCase()}
            </div>
            <div className="w-full min-w-0">
                <h3 className="font-semibold text-text text-sm truncate w-full" title={operator.name}>
                    {operator.name} <span className="text-primary text-xs opacity-80 ml-1">#{operator.extension || '---'}</span>
                </h3>

                {/* Shift Badge - Only show if shift exists */}
                {shift && (
                    <div className={cn("flex items-center justify-center gap-1.5 mb-2 mx-auto w-fit px-2 py-0.5 rounded text-[10px] border", shift.bg, shift.border, shift.color)}>
                        <span>{shift.label}</span>
                    </div>
                )}
                {!shift && <div className="h-[19px] mb-2"></div>} {/* Spacer to keep alignment */}

                <StatusBadge status={operator.status} className="w-full justify-center text-[10px] py-1 h-auto" />
            </div>
        </div>
    );
}

// Toast Component
// Toast Component
// Toast Component
function Toast({ message, type, onClose }) {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 4000); // 4 seconds
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    // Color mapping based on type/status
    const styles = {
        success: { bg: "bg-success/10", border: "border-success/20", text: "text-success", bar: "bg-success", icon: Check },
        error: { bg: "bg-error/10", border: "border-error/20", text: "text-error", bar: "bg-error", icon: AlertTriangle },
        available: { bg: "bg-success/20", border: "border-success", text: "text-success", bar: "bg-success", icon: CheckCircle },
        busy: { bg: "bg-error/20", border: "border-error", text: "text-error", bar: "bg-error", icon: XCircle },
        away: { bg: "bg-warning/20", border: "border-warning", text: "text-warning", bar: "bg-warning", icon: MinusCircle },
        offline: { bg: "bg-surfaceHighlight", border: "border-white/10", text: "text-textMuted", bar: "bg-textMuted", icon: Monitor }
    };

    const style = styles[type] || styles.success;
    const Icon = style.icon;

    return (
        <div className={cn(
            "flex flex-col rounded-xl shadow-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 min-w-[280px]",
            isClosing ? "animate-out slide-out-to-right-full fade-out" : "animate-in slide-in-from-right-full fade-in",
            style.bg, style.border, style.text
        )}>
            <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium mr-2">{message}</span>
                <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-full ml-auto"><X className="w-3 h-3" /></button>
            </div>

            {/* Progress Bar Loader */}
            <div className="h-1 w-full bg-white/10 mt-0">
                <div
                    className={cn(
                        "h-full origin-left animate-[progress_4s_linear_forwards]",
                        style.bar
                    )}
                />
            </div>
        </div>
    );
}

// Modal Component
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
                <p className="text-textMuted mb-6 text-sm">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm bg-surfaceHighlight hover:bg-white/10 text-white transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-error hover:bg-red-600 text-white font-medium transition-colors">Confirmar</button>
                </div>
            </div>
        </div>
    );
}

const DEPARTMENTS = [
    'Dpto.Programación',
    'Dpto.Técnicos',
    'Dpto.Comercial',
    'Dpto.Administración'
];

// Admin Panel Component
function AdminPanel({ operators, refresh, addToast, setConfirmModal }) {
    const [newName, setNewName] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newDept, setNewDept] = useState(DEPARTMENTS[0]);
    const [newExt, setNewExt] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/operators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, password: newPass, department: newDept, role: 'user', extension: newExt }),
            });
            if (res.ok) {
                setNewName('');
                setNewPass('');
                setNewExt('');
                refresh();
                addToast('Usuario creado correctamente', 'success');
            } else {
                const d = await res.json();
                addToast(d.error, 'error');
            }
        } catch (err) { addToast('Error creando usuario', 'error'); }
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Usuario',
            message: '¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.',
            onConfirm: () => handleDelete(id)
        });
    };

    const handleDelete = async (id) => {
        setConfirmModal(null); // Close modal
        await fetch(`/api/operators/${id}`, { method: 'DELETE' });
        refresh();
        addToast('Usuario eliminado', 'success');
    };

    // ... render
    return (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 sticky top-8">
            {/* ... rest of admin panel */}
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-warning">
                Admin Panel
            </h2>

            <form onSubmit={handleCreate} className="space-y-3 mb-6 border-b border-white/10 pb-6">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre" className="w-full bg-surfaceHighlight p-2 rounded text-sm text-text border border-white/5" required />
                <input value={newExt} onChange={e => setNewExt(e.target.value)} placeholder="Extensión (Opcional)" className="w-full bg-surfaceHighlight p-2 rounded text-sm text-text border border-white/5" />
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Contraseña" className="w-full bg-surfaceHighlight p-2 rounded text-sm text-text border border-white/5" required />
                <select value={newDept} onChange={e => setNewDept(e.target.value)} className="w-full bg-surfaceHighlight p-2 rounded text-sm text-text border border-white/5">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" className="w-full bg-primary text-white p-2 rounded text-sm font-bold">Crear Operador</button>
            </form>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <h3 className="text-sm font-bold text-textMuted uppercase">Usuarios ({operators.length})</h3>
                {operators.map(op => (
                    <div key={op.id} className="flex justify-between items-center bg-surfaceHighlight/50 p-2 rounded text-xs">
                        <div className="flex flex-col">
                            <span className="font-semibold">{op.name} <span className="text-primary opacity-80">#{op.extension || '---'}</span></span>
                            <span className="opacity-50 text-[10px]">{op.department}</span>
                        </div>
                        {op.role !== 'admin' && (
                            <button onClick={() => handleDeleteClick(op.id)} className="text-error hover:text-red-400 font-bold px-2 py-1 hover:bg-white/5 rounded">Borrar</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('neron_user');
        return saved ? JSON.parse(saved) : null;
    });
    // ... inputs
    const [inputName, setInputName] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // UI State
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null);
    const prevOperatorsRef = useRef([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const fetchOperators = async () => {
        try {
            const res = await fetch('/api/operators');
            const data = await res.json();
            if (data.operators) {
                // Check for status changes
                const newOps = data.operators;
                const prevOps = prevOperatorsRef.current;

                if (prevOps.length > 0 && user) { // Only notify if we have history and are logged in
                    newOps.forEach(newOp => {
                        const oldOp = prevOps.find(p => p.id === newOp.id);
                        if (oldOp && oldOp.status !== newOp.status && newOp.id !== user.id) {
                            // Status changed and not me
                            const statusLabel = STATUS_CONFIG[newOp.status]?.label || 'Desconectado';
                            addToast(
                                <span><strong className="font-bold text-base">{newOp.name}</strong> está ahora {statusLabel}</span>,
                                newOp.status
                            );
                        }
                    });
                }

                setOperators(newOps);
                prevOperatorsRef.current = newOps;
            }
        } catch (error) {
            console.error("Error fetching operators:", error);
        }
    };

    // Initial Poll
    useEffect(() => {
        fetchOperators();
        const interval = setInterval(fetchOperators, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [user?.id]); // Depend on user.id to re-fetch when user logs in/out

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!inputName.trim() || !inputPassword.trim()) return;

        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: inputName, password: inputPassword }),
            });
            const data = await res.json();

            if (res.ok && data.operator) {
                setUser(data.operator);
                localStorage.setItem('neron_user', JSON.stringify(data.operator));
            } else {
                setErrorMsg(data.error || "Login fallido");
            }
        } catch (err) {
            setErrorMsg("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (updates) => {
        if (!user) return;

        // Optimistic update
        const prevUser = { ...user };
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('neron_user', JSON.stringify(updatedUser)); // Update local storage too

        try {
            await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, ...updates }),
            });
            fetchOperators(); // Refresh list immediately
        } catch (err) {
            console.error("Failed to update profile");
            setUser(prevUser); // Revert
        }
    };

    // Group operators by department
    const operatorsByDept = operators.reduce((acc, op) => {
        if (op.role === 'admin') return acc; // Skip admin in directory
        const dept = op.department || 'Sin Departamento';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(op);
        return acc;
    }, {
        'Dpto.Programación': [],
        'Dpto.Técnicos': [],
        'Dpto.Comercial': [],
        'Dpto.Administración': []
    });

    // Sort departments by custom order if possible, else alphabetical
    const sortedDeptKeys = Object.keys(operatorsByDept).sort((a, b) => {
        const idxA = DEPARTMENTS.indexOf(a);
        const idxB = DEPARTMENTS.indexOf(b);
        // Put known departments first in order, others at the end
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const handleLogout = async () => {
        if (user) {
            try {
                await fetch('/api/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: user.id, status: 'offline', shift: null }),
                });
            } catch (error) {
                console.error("Error setting offline status:", error);
            }
        }
        localStorage.removeItem('neron_user');
        setUser(null);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-surface border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">Centralita Nerón</h1>
                        <p className="text-textMuted">Identifícate para entrar al sistema</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {errorMsg && (
                            <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg text-center animate-pulse">
                                {errorMsg}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Nombre de Operador</label>
                            <input
                                type="text"
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                className="w-full bg-surfaceHighlight border border-white/10 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                placeholder="Ej. Juan Pérez"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={inputPassword}
                                onChange={(e) => setInputPassword(e.target.value)}
                                className="w-full bg-surfaceHighlight border border-white/10 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 group"
                        >
                            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text p-4 md:p-8 font-sans selection:bg-primary/30">

            {/* Global UI Overlays */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} />
                    </div>
                ))}
            </div>
            {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)} />}

            {/* Header */}
            <header className="max-w-[90rem] mx-auto flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Phone className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Centralita <span className="text-primary">Nerón</span></h1>
                </div>

                <div className="flex items-center gap-4 bg-surface p-2 pr-4 pl-4 rounded-full border border-white/5 shadow-sm">
                    <div className="w-9 h-9 min-w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-inner text-white">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col mr-2 min-w-[180px]">
                        <span className="font-medium text-sm leading-none flex items-center gap-2 truncate">
                            {user.name}
                            <span className="text-primary bg-primary/10 px-1 rounded text-[10px] font-mono">#{user.extension || '---'}</span>
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_CONFIG[user.status]?.color.replace('text-', 'bg-') || 'bg-gray-500')}></span>
                            <span className="text-[10px] text-textMuted leading-none font-medium whitespace-nowrap w-[60px] inline-block">{STATUS_CONFIG[user.status]?.label || 'Desconectado'}</span>

                            <span className="text-[10px] text-textMuted opacity-50 mx-0.5 shrink-0">|</span>
                            {user.shift && SHIFT_CONFIG[user.shift] ? (
                                <span className={cn("text-[10px] leading-none font-medium whitespace-nowrap w-[45px] inline-block text-center", SHIFT_CONFIG[user.shift].color)}>
                                    {SHIFT_CONFIG[user.shift].label}
                                </span>
                            ) : (
                                <span className="text-[10px] leading-none font-medium whitespace-nowrap w-[45px] inline-block text-center text-textMuted/50">
                                    ---
                                </span>
                            )}

                            <span className="text-[10px] text-textMuted opacity-50 mx-0.5 shrink-0">|</span>
                            <span className="text-[10px] text-textMuted leading-none truncate block max-w-[100px]" title={user.department}>{user.department}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-xs text-textMuted hover:text-white underline ml-2 border-l border-white/10 pl-4 h-full transition-colors">
                        Salir
                    </button>
                </div>
            </header>

            <main className="max-w-[90rem] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: My Status Control (Fixed width) */}
                <div className="md:col-span-3 xl:col-span-2 space-y-6">
                    {user.role === 'admin' ? (
                        <AdminPanel operators={operators} refresh={fetchOperators} addToast={addToast} setConfirmModal={setConfirmModal} />
                    ) : (
                        <div className="bg-surface border border-white/5 rounded-2xl p-4 sticky top-8 space-y-6">

                            {/* Status Section */}
                            <div>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> Mi Estado
                                </h2>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateUserProfile({ status: 'available' })}
                                        className={cn(
                                            "w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-300 border-2",
                                            user.status === 'available'
                                                ? "bg-success/20 border-success shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                                                : "bg-surfaceHighlight border-transparent hover:bg-surfaceHighlight/80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded-full", user.status === 'available' ? "bg-success text-white" : "bg-white/10")}>
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Disponible</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => updateUserProfile({ status: 'busy' })}
                                        className={cn(
                                            "w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-300 border-2",
                                            user.status === 'busy'
                                                ? "bg-error/20 border-error shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-105"
                                                : "bg-surfaceHighlight border-transparent hover:bg-surfaceHighlight/80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded-full", user.status === 'busy' ? "bg-error text-white" : "bg-white/10")}>
                                            <XCircle className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Ocupado</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => updateUserProfile({ status: 'away' })}
                                        className={cn(
                                            "w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-300 border-2",
                                            user.status === 'away'
                                                ? "bg-warning/20 border-warning shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105"
                                                : "bg-surfaceHighlight border-transparent hover:bg-surfaceHighlight/80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded-full", user.status === 'away' ? "bg-warning text-white" : "bg-white/10")}>
                                            <MinusCircle className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Ausente</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Shift Section */}
                            <div className="pt-4 border-t border-white/5">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" /> Mi Jornada
                                </h2>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => updateUserProfile({ shift: 'morning' })}
                                        className={cn(
                                            "p-2 rounded-lg text-sm font-medium transition-all border border-transparent",
                                            user.shift === 'morning'
                                                ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                                : "bg-surfaceHighlight text-textMuted hover:text-white hover:bg-surfaceHighlight/80"
                                        )}
                                    >
                                        Mañana
                                    </button>
                                    <button
                                        onClick={() => updateUserProfile({ shift: 'afternoon' })}
                                        className={cn(
                                            "p-2 rounded-lg text-sm font-medium transition-all border border-transparent",
                                            user.shift === 'afternoon'
                                                ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                                                : "bg-surfaceHighlight text-textMuted hover:text-white hover:bg-surfaceHighlight/80"
                                        )}
                                    >
                                        Tarde
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Directory */}
                <div className="md:col-span-9 xl:col-span-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" /> Directorio ({operators.length})
                        </h2>
                        <div className="text-xs text-textMuted flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Actualizando
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                        {sortedDeptKeys.map(dept => (
                            <div key={dept} className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-surface/30 p-3 rounded-xl border border-white/5 h-fit min-w-0">
                                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3 px-1 border-b border-white/5 pb-2 flex justify-between items-center">
                                    <span className="truncate mr-2" title={dept}>{dept.replace('Dpto.', '')}</span>
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-text text-[10px]">{operatorsByDept[dept].length}</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {operatorsByDept[dept].length > 0 ? (
                                        operatorsByDept[dept].map(op => (
                                            <OperatorCard key={op.id} operator={op} />
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-4 text-textMuted text-[10px] italic opacity-50 border border-dashed border-white/10 rounded-lg">
                                            Vacío
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
