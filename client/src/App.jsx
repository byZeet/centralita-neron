import { useState, useEffect, useRef } from 'react';
import { Phone, User, Clock, CheckCircle, XCircle, MinusCircle, LogIn, Monitor, RefreshCw, Trash2, AlertTriangle, Check, X, Ticket, Plus, Calendar, MessageSquare, PhoneIncoming, FileText, ChevronRight, ArrowRightCircle, Sun, Moon, Send, Users, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class merging
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Utility to handle SQLite UTC dates
function parseUTCDate(dateStr) {
    if (!dateStr) return new Date();
    // SQLite format: YYYY-MM-DD HH:MM:SS (UTC)
    // Convert to ISO: YYYY-MM-DDTHH:MM:SSZ
    return new Date(dateStr.replace(' ', 'T') + 'Z');
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

function OperatorCard({ operator, ticketCount, onViewTickets }) {
    const shift = SHIFT_CONFIG[operator.shift]; // No fallback to morning

    return (
        <div className="bg-surface/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center hover:bg-surface/80 transition-all duration-300 backdrop-blur-sm group gap-2 text-center shadow-sm w-full relative">
            {/* Ticket Badge */}
            {ticketCount > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onViewTickets(operator); }}
                    className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 hover:scale-110 transition-transform z-10"
                    title="Ver tickets asignados"
                >
                    <Ticket className="w-3 h-3" /> {ticketCount}
                </button>
            )}

            <div className="w-10 h-10 min-w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                {operator.name.charAt(0).toUpperCase()}
            </div>
            <div className="w-full min-w-0">
                <h3 className="font-semibold text-text text-sm truncate w-full" title={operator.name}>
                    {operator.name} <span className="text-primary text-xs opacity-80 ml-1">#{operator.extension || '---'}</span>
                </h3>

                {/* Shift Badge - Always show */}
                <div className={cn("flex items-center justify-center gap-1.5 mb-2 mx-auto w-fit px-2 py-0.5 rounded text-[10px] border", shift ? cn(shift.bg, shift.border, shift.color) : "bg-white/5 border-white/10 text-textMuted")}>
                    <span>{shift ? shift.label : 'Sin Turno'}</span>
                </div>

                <StatusBadge status={operator.status} className="w-full justify-center text-[10px] py-1 h-auto" />
            </div>
        </div>
    );
}

// Ticket Components
function TicketCard({ ticket, onAssign, onComplete, onTransfer, user }) {
    const isAssignedToMe = ticket.assigned_to === user.id;
    const isPending = ticket.status === 'pending';

    return (
        <div className={cn(
            "p-3 rounded-lg border flex flex-col gap-2 transition-all relative overflow-hidden group",
            isPending ? "bg-warning/5 border-warning/20 hover:border-warning/40" : "bg-blue-500/5 border-blue-500/20"
        )}>
            {/* Status Stripe */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                isPending ? "bg-warning" : "bg-blue-500"
            )} />

            <div className="flex justify-between items-start pl-2">
                <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold opacity-50">#{ticket.id}</span>
                    <span className="text-[9px] text-textMuted flex items-center gap-1 leading-none mt-1">
                        <Plus className="w-2.5 h-2.5 opacity-50" />
                        <span>Ticket creado por <span className="text-white/70 font-medium">{ticket.creator_name || 'Sistema'}</span></span>
                    </span>
                </div>
                <span className="text-[10px] text-textMuted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {parseUTCDate(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
            </div>

            <div className="pl-2">
                <h4 className="font-bold text-sm text-text truncate" title={ticket.client_name}>{ticket.client_name}</h4>
                <div className="text-xs text-textMuted flex items-center gap-1 mt-0.5">
                    <PhoneIncoming className="w-3 h-3" /> {ticket.client_number}
                </div>
            </div>

            {ticket.transferor_name && (
                <div className="pl-2">
                    <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-1 rounded border border-purple-500/20 flex items-center gap-1.5 w-fit font-medium">
                        <ArrowRightCircle className="w-2.5 h-2.5" /> Traspasado de {ticket.transferor_name}
                    </span>
                </div>
            )}

            <div className="bg-black/20 p-2 rounded text-xs text-textMuted italic pl-2 border-l-2 border-white/10 ml-2">
                "{ticket.issue_description}"
            </div>

            <div className="pl-2 pt-1 flex flex-col gap-2">
                {isPending ? (
                    <button
                        onClick={() => onAssign(ticket.id)}
                        className="text-xs bg-warning/10 text-warning hover:bg-warning hover:text-black font-bold px-2 py-2 rounded transition-colors w-full flex justify-center items-center gap-1"
                    >
                        <User className="w-3 h-3" /> Recoger Ticket
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "text-[10px] font-medium px-2 py-1.5 rounded flex items-center gap-1.5 justify-center border transition-colors",
                            isAssignedToMe
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 flex-1"
                                : "bg-surfaceHighlight text-textMuted border-white/5 w-full"
                        )}>
                            <User className="w-3 h-3" />
                            <span>Asignado a <span className={isAssignedToMe ? "text-blue-300 font-bold" : "text-white/70 font-bold"}>{isAssignedToMe ? 'mí' : (ticket.assignee_name || '...')}</span></span>
                        </div>

                        {isAssignedToMe && (
                            <>
                                <button
                                    onClick={() => onTransfer(ticket.id)}
                                    className="p-1.5 rounded bg-surfaceHighlight hover:bg-white/10 text-textMuted hover:text-white transition-colors border border-white/5"
                                    title="Traspasar ticket"
                                >
                                    <ArrowRightCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onComplete(ticket.id)}
                                    className="text-[10px] bg-success/20 text-success hover:bg-success hover:text-white border border-success/50 font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1 shadow-lg shadow-success/10"
                                    title="Marcar como resuelto"
                                >
                                    <CheckCircle className="w-3 h-3" /> Terminar
                                </button>
                            </>
                        )}
                    </div>
                )}
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

