import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart2, Calendar, Users, Package, Gift, TrendingUp,
  Bell, LogOut, Plus, Trash2, Edit3, ChevronDown,
  ChevronLeft, ChevronRight, Shield, Check, X as XIcon,
  Search, UserPlus, Key,
} from 'lucide-react';
import { DESIGNS, CATEGORIES } from '../../data';
import { Modal } from '../../components/ui/Modal';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Resumen',   icon: BarChart2 },
  { id: 'catalog',   label: 'Catálogo',  icon: Package   },
  { id: 'agenda',    label: 'Agenda',    icon: Calendar  },
  { id: 'clients',   label: 'Clientas',  icon: Users     },
  { id: 'users',     label: 'Usuarios',  icon: Shield    },
  { id: 'giftcards', label: 'Gift Cards',icon: Gift      },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_APPOINTMENTS = [
  { id: 1, client: 'Ana López',    service: 'Botanical Garden',      time: '10:00', color: '#c9a96e' },
  { id: 2, client: 'Laura Martínez',service: 'Chrome Espejo Dorado', time: '11:30', color: '#9b8ea8' },
  { id: 3, client: 'Sofía Ruiz',   service: 'Encapsulado Flores',    time: '14:00', color: '#8aab8a' },
  { id: 4, client: 'Carmen Villa', service: 'Ombre Terracota',       time: '16:00', color: '#d4613a' },
];

const MOCK_CLIENTS = [
  { id: 1, name: 'Valentina Ríos',  phone: '+52 55 1234', visits: 12, points: 240, lastVisit: '10 Sep 2026', lastDesign: 'Botanical Garden' },
  { id: 2, name: 'Camila Serrano',  phone: '+52 55 5678', visits: 8,  points: 160, lastVisit: '5 Sep 2026',  lastDesign: 'Encapsulado Flores' },
  { id: 3, name: 'María José López',phone: '+52 55 9012', visits: 5,  points: 100, lastVisit: '1 Sep 2026',  lastDesign: 'Marble Luxe' },
  { id: 4, name: 'Andrea Fuentes', phone: '+52 55 3456', visits: 3,  points: 60,  lastVisit: '28 Ago 2026', lastDesign: 'French Clásico' },
];

const MOCK_GIFTCARDS = [
  { code: 'NS-GC-A1B2', amount: 500,  used: false, buyer: 'Ana R.'   },
  { code: 'NS-GC-C3D4', amount: 1000, used: true,  buyer: 'Laura M.' },
  { code: 'NS-GC-E5F6', amount: 300,  used: false, buyer: 'Sofía V.' },
];

// ─── Roles & permissions ──────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { key: 'catalog_view',   label: 'Ver catálogo'      },
  { key: 'catalog_edit',   label: 'Editar catálogo'   },
  { key: 'bookings_view',  label: 'Ver reservas'      },
  { key: 'bookings_edit',  label: 'Editar reservas'   },
  { key: 'clients_view',   label: 'Ver clientas'      },
  { key: 'clients_edit',   label: 'Editar clientas'   },
  { key: 'giftcards',      label: 'Gift Cards'        },
  { key: 'users_manage',   label: 'Gestionar usuarios'},
  { key: 'reports',        label: 'Ver reportes'      },
];

const ROLES = [
  {
    id: 'admin',
    name: 'Administrador',
    color: '#c9a96e',
    permissions: ALL_PERMISSIONS.map(p => p.key),
  },
  {
    id: 'artist',
    name: 'Artista',
    color: '#9b8ea8',
    permissions: ['catalog_view', 'bookings_view', 'bookings_edit', 'clients_view'],
  },
  {
    id: 'receptionist',
    name: 'Recepcionista',
    color: '#8aab8a',
    permissions: ['catalog_view', 'bookings_view', 'bookings_edit', 'clients_view', 'clients_edit', 'giftcards'],
  },
];

interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin: string;
}