function TicketQueue({ tickets, onAssign, onComplete, onTransfer, onCreate, user }) {
    // Show only pending and assigned (not completed)
    const activeTickets = tickets.filter(t => t.status !== 'completed');

    return (
        <div className="bg-surface border border-white/5 rounded-2xl p-4 h-full flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" /> Cola de Llamadas
                </h2>
                <button
                    onClick={onCreate}
                    className="bg-primary hover:bg-blue-600 text-white p-1.5 px-3 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-4 h-4" /> Nuevo Ticket
                </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {activeTickets.length === 0 ? (
                    <div className="text-center py-10 text-textMuted opacity-50 italic flex flex-col items-center gap-2">
                        <div className="bg-white/5 p-3 rounded-full"><Ticket className="w-6 h-6 opacity-50" /></div>
                        No hay tickets pendientes
                    </div>
                ) : (
                    activeTickets.map(t => (
                        <TicketCard key={t.id} ticket={t} onAssign={onAssign} onComplete={onComplete} onTransfer={onTransfer} user={user} />
                    ))
                )}
            </div>
        </div>
    );
}

function TransferTicketModal({ isOpen, onClose, onTransfer, operators, currentUserId, ticketId }) {
    if (!isOpen) return null;

    // Filter operators: online and not current user
    const otherOperators = operators.filter(op => op.id !== currentUserId && op.status !== 'offline');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ArrowRightCircle className="w-5 h-5 text-primary" /> Traspasar Ticket #{ticketId}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-textMuted" /></button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto px-4 py-2 custom-scrollbar">
                    {otherOperators.length === 0 ? (
                        <div className="text-center py-8 text-textMuted flex flex-col items-center gap-3">
                            <div className="bg-white/5 p-3 rounded-full opacity-30"><User className="w-6 h-6" /></div>
                            <p className="text-xs italic">No hay otros operadores disponibles en este momento.</p>
                        </div>
                    ) : (
                        otherOperators.map(op => (
                            <button
                                key={op.id}
                                onClick={() => onTransfer(op.id)}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surfaceHighlight/50 hover:bg-surfaceHighlight hover:scale-[1.03] active:scale-95 transition-all border border-white/5 group shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        {op.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white">{op.name}</div>
                                        <div className="text-[10px] text-textMuted uppercase font-semibold">{op.department.replace('Dpto.', '')}</div>
                                    </div>
                                </div>
                                <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-primary/20 text-textMuted group-hover:text-primary transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-error hover:bg-red-600 text-white transition-colors font-medium shadow-lg shadow-red-900/20">Cancelar</button>
                </div>
            </div>
        </div>
    );
}

function CreateTicketModal({ isOpen, onClose, onCreate }) {
    if (!isOpen) return null;
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [issue, setIssue] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onCreate({ client_name: name, client_number: number, issue_description: issue });
        onClose();
        setName(''); setNumber(''); setIssue('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Crear Ticket</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs text-textMuted ml-1 mb-1 block">Nombre Cliente</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-surfaceHighlight p-2.5 rounded-lg text-sm text-text border border-white/5 focus:ring-2 focus:ring-primary focus:outline-none transition-all" required autoFocus />
                    </div>
                    <div>
                        <label className="text-xs text-textMuted ml-1 mb-1 block">Teléfono</label>
                        <input value={number} onChange={e => setNumber(e.target.value)} className="w-full bg-surfaceHighlight p-2.5 rounded-lg text-sm text-text border border-white/5 focus:ring-2 focus:ring-primary focus:outline-none transition-all" />
                    </div>
                    <div>
                        <label className="text-xs text-textMuted ml-1 mb-1 block">Incidencia</label>
                        <textarea value={issue} onChange={e => setIssue(e.target.value)} className="w-full bg-surfaceHighlight p-2.5 rounded-lg text-sm text-text border border-white/5 h-24 resize-none focus:ring-2 focus:ring-primary focus:outline-none transition-all" required />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-sm bg-error hover:bg-red-600 text-white transition-colors font-bold shadow-lg shadow-red-900/20">Cancelar</button>
                        <button type="submit" className="px-3 py-2 rounded-lg text-sm bg-primary hover:bg-blue-600 text-white font-bold transition-colors shadow-lg shadow-blue-900/20">Crear Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TicketHistoryModal({ operator, tickets, onClose }) {
    if (!operator) return null;
    const myTickets = tickets.filter(t => t.assigned_to === operator.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-primary" /> Tickets de {operator.name}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-textMuted hover:text-white" /></button>
                </div>

                <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {myTickets.length === 0 ? (
                        <div className="text-center py-12 text-textMuted opacity-50 flex flex-col items-center gap-2">
                            <Ticket className="w-8 h-8 opacity-30" />
                            Sin tickets asignados
                        </div>
                    ) : (
                        myTickets.map(t => (
                            <div key={t.id} className="bg-surfaceHighlight/30 p-4 rounded-xl border border-white/5 hover:bg-surfaceHighlight/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex flex-wrap gap-2 mb-1 items-center">
                                            <span className="font-bold text-sm">#{t.id} - {t.client_name}</span>
                                            <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-textMuted flex items-center gap-1">
                                                <Plus className="w-2.5 h-2.5" />
                                                <span>Ticket creado por <span className="text-white/70 font-medium">{t.creator_name || 'Sistema'}</span></span>
                                            </span>
                                            {t.transferor_name && (
                                                <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400 flex items-center gap-1">
                                                    <ArrowRightCircle className="w-2.5 h-2.5" />
                                                    <span>Traspasado de <span className="font-bold">{t.transferor_name}</span></span>
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-textMuted flex items-center gap-1 mt-0.5"><PhoneIncoming className="w-3 h-3" /> {t.client_number}</span>
                                    </div>
                                    <span className="text-xs text-textMuted bg-white/5 px-2 py-1 rounded-lg">{parseUTCDate(t.created_at).toLocaleString([], { hour12: false })}</span>
                                </div>
                                <div className="text-sm text-textMuted mt-2 bg-black/20 p-3 rounded-lg italic border-l-2 border-primary/30">
                                    "{t.issue_description}"
                                </div>
                                <div className="mt-3 text-xs flex gap-2 justify-end">
                                    <span className={cn("px-2 py-1 rounded font-bold border", t.status === 'completed' ? "bg-success/10 text-success border-success/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20")}>
                                        {t.status === 'completed' ? 'Completado' : 'En Proceso'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
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

    const handleCleanup = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Limpieza Total de Historial',
            message: '¿Estás seguro de que quieres borrar TODOS los tickets completados? Esta acción liberará espacio pero perderás el historial de los operadores. No se puede deshacer.',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const res = await fetch('/api/tickets/cleanup', { method: 'POST' });
                    const data = await res.json();
                    if (res.ok) {
                        addToast(`Limpieza completada: ${data.count} tickets eliminados`, 'success');
                        refresh();
                    }
                } catch (err) { addToast('Error en la limpieza', 'error'); }
            }
        });
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

            <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-sm font-bold text-textMuted uppercase mb-4 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-error/70" /> Mantenimiento
                </h3>
                <button
                    onClick={handleCleanup}
                    className="w-full flex items-center justify-center gap-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 p-3 rounded-xl text-xs font-bold transition-all"
                >
                    <Trash2 className="w-4 h-4" /> Borrar TODOS los tickets finalizados
                </button>
                <p className="text-[10px] text-textMuted mt-2 italic text-center opacity-70">
                    * El sistema también realiza una limpieza automática todos los viernes a las 18:00h.
                </p>
            </div>
        </div>
    );
}

// Chat Widget Component
function ChatWidget({ user, operators }) {
    const [isOpen, setIsOpen] = useState(false);
    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Fetch Channels
    const fetchChannels = async (isInit = false) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/channels?user_id=${user.id}&department=${encodeURIComponent(user.department)}`);
            const data = await res.json();
            if (data.channels) {
                // Sort channels: Global first, then Department, then DMs
                const sortedChannels = [...data.channels].sort((a, b) => {
                    const priority = { 'global': 0, 'department': 1, 'dm': 2 };
                    const pA = priority[a.type] ?? 99;
                    const pB = priority[b.type] ?? 99;
                    return pA - pB;
                });

                setChannels(prev => {
                    // Smart update to avoid re-renders if standard polling
                    if (JSON.stringify(prev) !== JSON.stringify(sortedChannels)) {
                        return sortedChannels;
                    }
                    return prev;
                });

                // Initialize active channel
                if (isInit && data.channels.length > 0 && !activeChannel) {
                    const general = data.channels.find(c => c.type === 'global');
                    setActiveChannel(general || data.channels[0]);
                }
            }
        } catch (err) { console.error("Error fetching channels", err); }
    };

    // Poll Channels (for new DMs)
    useEffect(() => {
        fetchChannels(true); // Init
        const interval = setInterval(() => fetchChannels(false), 5000);
        return () => clearInterval(interval);
    }, [user.id]);

    // Fetch Messages for Active Channel
    useEffect(() => {
        if (!activeChannel) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/channels/${activeChannel.id}/messages`);
                const data = await res.json();
                if (data.messages) {
                    setMessages(prev => {
                        if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
                            setAutoScroll(true); // Trigger scroll on new messages
                            return data.messages;
                        }
                        return prev;
                    });
                }
            } catch (err) { console.error(err); }
        };

        setMessages([]); // Clear on channel switch
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // Poll messages every 2s
        return () => clearInterval(interval);
    }, [activeChannel?.id]); // Only change if ID changes

    // Scroll to bottom
    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setAutoScroll(false);
        }
    }, [messages, autoScroll]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeChannel) return;

        try {
            await fetch(`/api/channels/${activeChannel.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: user.id, content: inputText }),
            });
            setInputText('');
            // Optimistic update handled by poll next cycle or manual append if latency high
        } catch (err) { console.error(err); }
    };

    const handleCreateDM = async (targetUser) => {
        // Check if DM exists
        const existing = channels.find(c => c.type === 'dm' && c.members.includes(targetUser.id) && c.members.includes(user.id));
        if (existing) {
            setActiveChannel(existing);
            setIsNewChatOpen(false);
            return;
        }

        // Create new
        try {
            const res = await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `DM-${user.name}-${targetUser.name}`, // Internal name
                    type: 'dm',
                    members: [user.id, targetUser.id],
                    created_by: user.id
                })
            });
            const newChannel = await res.json();
            // Force fetch to propagate
            await fetchChannels(false);
            setActiveChannel(newChannel);
            setIsNewChatOpen(false);
        } catch (err) { console.error(err); }
    };

    // Helper to get channel display name
    const getChannelInfo = (channel) => {
        if (!channel) return { name: '', icon: null };

        if (channel.type === 'global') return {
            name: 'General',
            icon: <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Globe className="w-5 h-5" /></div>
        };

        if (channel.type === 'department') return {
            name: channel.name.replace('Dpto.', ''),
            icon: <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center"><Users className="w-5 h-5" /></div>
        };

        if (channel.type === 'dm') {
            const otherId = channel.members?.find(id => id !== user.id);
            const otherOp = operators.find(op => op.id === otherId);
            const name = otherOp ? otherOp.name : 'Desconocido';
            const initial = name.charAt(0).toUpperCase();
            return {
                name,
                icon: <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center font-bold text-sm">{initial}</div>
            };
        }
        return { name: channel.name, icon: <div className="w-10 h-10 bg-white/10" /> };
    };

    const currentChannelInfo = getChannelInfo(activeChannel);

    return (
        <>
            {/* Floating Toggle Button */}
            <div className="fixed bottom-6 left-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 border-4 border-surface relative",
                        isOpen ? "bg-error rotate-90" : "bg-primary hover:bg-blue-600 animate-bounce-slow"
                    )}
                >
                    {isOpen ? <X className="w-8 h-8 text-white" /> : <MessageSquare className="w-8 h-8 text-white" />}
                </button>
            </div>

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-28 left-6 z-50 w-[450px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-left backdrop-blur-3xl",
                isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-20 pointer-events-none"
            )}>

                {/* Main Layout */}
                <div className="flex flex-1 min-h-0">

                    {/* 1. Sidebar - Channel List (Discord Style) */}
                    <div className="w-[72px] flex-none bg-surfaceHighlight border-r border-[var(--border-color)] flex flex-col items-center py-4 gap-4 overflow-y-auto custom-scrollbar">

                        {/* Add Button */}
                        <button
                            onClick={() => setIsNewChatOpen(true)}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all bg-surface hover:bg-success hover:text-white border border-[var(--border-color)] hover:border-success/50 group/add shadow-sm hover:shadow-md",
                                isNewChatOpen && "bg-success text-white border-success"
                            )}
                            title="Nuevo Chat Privado"
                        >
                            <Plus className={cn("w-6 h-6 transition-colors", isNewChatOpen ? "text-white" : "text-textMuted group-hover/add:text-white")} />
                        </button>

                        <div className="w-8 h-px bg-[var(--border-color)] shrink-0"></div>

                        {channels.map(channel => {
                            const info = getChannelInfo(channel);
                            const isActive = activeChannel?.id === channel.id;

                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => { setActiveChannel(channel); setIsNewChatOpen(false); }}
                                    className={cn(
                                        "w-12 h-12 transition-all flex items-center justify-center relative group/icon shadow-sm rounded-full",
                                        isActive
                                            ? "bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-surface"
                                            : "hover:bg-white/10"
                                    )}
                                    title={info.name}
                                >
                                    {/* Custom rendering of icon inside button context to control size */}
                                    {channel.type === 'dm' ? (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-purple-500/80 to-pink-600/80 text-white rounded-full overflow-hidden">
                                            {info.name.charAt(0)}
                                        </div>
                                    ) : (
                                        <div className={cn("w-full h-full flex items-center justify-center text-textMuted group-hover/icon:text-primary transition-colors rounded-full overflow-hidden", isActive && "text-primary")}>
                                            {channel.type === 'global' ? <Globe className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                        </div>
                                    )}

                                    {/* Status Indicator (DM only) */}
                                    {channel.type === 'dm' && (() => {
                                        const otherId = channel.members?.find(id => id !== user.id);
                                        const otherOp = operators.find(op => op.id === otherId);
                                        if (otherOp?.status) {
                                            const statusColors = {
                                                available: 'bg-green-500',
                                                busy: 'bg-red-500',
                                                away: 'bg-yellow-500',
                                                offline: 'bg-gray-500'
                                            };
                                            const color = statusColors[otherOp.status] || 'bg-gray-500';
                                            return (
                                                <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-surfaceHighlight rounded-full z-20", color)}></div>
                                            );
                                        }
                                        return null;
                                    })()}


                                </button>
                            );
                        })}
                    </div>

                    {/* 2. Chat Area */}
                    <div className="flex-1 flex flex-col bg-surface/50 min-w-0 relative">

                        {/* New Chat Overlay */}
                        {isNewChatOpen && (
                            <div className="absolute inset-0 z-20 bg-surface/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-text flex items-center gap-2">
                                        <Users className="w-6 h-6 text-success" /> Nueva Conversación
                                    </h3>
                                    <button onClick={() => setIsNewChatOpen(false)} className="p-2 hover:bg-surfaceHighlight rounded-full text-textMuted hover:text-text"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {operators.filter(op => op.id !== user.id).map(op => (
                                        <button
                                            key={op.id}
                                            onClick={() => handleCreateDM(op)}
                                            className="w-full p-4 hover:bg-surfaceHighlight rounded-xl border border-white/5 flex items-center gap-4 transition-all hover:scale-[1.01]"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                                                {op.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-base text-text">{op.name}</div>
                                                <div className="text-xs text-textMuted">{op.department}</div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-textMuted ml-auto" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="h-16 border-b border-border-color flex items-center px-6 gap-3 shrink-0 bg-surface/30 backdrop-blur-sm">
                            <div className="font-bold text-lg text-text flex items-center gap-2">
                                <span className="opacity-50 text-xl text-textMuted">{activeChannel?.type === 'dm' ? '@' : '#'}</span>
                                {currentChannelInfo.name || 'Cargando...'}
                            </div>
                            {activeChannel?.type === 'department' && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-textMuted uppercase tracking-wider">Departamento</span>}
                            {activeChannel?.type === 'global' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase tracking-wider">Global</span>}
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                                    <MessageSquare className="w-16 h-16" />
                                    <div className="text-center">
                                        <p className="text-lg font-bold">Comienza la charla</p>
                                        <p className="text-sm">Nadie ha hablado aún... sé el primero.</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === user.id;
                                    const showInfo = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id || (new Date(msg.created_at) - new Date(messages[idx - 1].created_at) > 300000); // 5 min gap

                                    return (
                                        <div key={msg.id} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>

                                            {/* Avatar & Name Header (Only if new block) */}
                                            {showInfo && !isMe && (
                                                <div className="flex items-center gap-2 mb-1 ml-1">
                                                    <div className="w-6 h-6 rounded-full bg-surfaceHighlight border border-white/10 flex items-center justify-center text-[10px] font-bold text-textMuted">
                                                        {msg.sender_name?.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-textMuted">{msg.sender_name}</span>
                                                    <span className="text-[10px] text-textMuted/50">{parseUTCDate(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div className={cn(
                                                "relative px-4 py-2.5 max-w-[85%] text-sm shadow-sm",
                                                isMe
                                                    ? "bg-primary text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-surfaceHighlight text-text rounded-2xl rounded-tl-sm border border-white/5"
                                            )}>
                                                {msg.content}
                                                {/* Timestamp for me inside bubble */}
                                                {isMe && <span className="text-[9px] text-white/50 block text-right mt-1 -mb-1">{parseUTCDate(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 pt-2">
                            <form onSubmit={handleSendMessage} className="bg-surfaceHighlight/50 border border-white/10 rounded-xl p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all shadow-lg relative">
                                <input
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder={`Enviar mensaje a #${currentChannelInfo.name}...`}
                                    className="flex-1 bg-transparent border-none text-sm px-2 text-text placeholder:text-textMuted/50 focus:outline-none"
                                    disabled={!activeChannel}
                                />
                                <button
                                    type="submit"
                                    disabled={!activeChannel || !inputText.trim()}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shadow-md"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </>
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
    const prevTicketsRef = useRef([]);

    // Ticket State
    const [tickets, setTickets] = useState([]);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [transferTicketId, setTransferTicketId] = useState(null);
    const [viewTicketOperator, setViewTicketOperator] = useState(null);

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('neron_theme') !== 'light');

    // Apply Theme
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            localStorage.setItem('neron_theme', newMode ? 'dark' : 'light');
            return newMode;
        });
    };

    const addToast = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const fetchOperators = async () => {
        try {
            // Fetch Operators and Tickets
            const [resOps, resTickets] = await Promise.all([
                fetch('/api/operators'),
                fetch('/api/tickets')
            ]);

            const dataOps = await resOps.json();
            const dataTickets = await resTickets.json();

            if (dataOps.operators) {
                // Check for status changes
                const newOps = dataOps.operators;
                const prevOps = prevOperatorsRef.current;

                if (prevOps.length > 0 && user) {
                    newOps.forEach(newOp => {
                        const oldOp = prevOps.find(p => p.id === newOp.id);
                        if (oldOp && oldOp.status !== newOp.status && newOp.id !== user.id) {
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

            if (dataTickets.tickets) {
                const newTickets = dataTickets.tickets;
                const prevTickets = prevTicketsRef.current;

                if (prevTickets.length > 0 && user) {
                    newTickets.forEach(ticket => {
                        const oldTicket = prevTickets.find(p => p.id === ticket.id);

                        // Scenario 1: New Ticket
                        if (!oldTicket) {
                            if (ticket.created_by !== user.id) {
                                addToast(
                                    <span>Nuevo ticket <strong className="font-bold text-base">#{ticket.id}</strong> de <strong className="font-bold">{ticket.client_name}</strong> creado por {ticket.creator_name || 'Sistema'}</span>,
                                    'warning'
                                );
                            }
                        }
                        if (oldTicket) {
                            // Scenario 2: Status Change
                            if (oldTicket.status !== ticket.status) {
                                // Ticket Taken (Assigned)
                                if (ticket.status === 'assigned' && ticket.assigned_to !== user.id) {
                                    addToast(
                                        <span><strong className="font-bold">{ticket.assignee_name}</strong> ha recogido el ticket <strong className="font-bold">#{ticket.id}</strong> de <strong className="font-bold">{ticket.client_name}</strong></span>,
                                        'available'
                                    );
                                }
                                // Ticket Finished (Completed)
                                else if (ticket.status === 'completed' && oldTicket.status !== 'completed') {
                                    if (ticket.assigned_to !== user.id) {
                                        addToast(
                                            <span>Ticket <strong className="font-bold">#{ticket.id}</strong> de <strong className="font-bold">{ticket.client_name}</strong> finalizado por <strong className="font-bold">{ticket.assignee_name || 'Sistema'}</strong></span>,
                                            'success'
                                        );
                                    }
                                }
                            }

                            // Scenario 3: Ticket Transferred (Detect by assigned_to change)
                            if (ticket.status === 'assigned' && oldTicket.assigned_to !== null && oldTicket.assigned_to !== ticket.assigned_to) {
                                // If I am the receiver
                                if (ticket.assigned_to === user.id) {
                                    addToast(
                                        <span>¡Has recibido el ticket <strong className="font-bold">#{ticket.id}</strong> de <strong className="font-bold">{ticket.transferor_name}</strong>!</span>,
                                        'warning'
                                    );
                                }
                                // If I am neither sender nor receiver
                                else if (oldTicket.assigned_to !== user.id) {
                                    addToast(
                                        <span><strong className="font-bold">{ticket.transferor_name}</strong> ha traspasado el ticket <strong className="font-bold">#{ticket.id}</strong> a <strong className="font-bold">{ticket.assignee_name}</strong></span>,
                                        'status'
                                    );
                                }
                            }
                        }
                    });
                }
                setTickets(newTickets);
                prevTicketsRef.current = newTickets;
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // Ticket Actions
    const handleCreateTicket = async (ticketData) => {
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...ticketData, created_by: user.id }),
            });
            if (res.ok) {
                addToast('Ticket creado correctamente', 'success');
                fetchOperators();
            } else {
                addToast('Error creando ticket', 'error');
            }
        } catch (err) { console.error(err); addToast('Error creando ticket', 'error'); }
    };

    const handleAssignTicket = async (ticketId) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: user.id, status: 'assigned' }),
            });
            if (res.ok) {
                addToast('Ticket asignado a ti', 'success');
                fetchOperators();
            }
        } catch (err) { console.error(err); addToast('Error asignando ticket', 'error'); }
    };

    const handleCompleteTicket = async (ticketId) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            if (res.ok) {
                addToast('Ticket completado', 'success');
                fetchOperators();
            }
        } catch (err) { console.error(err); addToast('Error completando ticket', 'error'); }
    };

    const handleTransferTicket = async (targetOperatorId) => {
        if (!user || !transferTicketId) return;
        try {
            const res = await fetch(`/api/tickets/${transferTicketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assigned_to: targetOperatorId,
                    transferred_from: user.id
                }),
            });
            if (res.ok) {
                const targetOp = operators.find(op => op.id === targetOperatorId);
                addToast(`Ticket traspasado a ${targetOp?.name}`, 'success');
                setTransferTicketId(null);
                fetchOperators();
            }
        } catch (err) { console.error(err); addToast('Error traspasando ticket', 'error'); }
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

            <CreateTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onCreate={handleCreateTicket} />
            <TransferTicketModal
                isOpen={!!transferTicketId}
                onClose={() => setTransferTicketId(null)}
                onTransfer={handleTransferTicket}
                operators={operators}
                currentUserId={user.id}
                ticketId={transferTicketId}
            />
            <TicketHistoryModal operator={viewTicketOperator} tickets={tickets} onClose={() => setViewTicketOperator(null)} />

            {/* Header */}
            <header className="max-w-[95rem] mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Phone className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Centralita <span className="text-primary">Nerón</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-surface border border-white/5 hover:bg-surfaceHighlight text-textMuted hover:text-primary transition-all shadow-sm"
                        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

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
                </div>
            </header>

            <main className="max-w-[95rem] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                {/* Left Column: My Status Control */}
                <div className="md:col-span-4 xl:col-span-3 space-y-6">
                    {user.role === 'admin' ? (
                        <AdminPanel operators={operators} refresh={fetchOperators} addToast={addToast} setConfirmModal={setConfirmModal} />
                    ) : (
                        <>
                            {/* Status Section - Fixed Height */}
                            <div className="bg-surface border border-white/5 rounded-2xl p-4 shrink-0">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> Mi Estado
                                </h2>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateUserProfile({ status: 'available' })}
                                        className={cn(
                                            "w-full p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 border-2",
                                            user.status === 'available'
                                                ? "bg-success/20 border-success shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-102"
                                                : "bg-surfaceHighlight border-transparent hover:bg-surfaceHighlight/80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <div className={cn("p-1 rounded-full", user.status === 'available' ? "bg-success text-white" : "bg-white/10")}>
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">Disponible</span>
                                    </button>

                                    {/* Simplified Status List for space */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => updateUserProfile({ status: 'busy' })} className={cn("p-2 rounded-lg flex items-center gap-2 justify-center border transition-all", user.status === 'busy' ? "bg-error/20 border-error text-error" : "bg-surfaceHighlight border-transparent opacity-70")}>
                                            <XCircle className="w-4 h-4" /> <span className="text-xs font-bold">Ocupado</span>
                                        </button>
                                        <button onClick={() => updateUserProfile({ status: 'away' })} className={cn("p-2 rounded-lg flex items-center gap-2 justify-center border transition-all", user.status === 'away' ? "bg-warning/20 border-warning text-warning" : "bg-surfaceHighlight border-transparent opacity-70")}>
                                            <MinusCircle className="w-4 h-4" /> <span className="text-xs font-bold">Ausente</span>
                                        </button>
                                    </div>

                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <h3 className="text-xs font-bold text-textMuted uppercase mb-2 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Mi Jornada
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => updateUserProfile({ shift: 'morning' })}
                                            className={cn(
                                                "p-2 rounded-lg text-xs font-bold transition-all border",
                                                user.shift === 'morning'
                                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                                    : "bg-surfaceHighlight text-textMuted hover:text-white hover:bg-surfaceHighlight/80 border-transparent"
                                            )}
                                        >
                                            Mañana
                                        </button>
                                        <button
                                            onClick={() => updateUserProfile({ shift: 'afternoon' })}
                                            className={cn(
                                                "p-2 rounded-lg text-xs font-bold transition-all border",
                                                user.shift === 'afternoon'
                                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                                                    : "bg-surfaceHighlight text-textMuted hover:text-white hover:bg-surfaceHighlight/80 border-transparent"
                                            )}
                                        >
                                            Tarde
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </>
                    )}
                </div>

                {/* Middle Column: Ticket Queue - Reduced Height & Sticky */}
                <div className="md:col-span-4 xl:col-span-3 h-[600px] sticky top-8">
                    <TicketQueue
                        tickets={tickets}
                        onAssign={handleAssignTicket}
                        onComplete={handleCompleteTicket}
                        onTransfer={setTransferTicketId}
                        onCreate={() => setIsTicketModalOpen(true)}
                        user={user}
                    />
                </div>

                {/* Right Column: Directory */}
                <div className="md:col-span-4 xl:col-span-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" /> Directorio ({operators.length})
                        </h2>
                        <div className="text-xs text-textMuted flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Actualizando
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {sortedDeptKeys.map(dept => (
                            <div key={dept} className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-surface/30 p-3 rounded-xl border border-white/5 h-fit min-w-0">
                                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3 px-1 border-b border-white/5 pb-2 flex justify-between items-center">
                                    <span className="truncate mr-2" title={dept}>{dept.replace('Dpto.', '')}</span>
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-text text-[10px]">{operatorsByDept[dept].length}</span>
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {operatorsByDept[dept].length > 0 ? (
                                        operatorsByDept[dept].map(op => {
                                            const opTickets = tickets.filter(t => t.assigned_to === op.id && t.status !== 'completed').length;
                                            return <OperatorCard key={op.id} operator={op} ticketCount={opTickets} onViewTickets={setViewTicketOperator} />;
                                        })
                                    ) : (
                                        <div className="col-span-1 text-center py-4 text-textMuted text-[10px] italic opacity-50 border border-dashed border-white/10 rounded-lg">
                                            Vacío
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
            {/* Floating Chat Widget - Rendered globally */}
            {user && user.role !== 'admin' && <ChatWidget user={user} operators={operators} />}
        </div>
    );
}