const INITIAL_USERS: AppUser[] = [
  { id: 1, name: 'Fernanda Torres',   email: 'admin@nailsstudio.com',        role: 'admin',        active: true,  lastLogin: '17 Sep 2026, 09:12' },
  { id: 2, name: 'Gabriela Morales',  email: 'gaby@nailsstudio.com',         role: 'artist',       active: true,  lastLogin: '16 Sep 2026, 14:35' },
  { id: 3, name: 'Daniela Reyes',     email: 'dani@nailsstudio.com',         role: 'artist',       active: true,  lastLogin: '15 Sep 2026, 11:00' },
  { id: 4, name: 'Paola Vázquez',     email: 'recepcion@nailsstudio.com',    role: 'receptionist', active: true,  lastLogin: '17 Sep 2026, 08:50' },
  { id: 5, name: 'Sofía Castillo',    email: 'sofia.castillo@nailsstudio.com',role: 'artist',      active: false, lastLogin: '10 Sep 2026, 16:20' },
];

// ─── Pagination hook ──────────────────────────────────────────────────────────
function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated  = items.slice((page - 1) * pageSize, page * pageSize);
  const safeSet    = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));
  return { paginated, page, totalPages, setPage: safeSet };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();

  // ── State
  const [tab,         setTab]         = useState('overview');
  const [designs,     setDesigns]     = useState(DESIGNS);
  const [users,       setUsers]       = useState<AppUser[]>(INITIAL_USERS);
  const [searchDesign,setSearchDesign]= useState('');
  const [searchUser,  setSearchUser]  = useState('');
  const [selectedRole,setSelectedRole]= useState(ROLES[0]);

  // Modals
  const [deleteDesignModal, setDeleteDesignModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleteUserModal,   setDeleteUserModal]   = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [addUserModal,      setAddUserModal]       = useState(false);
  const [addDesignModal,    setAddDesignModal]     = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'artist' });
  const [newDesign, setNewDesign] = useState({ name: '', category: 'mano-alzada', price: '', duration: '' });

  useEffect(() => {
    if (!localStorage.getItem('ns_admin')) navigate('/admin');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('ns_admin');
    navigate('/admin');
  };

  // ── Catalog pagination (5 per page)
  const filteredDesigns = designs.filter(d =>
    d.name.toLowerCase().includes(searchDesign.toLowerCase())
  );
  const catalogPag = usePagination(filteredDesigns, 5);

  // ── Users pagination (6 per page)
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );
  const usersPag = usePagination(filteredUsers, 6);

  const confirmDeleteDesign = () => {
    if (deleteDesignModal.id) setDesigns(d => d.filter(x => x.id !== deleteDesignModal.id));
    setDeleteDesignModal({ open: false, id: null });
  };

  const confirmDeleteUser = () => {
    if (deleteUserModal.id) setUsers(u => u.filter(x => x.id !== deleteUserModal.id));
    setDeleteUserModal({ open: false, id: null });
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUsers(u => [...u, {
      id: Date.now(), name: newUser.name, email: newUser.email,
      role: newUser.role, active: true, lastLogin: '—',
    }]);
    setNewUser({ name: '', email: '', role: 'artist' });
    setAddUserModal(false);
  };

  const handleAddDesign = () => {
    if (!newDesign.name || !newDesign.price) return;
    setDesigns(d => [...d, {
      id: Date.now(), name: newDesign.name, category: newDesign.category,
      price: Number(newDesign.price), duration: Number(newDesign.duration) || 90,
      occasion: 'everyday', complexity: 'medium',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop',
      description: '', technique: '', tags: [],
    }]);
    setNewDesign({ name: '', category: 'mano-alzada', price: '', duration: '' });
    setAddDesignModal(false);
  };

  const toggleUserActive = (id: number) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, active: !x.active } : x));
  };

  const roleOf = (roleId: string) => ROLES.find(r => r.id === roleId) ?? ROLES[0];

  // ── Input style helper
  const inputCls = "w-full bg-[#0d0b0a] border border-[#2e2518] rounded px-3 py-2.5 text-[#f0ebe4] text-sm focus:outline-none focus:border-[#c9a96e] transition-colors";

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-[#0d0b0a] border-r border-[#2e2518] flex flex-col py-6 px-4 fixed top-0 left-0 bottom-0 z-40 hidden lg:flex">
        <p className="font-serif text-lg text-[#f0ebe4] mb-8 px-2">Nails <span className="text-[#c9a96e]">Admin</span></p>
        <nav className="flex-1 space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${tab === t.id ? 'bg-[#c9a96e]/15 text-[#c9a96e]' : 'text-[#8a7d6e] hover:text-[#f0ebe4] hover:bg-[#2a2018]'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-[#8a7d6e] hover:text-[#d4613a] text-sm transition-colors">
          <LogOut size={14} /> Cerrar sesión
        </button>
      </aside>

      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0b0a] border-t border-[#2e2518] flex overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[4rem] py-3 flex flex-col items-center gap-1 text-[9px] transition-colors ${tab === t.id ? 'text-[#c9a96e]' : 'text-[#8a7d6e]'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <main className="lg:ml-56 flex-1 p-6 pb-24 lg:pb-6 pt-8 max-w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-2xl text-[#f0ebe4]">{TABS.find(t => t.id === tab)?.label}</h1>
          <div className="flex items-center gap-3">
            <button className="relative text-[#8a7d6e] hover:text-[#f0ebe4]">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#d4613a] rounded-full text-[8px] text-white flex items-center justify-center">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#2a2018] border border-[#c9a96e]/30 flex items-center justify-center font-serif text-[#c9a96e] text-sm">A</div>
          </div>
        </div>

        {/* ════════════════════════════════════
            OVERVIEW
        ════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Citas hoy',       value: '4',     change: '+2',  icon: Calendar   },
                { label: 'Ingresos semana', value: '$1,840', change: '+12%',icon: TrendingUp },
                { label: 'Clientas activas',value: '127',   change: '+8',  icon: Users      },
                { label: 'Stock bajo',      value: '3',     change: '',    icon: Package    },
              ].map(s => (
                <div key={s.label} className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#8a7d6e] text-xs font-mono">{s.label}</p>
                    <s.icon size={14} className="text-[#c9a96e]" />
                  </div>
                  <p className="font-serif text-3xl text-[#f0ebe4]">{s.value}</p>
                  {s.change && <p className="text-[#8aab8a] text-xs mt-1">{s.change} vs semana pasada</p>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
                <p className="text-[#f0ebe4] text-sm font-medium mb-4">Citas de hoy</p>
                <div className="space-y-3">
                  {MOCK_APPOINTMENTS.map(a => (
                    <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-[#2e2518] last:border-0">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="flex-1">
                        <p className="text-[#f0ebe4] text-sm">{a.client}</p>
                        <p className="text-[#8a7d6e] text-xs">{a.service}</p>
                      </div>
                      <p className="font-mono text-[#c9a96e] text-sm">{a.time}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
                <p className="text-[#f0ebe4] text-sm font-medium mb-4">Servicios más solicitados</p>
                <div className="space-y-3">
                  {[
                    { name: 'Mano Alzada', pct: 85 },
                    { name: 'Acrílicas',   pct: 72 },
                    { name: 'Efectos Chrome', pct: 60 },
                    { name: 'Encapsulados',pct: 48 },
                  ].map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8a7d6e]">{s.name}</span>
                        <span className="text-[#c9a96e]">{s.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2018] rounded-full overflow-hidden">
                        <div className="h-full bg-[#c9a96e] rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            CATALOG
        ════════════════════════════════════ */}
        {tab === 'catalog' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7d6e]" />
                <input
                  value={searchDesign}
                  onChange={e => { setSearchDesign(e.target.value); catalogPag.setPage(1); }}
                  placeholder="Buscar diseño…"
                  className="pl-8 pr-4 py-2 bg-[#181310] border border-[#2e2518] rounded text-sm text-[#f0ebe4] placeholder-[#8a7d6e] focus:outline-none focus:border-[#c9a96e] w-56 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[#8a7d6e] text-sm">{filteredDesigns.length} diseños</p>
                <button onClick={() => setAddDesignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] transition-colors">
                  <Plus size={14} /> Agregar diseño
                </button>
              </div>
            </div>

            <div className="bg-[#181310] border border-[#2e2518] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2518]">
                    {['Diseño', 'Categoría', 'Precio', 'Duración', 'Acciones'].map(h => (
                      <th key={h} className="text-left text-[#8a7d6e] font-mono text-xs py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalogPag.paginated.map(d => (
                    <tr key={d.id} className="border-b border-[#2e2518] hover:bg-[#2a2018]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={d.image} alt={d.name} className="w-10 h-10 object-cover rounded shrink-0" />
                          <span className="text-[#f0ebe4]">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#8a7d6e]">{CATEGORIES.find(c => c.id === d.category)?.name ?? d.category}</td>
                      <td className="py-3 px-4 text-[#c9a96e] font-mono">${d.price}</td>
                      <td className="py-3 px-4 text-[#8a7d6e]">{d.duration} min</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button className="text-[#8a7d6e] hover:text-[#c9a96e] transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => setDeleteDesignModal({ open: true, id: d.id })} className="text-[#8a7d6e] hover:text-[#d4613a] transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {catalogPag.paginated.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-[#8a7d6e] text-sm">Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination page={catalogPag.page} total={catalogPag.totalPages} onChange={catalogPag.setPage} count={filteredDesigns.length} pageSize={5} />
          </div>
        )}

        {/* ════════════════════════════════════
            AGENDA
        ════════════════════════════════════ */}
        {tab === 'agenda' && (
          <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-6">
            <p className="text-[#f0ebe4] font-serif text-lg mb-5">Septiembre 2026</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8a7d6e] mb-3">
              {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 2 }).map((_, i) => <div key={`p${i}`} />)}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const hasAppt = [10, 12, 15, 17, 20, 22].includes(day);
                const isToday = day === 17;
                return (
                  <div key={day} className={`aspect-square rounded flex flex-col items-center justify-center text-xs cursor-pointer transition-colors
                    ${isToday ? 'bg-[#c9a96e] text-[#0d0b0a] font-bold' :
                      hasAppt ? 'bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e]' :
                      'text-[#8a7d6e] hover:bg-[#2a2018]'}`}>
                    {day}
                    {hasAppt && !isToday && <div className="w-1 h-1 rounded-full bg-[#c9a96e] mt-0.5" />}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest mb-3">Citas del día</p>
              {MOCK_APPOINTMENTS.map(a => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-[#2e2518] last:border-0">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: a.color }} />
                  <div className="flex-1">
                    <p className="text-[#f0ebe4] text-sm">{a.client}</p>
                    <p className="text-[#8a7d6e] text-xs">{a.service}</p>
                  </div>
                  <p className="font-mono text-[#c9a96e] text-sm">{a.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            CLIENTS
        ════════════════════════════════════ */}
        {tab === 'clients' && (
          <div className="space-y-4">
            {MOCK_CLIENTS.map(c => (
              <div key={c.id} className="bg-[#181310] border border-[#2e2518] rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start hover:border-[#3a3020] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#2a2018] border border-[#c9a96e]/30 flex items-center justify-center font-serif text-[#c9a96e] shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-[#f0ebe4] font-medium">{c.name}</p>
                      <p className="text-[#8a7d6e] text-xs">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-[#c9a96e]/15 border border-[#c9a96e]/30 rounded-full text-[#c9a96e] text-xs font-mono">
                        {c.points} pts
                      </div>
                      <button className="text-xs text-[#8a7d6e] hover:text-[#c9a96e] flex items-center gap-1 transition-colors">
                        Historial <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-3 text-xs text-[#8a7d6e]">
                    <span>Visitas: <span className="text-[#f0ebe4]">{c.visits}</span></span>
                    <span>Última: <span className="text-[#f0ebe4]">{c.lastVisit}</span></span>
                    <span>Diseño: <span className="text-[#c9a96e]">{c.lastDesign}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════
            USERS & ROLES
        ════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="space-y-6">
            {/* Roles overview */}
            <div>
              <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                <Key size={11} /> Roles y permisos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => setSelectedRole(r)}
                    className={`text-left bg-[#181310] border rounded-xl p-4 transition-all ${selectedRole.id === r.id ? 'border-[#c9a96e]/60 shadow-[0_0_20px_rgba(201,169,110,0.08)]' : 'border-[#2e2518] hover:border-[#3a3020]'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                      <p className="text-[#f0ebe4] text-sm font-medium">{r.name}</p>
                    </div>
                    <p className="text-[#8a7d6e] text-xs">{r.permissions.length} permisos</p>
                    <p className="text-[#8a7d6e] text-xs mt-0.5">
                      {users.filter(u => u.role === r.id).length} usuario(s)
                    </p>
                  </button>
                ))}
              </div>

              {/* Permissions grid for selected role */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: selectedRole.color }} />
                  <p className="text-[#f0ebe4] text-sm font-medium">{selectedRole.name} — Permisos</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_PERMISSIONS.map(p => {
                    const has = selectedRole.permissions.includes(p.key);
                    return (
                      <div key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded text-xs ${has ? 'bg-[#8aab8a]/10 text-[#8aab8a]' : 'bg-[#2a2018]/50 text-[#4a4238]'}`}>
                        {has
                          ? <Check size={11} className="shrink-0" />
                          : <XIcon size={11} className="shrink-0" />
                        }
                        {p.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Users table */}
            <div>
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7d6e]" />
                  <input
                    value={searchUser}
                    onChange={e => { setSearchUser(e.target.value); usersPag.setPage(1); }}
                    placeholder="Buscar usuario…"
                    className="pl-8 pr-4 py-2 bg-[#181310] border border-[#2e2518] rounded text-sm text-[#f0ebe4] placeholder-[#8a7d6e] focus:outline-none focus:border-[#c9a96e] w-56 transition-colors"
                  />
                </div>
                <button onClick={() => setAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] transition-colors">
                  <UserPlus size={14} /> Nuevo usuario
                </button>
              </div>

              <div className="bg-[#181310] border border-[#2e2518] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2518]">
                      {['Usuario', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                        <th key={h} className="text-left text-[#8a7d6e] font-mono text-xs py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersPag.paginated.map(u => {
                      const role = roleOf(u.role);
                      return (
                        <tr key={u.id} className="border-b border-[#2e2518] hover:bg-[#2a2018]/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border"
                                style={{ background: role.color + '20', borderColor: role.color + '40', color: role.color }}>
                                {u.name[0]}
                              </div>
                              <div>
                                <p className="text-[#f0ebe4]">{u.name}</p>
                                <p className="text-[#8a7d6e] text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: role.color + '18', color: role.color }}>
                              {role.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => toggleUserActive(u.id)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${u.active ? 'bg-[#8aab8a]/15 text-[#8aab8a] hover:bg-[#8aab8a]/25' : 'bg-[#d4613a]/15 text-[#d4613a] hover:bg-[#d4613a]/25'}`}>
                              {u.active ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-[#8a7d6e] text-xs font-mono">{u.lastLogin}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button className="text-[#8a7d6e] hover:text-[#c9a96e] transition-colors"><Edit3 size={14} /></button>
                              {u.role !== 'admin' && (
                                <button onClick={() => setDeleteUserModal({ open: true, id: u.id })}
                                  className="text-[#8a7d6e] hover:text-[#d4613a] transition-colors"><Trash2 size={14} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {usersPag.paginated.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-[#8a7d6e] text-sm">Sin resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination page={usersPag.page} total={usersPag.totalPages} onChange={usersPag.setPage} count={filteredUsers.length} pageSize={6} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            GIFT CARDS
        ════════════════════════════════════ */}
        {tab === 'giftcards' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MOCK_GIFTCARDS.map(g => (
              <div key={g.code} className={`bg-[#181310] border rounded-xl p-5 ${g.used ? 'border-[#2e2518] opacity-60' : 'border-[#c9a96e]/30'}`}>
                <div className="flex justify-between items-start mb-3">
                  <Gift size={18} className={g.used ? 'text-[#8a7d6e]' : 'text-[#c9a96e]'} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${g.used ? 'bg-[#2a2018] text-[#8a7d6e]' : 'bg-[#c9a96e]/15 text-[#c9a96e]'}`}>
                    {g.used ? 'Usado' : 'Activo'}
                  </span>
                </div>
                <p className="font-mono text-[#c9a96e] text-xl mb-1">${g.amount}</p>
                <p className="text-[#8a7d6e] text-xs font-mono">{g.code}</p>
                <p className="text-[#8a7d6e] text-xs mt-2">Comprador: {g.buyer}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}

      {/* Delete design */}
      <Modal open={deleteDesignModal.open} onClose={() => setDeleteDesignModal({ open: false, id: null })} title="Eliminar diseño" size="sm">
        <p className="text-[#8a7d6e] mb-6">¿Segura que deseas eliminar este diseño? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteDesignModal({ open: false, id: null })}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={confirmDeleteDesign}
            className="flex-1 py-2.5 bg-[#d4613a] text-white text-sm rounded hover:bg-[#e06848] transition-colors">Eliminar</button>
        </div>
      </Modal>

      {/* Delete user */}
      <Modal open={deleteUserModal.open} onClose={() => setDeleteUserModal({ open: false, id: null })} title="Eliminar usuario" size="sm">
        <p className="text-[#8a7d6e] mb-6">¿Eliminar este usuario? Perderá acceso inmediatamente.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteUserModal({ open: false, id: null })}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={confirmDeleteUser}
            className="flex-1 py-2.5 bg-[#d4613a] text-white text-sm rounded hover:bg-[#e06848] transition-colors">Eliminar</button>
        </div>
      </Modal>

      {/* Add user */}
      <Modal open={addUserModal} onClose={() => setAddUserModal(false)} title="Nuevo usuario" size="sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre completo</label>
            <input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
              placeholder="Ej. Gabriela Morales" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
              placeholder="usuario@nailsstudio.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Rol</label>
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
              className={inputCls}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAddUserModal(false)}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={handleAddUser}
            className="flex-1 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] transition-colors">Crear usuario</button>
        </div>
      </Modal>

      {/* Add design */}
      <Modal open={addDesignModal} onClose={() => setAddDesignModal(false)} title="Agregar diseño" size="sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre del diseño</label>
            <input value={newDesign.name} onChange={e => setNewDesign(d => ({ ...d, name: e.target.value }))}
              placeholder="Ej. Botanical Nude" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría</label>
            <select value={newDesign.category} onChange={e => setNewDesign(d => ({ ...d, category: e.target.value }))}
              className={inputCls}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Precio ($)</label>
              <input type="number" value={newDesign.price} onChange={e => setNewDesign(d => ({ ...d, price: e.target.value }))}
                placeholder="350" className={inputCls} />
            </div>
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Duración (min)</label>
              <input type="number" value={newDesign.duration} onChange={e => setNewDesign(d => ({ ...d, duration: e.target.value }))}
                placeholder="90" className={inputCls} />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAddDesignModal(false)}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={handleAddDesign}
            className="flex-1 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] transition-colors">Guardar diseño</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Pagination component ─────────────────────────────────────────────────────
function Pagination({ page, total, onChange, count, pageSize }: {
  page: number; total: number; onChange: (p: number) => void; count: number; pageSize: number;
}) {
  if (total <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-[#8a7d6e] text-xs font-mono">
        Mostrando {from}–{to} de {count}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e] hover:text-[#c9a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => onChange(i + 1)}
            className={`w-8 h-8 flex items-center justify-center rounded border text-xs transition-colors ${page === i + 1 ? 'border-[#c9a96e] bg-[#c9a96e]/15 text-[#c9a96e]' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e] hover:text-[#c9a96e]'}`}>
            {i + 1}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === total}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e] hover:text-[#c9a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
