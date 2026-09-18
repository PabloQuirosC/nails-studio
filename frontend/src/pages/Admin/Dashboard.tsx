import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart2, Calendar, Users, Package, Gift, TrendingUp,
  Bell, LogOut, Plus, Trash2, Edit3, ChevronDown,
  ChevronLeft, ChevronRight, Shield, Check, X as XIcon,
  Search, UserPlus, Key, Clock, Star, ArrowRight, Sparkles,
  Phone, MessageCircle, Crown, Copy,
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
  const [categories,  setCategories]  = useState(CATEGORIES);
  const [catalogSubtab, setCatalogSubtab] = useState<'designs' | 'categories'>('designs');
  const [searchCat,   setSearchCat]   = useState('');
  const [users,       setUsers]       = useState<AppUser[]>(INITIAL_USERS);
  const [searchDesign,setSearchDesign]= useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchUser,  setSearchUser]  = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [usersSubtab, setUsersSubtab] = useState<'users' | 'roles'>('users');
  const [searchClient,setSearchClient]= useState('');
  const [clientTier,  setClientTier]  = useState<'all' | 'vip' | 'oro' | 'nueva'>('all');
  const [selectedRole,setSelectedRole]= useState(ROLES[0]);

  // Modals
  const [deleteDesignModal, setDeleteDesignModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleteUserModal,   setDeleteUserModal]   = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [addUserModal,      setAddUserModal]       = useState(false);
  const [addDesignModal,    setAddDesignModal]     = useState(false);
  const [addCategoryModal,  setAddCategoryModal]   = useState(false);
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [catDeleteError, setCatDeleteError] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', icon: '💅', color: '#c9a96e', description: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'artist' });
  const [newDesign, setNewDesign] = useState({ name: '', category: 'mano-alzada', price: '', duration: '' });
  const [giftCards, setGiftCards] = useState(MOCK_GIFTCARDS.map(g => ({ ...g, recipient: '', created: 'Sep 2026' })));
  const [gcFilter, setGcFilter] = useState<'all' | 'active' | 'used'>('all');
  const [searchGc, setSearchGc] = useState('');
  const [addGcModal, setAddGcModal] = useState(false);
  const [deleteGcModal, setDeleteGcModal] = useState<{ open: boolean; code: string | null }>({ open: false, code: null });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newGc, setNewGc] = useState({ amount: '500', customAmount: '', buyer: '', recipient: '' });

  useEffect(() => {
    if (!localStorage.getItem('ns_admin')) navigate('/admin');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('ns_admin');
    navigate('/admin');
  };

  // ── Catalog filtering + stats (6 per page)
  const filteredDesigns = designs.filter(d => {
    const q = searchDesign.trim().toLowerCase();
    const matchQ = !q || d.name.toLowerCase().includes(q);
    const matchC = selectedCat === 'all' || d.category === selectedCat;
    return matchQ && matchC;
  });
  const catalogPag = usePagination(filteredDesigns, 6);
  const catCount = categories.length;
  const avgPrice = designs.length ? Math.round(designs.reduce((a, d) => a + d.price, 0) / designs.length) : 0;
  const avgDuration = designs.length ? Math.round(designs.reduce((a, d) => a + d.duration, 0) / designs.length) : 0;
  const filteredCats = categories.filter(c => {
    const q = searchCat.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });
  const designsInCat = (catId: string) => designs.filter(d => d.category === catId).length;

  const slugify = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;

  const handleAddCategory = () => {
    const name = newCategory.name.trim();
    if (!name) return;
    const id = slugify(name);
    if (categories.some(c => c.id === id)) {
      setCatDeleteError('Ya existe una categoría con ese nombre.');
      return;
    }
    setCategories(cs => [...cs, { id, name, icon: newCategory.icon || '💅', color: newCategory.color, description: newCategory.description.trim() || 'Nueva colección del estudio' }]);
    setNewCategory({ name: '', icon: '💅', color: '#c9a96e', description: '' });
    setCatDeleteError('');
    setAddCategoryModal(false);
    setCatalogSubtab('categories');
  };

  const confirmDeleteCategory = () => {
    const id = deleteCategoryModal.id;
    if (!id) return;
    if (designs.some(d => d.category === id)) {
      setCatDeleteError('No se puede eliminar: tiene diseños asignados. Reasígnalos primero.');
      return;
    }
    setCategories(cs => cs.filter(c => c.id !== id));
    if (selectedCat === id) setSelectedCat('all');
    if (newDesign.category === id) setNewDesign(d => ({ ...d, category: categories[0]?.id ?? 'all' }));
    setCatDeleteError('');
    setDeleteCategoryModal({ open: false, id: null });
  };

  // ── Gift cards ──
  const genGcCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `NS-GC-${s}`;
  };
  const gcAmountOf = (g: { amount: number }) => g.amount;
  const gcActiveValue = giftCards.filter(g => !g.used).reduce((a, g) => a + gcAmountOf(g), 0);
  const gcUsedValue = giftCards.filter(g => g.used).reduce((a, g) => a + gcAmountOf(g), 0);
  const filteredGcs = giftCards.filter(g => {
    const q = searchGc.trim().toLowerCase();
    const matchQ = !q || g.code.toLowerCase().includes(q) || g.buyer.toLowerCase().includes(q) || (g.recipient ?? '').toLowerCase().includes(q);
    const matchF = gcFilter === 'all' || (gcFilter === 'active' ? !g.used : g.used);
    return matchQ && matchF;
  });
  const handleAddGc = () => {
    const amount = Number(newGc.customAmount || newGc.amount);
    if (!amount || amount <= 0 || !newGc.buyer.trim()) return;
    setGiftCards(gs => [...gs, {
      code: genGcCode(), amount, used: false,
      buyer: newGc.buyer.trim(), recipient: newGc.recipient.trim(), created: 'Sep 2026',
    }]);
    setNewGc({ amount: '500', customAmount: '', buyer: '', recipient: '' });
    setAddGcModal(false);
    setGcFilter('all');
  };
  const toggleGcUsed = (code: string) => {
    setGiftCards(gs => gs.map(g => g.code === code ? { ...g, used: !g.used } : g));
  };
  const confirmDeleteGc = () => {
    if (!deleteGcModal.code) return;
    setGiftCards(gs => gs.filter(g => g.code !== deleteGcModal.code));
    setDeleteGcModal({ open: false, code: null });
  };
  const copyGc = async (code: string) => {
    try { await navigator.clipboard?.writeText(code); } catch { /* portapapeles no disponible */ }
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(c => c === code ? null : c), 1600);
  };

  // ── Users filtering (6 per page)
  const filteredUsers = users.filter(u => {
    const q = searchUser.trim().toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchR = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchQ && matchR;
  });
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
      {/* ── Sidebar premium ── */}
      <aside className="w-60 fixed top-0 left-0 bottom-0 z-40 hidden lg:flex flex-col border-r border-[#231e14] overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #100c07 0%, #0d0b0a 45%, #0a0806 100%)' }}>
        {/* halo superior */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(201,169,110,0.16) 0%, transparent 70%)', filter: 'blur(10px)' }} />
        {/* Brand */}
        <div className="relative px-5 pt-6 pb-5 border-b border-[#231e14]/70">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-[#c9a96e]/40"
                style={{ background: 'linear-gradient(135deg,#2a2013,#14100a)', boxShadow: '0 0 20px rgba(201,169,110,0.25)' }}>
                <Sparkles size={16} className="text-[#e8d4a8]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#8aab8a] border-2 border-[#0d0b0a]" title="En línea" />
            </div>
            <div>
              <p className="font-serif text-[17px] leading-none text-[#f0ebe4]">Nails <span className="text-gradient-subtle">Studio</span></p>
              <p className="font-mono text-[#c9a96e] text-[9px] tracking-[0.3em] uppercase mt-1.5">Admin · Atelier</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-5" style={{ scrollbarWidth: 'thin' }}>
          {([
            { section: 'Gestión', ids: ['overview', 'catalog', 'agenda'] },
            { section: 'Personas', ids: ['clients', 'users'] },
            { section: 'Negocio', ids: ['giftcards'] },
          ] as const).map(group => (
            <div key={group.section}>
              <p className="px-3 mb-2 font-mono text-[9px] tracking-[0.28em] uppercase text-[#4a4238]">{group.section}</p>
              <div className="space-y-1">
                {group.ids.map(id => {
                  const t = TABS.find(x => x.id === id)!;
                  const active = tab === t.id;
                  const badge =
                    t.id === 'agenda' ? '4' :
                    t.id === 'catalog' ? String(designs.length) :
                    t.id === 'clients' ? String(MOCK_CLIENTS.length) :
                    t.id === 'users' ? String(users.length) :
                    t.id === 'giftcards' ? String(giftCards.filter(g => !g.used).length) : null;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-300 animate-slide-right ${active ? 'text-[#e8d4a8]' : 'text-[#8a7d6e] hover:text-[#f0ebe4] hover:bg-white/[0.04] hover:translate-x-0.5'}`}
                      style={active ? { background: 'linear-gradient(90deg, rgba(201,169,110,0.18) 0%, rgba(201,169,110,0.06) 100%)', boxShadow: 'inset 0 0 0 1px rgba(201,169,110,0.22)' } : undefined}>
                      {/* indicador activo */}
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300 ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}
                        style={{ background: 'linear-gradient(180deg,#e8d4a8,#c9a96e)', boxShadow: active ? '0 0 12px rgba(201,169,110,0.8)' : undefined }} />
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${active ? 'border border-[#c9a96e]/40' : 'border border-transparent bg-white/[0.03] group-hover:border-[#c9a96e]/20'}`}
                        style={active ? { background: 'linear-gradient(135deg,#2a2013,#14100a)', color: '#e8d4a8' } : undefined}>
                        <t.icon size={15} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
                      </span>
                      <span className="flex-1 text-left font-medium tracking-wide">{t.label}</span>
                      {badge && (
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md border transition-colors ${active ? 'bg-[#c9a96e]/20 text-[#e8d4a8] border-[#c9a96e]/30' : 'bg-white/[0.04] text-[#8a7d6e] border-[#2e2518] group-hover:text-[#c9a96e] group-hover:border-[#c9a96e]/25'}`}>
                          {badge}
                        </span>
                      )}
                      <ChevronRight size={12} className={`transition-all duration-300 ${active ? 'opacity-100 translate-x-0 text-[#c9a96e]' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Staff + salida */}
        <div className="relative p-3 border-t border-[#231e14]/70 space-y-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl border border-[#2e2518]/70 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border border-[#c9a96e]/40 text-[#e8d4a8]"
              style={{ background: 'linear-gradient(135deg,#2a2013,#14100a)' }}>F</div>
            <div className="flex-1 min-w-0">
              <p className="text-[#f0ebe4] text-[13px] font-medium truncate">Fernanda Torres</p>
              <p className="text-[#8a7d6e] text-[11px] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#8aab8a] animate-pulse" /> Administradora</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/')}
              className="py-2 rounded-xl border border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8] hover:border-[#c9a96e]/40 hover:bg-[#c9a96e]/[0.06] text-xs transition-all duration-300 hover:-translate-y-px">
              Ver sitio
            </button>
            <button onClick={handleLogout}
              className="py-2 rounded-xl border border-transparent text-[#8a7d6e] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 text-xs transition-all duration-300 hover:-translate-y-px flex items-center justify-center gap-1.5">
              <LogOut size={12} /> Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile tab bar premium ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#231e14] flex overflow-x-auto px-2 py-1.5"
        style={{ background: 'rgba(13,11,10,0.92)', backdropFilter: 'blur(16px)' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex-1 min-w-[4rem] py-2 flex flex-col items-center gap-1 text-[9px] rounded-lg transition-all duration-300 active:scale-95 ${active ? 'text-[#e8d4a8] bg-[#c9a96e]/12' : 'text-[#8a7d6e]'}`}>
              <span className={`absolute top-0 w-6 h-[2px] rounded-full transition-all duration-300 ${active ? 'opacity-100 bg-[#c9a96e]' : 'opacity-0'}`} style={active ? { boxShadow: '0 0 8px rgba(201,169,110,0.9)' } : undefined} />
              <t.icon size={16} className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Main content ── */}
      <main className="lg:ml-60 flex-1 p-6 pb-24 lg:pb-6 pt-8 max-w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-2xl text-[#f0ebe4]">{TABS.find(t => t.id === tab)?.label}</h1>
        </div>

        {/* ════════════════════════════════════
            OVERVIEW
        ════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* ── Saludo + acciones ── */}
            <div className="relative overflow-hidden rounded-2xl border border-[#c9a96e]/20 p-6 sm:p-7"
              style={{ background: 'linear-gradient(120deg, #1c150c 0%, #14100a 55%, #0d0b0a 100%)' }}>
              <div className="orb orb-gold" style={{ width: 320, height: 320, top: '-40%', right: '-5%', opacity: 0.22 }} />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                <div>
                  <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.28em] uppercase mb-2 flex items-center gap-2">
                    <Sparkles size={11} /> Jueves 18 · Septiembre 2026
                  </p>
                  <h2 className="font-serif text-[#f0ebe4] leading-tight" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}>
                    Buenos días, Fernanda
                  </h2>
                  <p className="text-[#8a7d6e] text-sm mt-1">
                    Tienes <span className="text-[#e8d4a8] font-medium">4 citas hoy</span> · ocupación al 68% · próxima a las 10:00
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => setTab('agenda')}
                    className="px-4 py-2.5 border border-[#c9a96e]/35 text-[#c9a96e] text-sm rounded-lg hover:bg-[#c9a96e]/10 transition-colors">
                    Ver agenda
                  </button>
                  <button onClick={() => setTab('agenda')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded-lg hover:bg-[#d4b87e] transition-colors">
                    <Plus size={14} /> Nueva cita
                  </button>
                </div>
              </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Citas hoy', value: '4', sub: '3 confirmadas · 1 pendiente', icon: Calendar, accent: '#c9a96e', spark: [35, 55, 40, 70, 58, 85, 64] },
                { label: 'Ingresos semana', value: '$1,840', sub: '+12% vs anterior', icon: TrendingUp, accent: '#8aab8a', spark: [30, 45, 38, 60, 52, 78, 90] },
                { label: 'Ocupación', value: '68%', sub: '14 de 20 slots', icon: Clock, accent: '#9b8ea8', spark: [50, 62, 55, 70, 66, 74, 68] },
                { label: 'Ticket promedio', value: '$460', sub: '★ 4.9 satisfacción', icon: Star, accent: '#d4613a', spark: [40, 48, 55, 52, 64, 70, 76] },
              ].map(s => (
                <div key={s.label} className="group bg-[#181310] border border-[#2e2518] hover:border-[#c9a96e]/30 rounded-2xl p-5 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}55, transparent)` }} />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest">{s.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#2e2518]"
                      style={{ background: `${s.accent}14`, color: s.accent }}>
                      <s.icon size={14} />
                    </div>
                  </div>
                  <p className="font-serif text-[2rem] leading-none text-[#f0ebe4]">{s.value}</p>
                  <p className="text-xs mt-1.5" style={{ color: s.accent }}>{s.sub}</p>
                  {/* sparkline */}
                  <div className="flex items-end gap-1 mt-4 h-8">
                    {s.spark.map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `${s.accent}${i === s.spark.length - 1 ? '' : '55'}`, opacity: i === s.spark.length - 1 ? 1 : 0.55 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              {/* ── Agenda de hoy · timeline ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[#f0ebe4] text-sm font-medium">Agenda de hoy</p>
                    <p className="text-[#8a7d6e] text-xs mt-0.5">4 citas · 2 artistas en turno</p>
                  </div>
                  <button onClick={() => setTab('agenda')} className="flex items-center gap-1 text-xs text-[#c9a96e] hover:gap-2 transition-all">
                    Ver todo <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    { ...MOCK_APPOINTMENTS[0], artist: 'Gaby M.', status: 'En curso', statusCls: 'bg-[#c9a96e]/15 text-[#e8d4a8] border-[#c9a96e]/30' },
                    { ...MOCK_APPOINTMENTS[1], artist: 'Dani R.', status: 'Confirmada', statusCls: 'bg-[#8aab8a]/12 text-[#8aab8a] border-[#8aab8a]/30' },
                    { ...MOCK_APPOINTMENTS[2], artist: 'Gaby M.', status: 'Confirmada', statusCls: 'bg-[#8aab8a]/12 text-[#8aab8a] border-[#8aab8a]/30' },
                    { ...MOCK_APPOINTMENTS[3], artist: 'Dani R.', status: 'Pendiente', statusCls: 'bg-[#d4613a]/12 text-[#e08a6d] border-[#d4613a]/30' },
                  ].map(a => (
                    <div key={a.id} className="flex items-center gap-4 py-3 border-b border-[#2e2518]/70 last:border-0 hover:bg-[#2a2018]/30 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="text-center w-12 shrink-0">
                        <p className="font-mono text-[#e8d4a8] text-sm font-medium">{a.time}</p>
                        <p className="text-[#4a4238] text-[10px] font-mono">60 min</p>
                      </div>
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="w-9 h-9 rounded-full bg-[#2a2018] border border-[#c9a96e]/25 flex items-center justify-center font-serif text-[#c9a96e] text-sm shrink-0">
                        {a.client[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f0ebe4] text-sm truncate">{a.client}</p>
                        <p className="text-[#8a7d6e] text-xs truncate">{a.service} · {a.artist}</p>
                      </div>
                      <span className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] border ${a.statusCls}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {/* ── Próxima cita ── */}
                <div className="rounded-2xl p-5 border border-[#c9a96e]/30 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #2a2013 0%, #1a1409 100%)' }}>
                  <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.25em] uppercase mb-2">Ahora mismo · Silla 1</p>
                  <p className="font-serif text-xl text-[#f0ebe4]">Ana López</p>
                  <p className="text-[#c8bfb0] text-xs mt-1">Botanical Garden · con Gaby · 10:00 – 12:00</p>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 py-2 bg-[#c9a96e] text-[#0d0b0a] text-xs font-semibold rounded-lg hover:bg-[#d4b87e] transition-colors">Iniciar servicio</button>
                    <button onClick={() => setTab('clients')} className="flex-1 py-2 border border-[#c9a96e]/30 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">Ver ficha</button>
                  </div>
                </div>

                {/* ── Ocupación por artista ── */}
                <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5">
                  <p className="text-[#f0ebe4] text-sm font-medium mb-4">Ocupación por artista</p>
                  <div className="space-y-4">
                    {[
                      { name: 'Gaby Morales', role: 'Mano alzada', pct: 85, color: '#c9a96e', citas: '3 citas' },
                      { name: 'Dani Reyes', role: 'Acrílico · Gel X', pct: 55, color: '#9b8ea8', citas: '2 citas' },
                      { name: 'Pao Vázquez', role: 'Recepción', pct: 30, color: '#8aab8a', citas: 'apoyo' },
                    ].map(t => (
                      <div key={t.name}>
                        <div className="flex justify-between items-baseline text-xs mb-1.5">
                          <span className="text-[#f0ebe4]">{t.name} <span className="text-[#4a4238]">· {t.role}</span></span>
                          <span className="font-mono" style={{ color: t.color }}>{t.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#2a2018] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${t.pct}%`, background: `linear-gradient(90deg, ${t.color}88, ${t.color})` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
              {/* ── Servicios top ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#f0ebe4] text-sm font-medium">Servicios más solicitados</p>
                  <button onClick={() => setTab('catalog')} className="text-xs text-[#8a7d6e] hover:text-[#c9a96e] transition-colors">Catálogo →</button>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Mano Alzada', detail: '18 citas · $5,400', pct: 85 },
                    { name: 'Acrílicas', detail: '14 citas · $3,920', pct: 72 },
                    { name: 'Efectos Chrome', detail: '11 citas · $2,640', pct: 60 },
                    { name: 'Encapsulados', detail: '8 citas · $2,080', pct: 48 },
                  ].map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#f0ebe4]">{s.name} <span className="text-[#4a4238]">· {s.detail}</span></span>
                        <span className="text-[#c9a96e] font-mono">{s.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2018] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#8a5f2e] to-[#c9a96e] rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Alertas + actividad ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5 sm:p-6">
                <p className="text-[#f0ebe4] text-sm font-medium mb-4">Alertas y actividad</p>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-xl bg-[#d4613a]/8 border border-[#d4613a]/25">
                    <Package size={15} className="text-[#e08a6d] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#f0ebe4] text-xs font-medium">Stock bajo: gel nude + 2 insumos</p>
                      <p className="text-[#8a7d6e] text-xs mt-0.5">Reponer antes del sábado · pide a proveedor</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-[#c9a96e]/6 border border-[#c9a96e]/20">
                    <Bell size={15} className="text-[#c9a96e] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#f0ebe4] text-xs font-medium">Recordatorios de mañana enviados</p>
                      <p className="text-[#8a7d6e] text-xs mt-0.5">5 WhatsApp · 0 fallos · hace 20 min</p>
                    </div>
                  </div>
                  {[
                    ['Camila S. dejó reseña ★★★★★', 'hace 1 h'],
                    ['Nueva gift card NS-GC-G7H8 · $500', 'hace 3 h'],
                  ].map(([t, h]) => (
                    <div key={t} className="flex justify-between text-xs px-1">
                      <span className="text-[#8a7d6e]">{t}</span>
                      <span className="text-[#4a4238] font-mono">{h}</span>
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
          <div className="space-y-5">
            {/* ── Barra compacta: sub-tabs + acción ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#181310] border border-[#2e2518] w-fit">
                {([
                  { id: 'designs', label: `Diseños (${designs.length})` },
                  { id: 'categories', label: `Categorías (${categories.length})` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setCatalogSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${catalogSubtab === t.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                {catalogSubtab === 'designs' ? (
                  <button onClick={() => setAddDesignModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all">
                    <Plus size={15} /> Nuevo diseño
                  </button>
                ) : (
                  <button onClick={() => { setCatDeleteError(''); setAddCategoryModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all">
                    <Plus size={15} /> Nueva categoría
                  </button>
                )}
              </div>
            </div>

            {catalogSubtab === 'designs' && (
            <>
            {/* ── Mini KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total diseños', value: String(designs.length), sub: `${filteredDesigns.length} visibles` },
                { label: 'Precio promedio', value: `$${avgPrice}`, sub: 'por servicio' },
                { label: 'Duración prom.', value: `${avgDuration} min`, sub: 'por cita' },
                { label: 'Categorías', value: String(catCount), sub: 'colecciones activas' },
              ].map(k => (
                <div key={k.label} className="bg-[#181310] border border-[#2e2518] rounded-2xl px-5 py-4">
                  <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#f0ebe4] mt-1">{k.value}</p>
                  <p className="text-[#c9a96e]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Toolbar: search + categorías ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238]" />
                  <input
                    value={searchDesign}
                    onChange={e => { setSearchDesign(e.target.value); catalogPag.setPage(1); }}
                    placeholder="Buscar por nombre…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.1)] w-full md:w-64 transition-all"
                  />
                </div>
                <p className="text-[#8a7d6e] text-xs font-mono md:text-right">{filteredDesigns.length} resultado(s)</p>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setSelectedCat('all'); catalogPag.setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${selectedCat === 'all' ? 'bg-[#c9a96e] text-[#0d0b0a] border-[#c9a96e] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}>
                  Todas
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCat(c.id); catalogPag.setPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${selectedCat === c.id ? 'text-[#0d0b0a] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}
                    style={selectedCat === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                    <span>{c.icon}</span> {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tabla premium ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#2e2518] bg-[#0d0b0a]/60">
                    {['Diseño', 'Categoría', 'Precio', 'Duración', 'Acciones'].map(h => (
                      <th key={h} className="text-left text-[#8a7d6e] font-mono text-[11px] uppercase tracking-widest py-3.5 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalogPag.paginated.map(d => {
                    const cat = categories.find(c => c.id === d.category);
                    return (
                    <tr key={d.id} className="border-b border-[#2e2518]/60 last:border-0 hover:bg-[#c9a96e]/[0.04] transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <img src={d.image} alt={d.name} loading="lazy"
                            className="w-12 h-12 object-cover rounded-xl border border-[#2e2518] group-hover:border-[#c9a96e]/40 transition-colors shrink-0" />
                          <div className="min-w-0">
                            <p className="font-serif text-[#f0ebe4] leading-tight truncate">{d.name}</p>
                            <p className="text-[#4a4238] text-[11px] font-mono mt-0.5">ID #{d.id} · {d.duration} min</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border"
                          style={{ background: `${cat?.color ?? '#c9a96e'}14`, borderColor: `${cat?.color ?? '#c9a96e'}35`, color: cat?.color ?? '#c9a96e' }}>
                          <span>{cat?.icon}</span> {cat?.name ?? d.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5"><span className="font-serif text-lg text-[#e8d4a8]">${d.price}</span></td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 text-[#8a7d6e] text-xs">
                          <Clock size={12} className="text-[#4a4238]" /> {d.duration} min
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button title="Editar" className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]/30 hover:bg-[#c9a96e]/10 transition-all"><Edit3 size={14} /></button>
                          <button title="Eliminar" onClick={() => setDeleteDesignModal({ open: true, id: d.id })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#8a7d6e] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {catalogPag.paginated.length === 0 && (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <Package size={28} className="mx-auto text-[#2e2518] mb-3" />
                      <p className="font-serif text-[#8a7d6e] text-lg">Sin diseños con esos filtros</p>
                      <p className="text-[#4a4238] text-xs mt-1 mb-4">Prueba con otro nombre o categoría</p>
                      <button onClick={() => { setSearchDesign(''); setSelectedCat('all'); catalogPag.setPage(1); }}
                        className="px-4 py-2 border border-[#c9a96e]/40 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">
                        Limpiar filtros
                      </button>
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination page={catalogPag.page} total={catalogPag.totalPages} onChange={catalogPag.setPage} count={filteredDesigns.length} pageSize={6} />
            </>
            )}

            {catalogSubtab === 'categories' && (
              <div className="space-y-4">
                <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238]" />
                    <input
                      value={searchCat}
                      onChange={e => setSearchCat(e.target.value)}
                      placeholder="Buscar categoría…"
                      className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 w-full md:w-64 transition-all"
                    />
                  </div>
                  <p className="text-[#8a7d6e] text-xs font-mono">{filteredCats.length} categoría(s)</p>
                </div>

                {filteredCats.length === 0 ? (
                  <div className="bg-[#181310] border border-[#2e2518] rounded-2xl py-14 text-center">
                    <Package size={28} className="mx-auto text-[#2e2518] mb-3" />
                    <p className="font-serif text-[#8a7d6e] text-lg">Sin categorías con ese filtro</p>
                    <button onClick={() => setSearchCat('')}
                      className="mt-4 px-4 py-2 border border-[#c9a96e]/40 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCats.map(c => {
                      const n = designsInCat(c.id);
                      return (
                        <div key={c.id} className="group relative bg-[#181310] border border-[#2e2518] hover:border-[#c9a96e]/35 rounded-2xl p-5 transition-all overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                                style={{ background: `${c.color}14`, borderColor: `${c.color}35` }}>
                                {c.icon}
                              </div>
                              <div className="min-w-0">
                                <p className="font-serif text-[#f0ebe4] leading-tight truncate">{c.name}</p>
                                <p className="text-[#4a4238] text-[11px] font-mono mt-0.5">/{c.id} · {n} diseño(s)</p>
                              </div>
                            </div>
                            <button title="Eliminar categoría"
                              onClick={() => { setCatDeleteError(''); setDeleteCategoryModal({ open: true, id: c.id }); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a4238] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all shrink-0">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-[#8a7d6e] text-xs mt-3 leading-relaxed line-clamp-2 min-h-[2rem]">{c.description}</p>
                          <div className="flex items-center justify-between mt-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border"
                              style={{ background: `${c.color}12`, borderColor: `${c.color}30`, color: c.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} /> {n} diseños
                            </span>
                            <button onClick={() => { setSelectedCat(c.id); catalogPag.setPage(1); setCatalogSubtab('designs'); }}
                              className="text-xs text-[#8a7d6e] hover:text-[#c9a96e] transition-colors">
                              Ver diseños →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            AGENDA
        ════════════════════════════════════ */}
        {tab === 'agenda' && (
          <div className="max-w-4xl space-y-4">
            {/* ── Header compacto ── */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.25em] uppercase">Agenda · Septiembre 2026</p>
                <h2 className="font-serif text-xl text-[#f0ebe4] mt-0.5">4 citas programadas</h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#8a7d6e]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c9a96e]" /> Hoy</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/10" /> Con citas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-4 items-start">
              {/* ── Mini calendario ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-serif text-sm text-[#f0ebe4]">Septiembre 2026</p>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 flex items-center justify-center rounded-md border border-[#2e2518] text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]/40 transition-colors"><ChevronLeft size={12} /></button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-md border border-[#2e2518] text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]/40 transition-colors"><ChevronRight size={12} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-[#4a4238] mb-1.5">
                  {['D','L','M','M','J','V','S'].map((d, i) => <div key={i} className="py-0.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 2 }).map((_, i) => <div key={`p${i}`} className="h-8" />)}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const day = i + 1;
                    const hasAppt = [10, 12, 15, 17, 20, 22].includes(day);
                    const isToday = day === 18;
                    return (
                      <div key={day} title={hasAppt ? `${day} · con citas` : `${day}`}
                        className={`h-8 rounded-lg flex items-center justify-center text-[11px] cursor-pointer transition-all
                        ${isToday ? 'bg-[#c9a96e] text-[#0d0b0a] font-bold shadow-[0_2px_12px_rgba(201,169,110,0.35)]' :
                          hasAppt ? 'bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#e8d4a8] hover:bg-[#c9a96e]/20' :
                          'text-[#8a7d6e] hover:bg-[#2a2018]'}`}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-[#2e2518]/70 flex justify-between text-[11px]">
                  <span className="text-[#8a7d6e]">Ocupación del día</span>
                  <span className="font-mono text-[#c9a96e]">68%</span>
                </div>
                <div className="h-1 bg-[#2a2018] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full w-[68%] bg-gradient-to-r from-[#8a5f2e] to-[#c9a96e] rounded-full" />
                </div>
              </div>

              {/* ── Citas del día · compactas ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#f0ebe4] text-[13px] font-medium">Hoy · Jueves 18</p>
                  <button className="flex items-center gap-1 text-[11px] text-[#c9a96e] hover:gap-2 transition-all">
                    <Plus size={11} /> Nueva cita
                  </button>
                </div>
                <div className="divide-y divide-[#2e2518]/60">
                  {[
                    { ...MOCK_APPOINTMENTS[0], artist: 'Gaby M.', status: 'En curso', cls: 'bg-[#c9a96e]/15 text-[#e8d4a8] border-[#c9a96e]/30' },
                    { ...MOCK_APPOINTMENTS[1], artist: 'Dani R.', status: 'Confirmada', cls: 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' },
                    { ...MOCK_APPOINTMENTS[2], artist: 'Gaby M.', status: 'Confirmada', cls: 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' },
                    { ...MOCK_APPOINTMENTS[3], artist: 'Dani R.', status: 'Pendiente', cls: 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/25' },
                  ].map(a => (
                    <div key={a.id} className="flex items-center gap-3 py-2.5 group hover:bg-[#c9a96e]/[0.03] rounded-lg px-1.5 -mx-1.5 transition-colors">
                      <span className="font-mono text-[12px] text-[#e8d4a8] w-10 shrink-0">{a.time}</span>
                      <span className="w-1 h-7 rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f0ebe4] text-[13px] leading-tight truncate">{a.client}</p>
                        <p className="text-[#8a7d6e] text-[11px] truncate">{a.service} · {a.artist}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${a.cls}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            CLIENTS
        ════════════════════════════════════ */}
        {tab === 'clients' && (
          <div className="space-y-4">
            {/* ── KPIs boutique ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Clientas', value: String(MOCK_CLIENTS.length), sub: 'base activa' },
                { label: 'VIP (10+ visitas)', value: String(MOCK_CLIENTS.filter(c => c.visits >= 10).length), sub: 'prioridad agenda' },
                { label: 'Visita promedio', value: `${Math.round(MOCK_CLIENTS.reduce((a, c) => a + c.visits, 0) / MOCK_CLIENTS.length)}`, sub: 'por clienta' },
                { label: 'Puntos activos', value: String(MOCK_CLIENTS.reduce((a, c) => a + c.points, 0)), sub: 'en circulación' },
              ].map(k => (
                <div key={k.label} className="bg-[#181310] border border-[#2e2518] rounded-2xl px-5 py-4">
                  <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#f0ebe4] mt-1">{k.value}</p>
                  <p className="text-[#c9a96e]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238]" />
                  <input
                    value={searchClient}
                    onChange={e => setSearchClient(e.target.value)}
                    placeholder="Buscar por nombre o teléfono…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 w-full md:w-72 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  {([
                    { id: 'all', label: 'Todas' },
                    { id: 'vip', label: 'VIP' },
                    { id: 'oro', label: 'Oro' },
                    { id: 'nueva', label: 'Nuevas' },
                  ] as const).map(f => (
                    <button key={f.id} onClick={() => setClientTier(f.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs border transition-all ${clientTier === f.id ? 'bg-[#c9a96e] text-[#0d0b0a] border-[#c9a96e] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8] hover:border-[#c9a96e]/40'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {MOCK_CLIENTS
                .map(c => ({
                  ...c,
                  tier: c.visits >= 10 ? 'vip' as const : c.visits >= 5 ? 'oro' as const : 'nueva' as const,
                }))
                .filter(c => {
                  const q = searchClient.trim().toLowerCase();
                  const matchQ = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.lastDesign.toLowerCase().includes(q);
                  const matchT = clientTier === 'all' || c.tier === clientTier;
                  return matchQ && matchT;
                })
                .map(c => {
                  const tierStyle =
                    c.tier === 'vip'
                      ? { label: 'VIP', bg: '#c9a96e18', bd: '#c9a96e45', tx: '#e8d4a8', bar: 'linear-gradient(90deg,#8a5f2e,#e8d4a8)' }
                      : c.tier === 'oro'
                        ? { label: 'Oro', bg: '#9b8ea814', bd: '#9b8ea840', tx: '#c3b8d4', bar: 'linear-gradient(90deg,#6b5f7a,#c3b8d4)' }
                        : { label: 'Nueva', bg: '#8aab8a12', bd: '#8aab8a35', tx: '#a8c8a8', bar: 'linear-gradient(90deg,#4a6b4a,#a8c8a8)' };
                  const pct = Math.min(100, Math.round((c.points / 300) * 100));
                  const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('');
                  return (
                    <div key={c.id} className="group relative bg-[#181310] border border-[#2e2518] hover:border-[#c9a96e]/35 rounded-2xl p-5 transition-all overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] opacity-70" style={{ background: tierStyle.bar }} />
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg border"
                            style={{ background: 'linear-gradient(135deg,#1a1510,#231a10)', borderColor: tierStyle.bd, color: tierStyle.tx }}>
                            {initials}
                          </div>
                          {c.tier === 'vip' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#c9a96e] flex items-center justify-center">
                              <Crown size={10} className="text-[#0d0b0a]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-serif text-[#f0ebe4] text-[17px] leading-tight truncate">{c.name}</p>
                              <p className="text-[#8a7d6e] text-xs mt-0.5 flex items-center gap-1.5">
                                <Phone size={10} className="text-[#4a4238]" /> <span className="font-mono">{c.phone}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0"
                              style={{ background: tierStyle.bg, borderColor: tierStyle.bd, color: tierStyle.tx }}>
                              {tierStyle.label} · {c.points} pts
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="rounded-xl bg-[#0d0b0a]/70 border border-[#2e2518]/70 py-2">
                              <p className="font-serif text-base text-[#f0ebe4] leading-none">{c.visits}</p>
                              <p className="text-[#4a4238] text-[10px] font-mono uppercase mt-1">visitas</p>
                            </div>
                            <div className="rounded-xl bg-[#0d0b0a]/70 border border-[#2e2518]/70 py-2 px-1">
                              <p className="text-[#e8d4a8] text-[11px] font-medium leading-none truncate">{c.lastVisit}</p>
                              <p className="text-[#4a4238] text-[10px] font-mono uppercase mt-1">última</p>
                            </div>
                            <div className="rounded-xl bg-[#0d0b0a]/70 border border-[#2e2518]/70 py-2 px-1">
                              <p className="text-[#c9a96e] text-[11px] font-medium leading-none truncate">{c.lastDesign}</p>
                              <p className="text-[#4a4238] text-[10px] font-mono uppercase mt-1">diseño</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#8a7d6e]">Progreso a recompensa</span>
                              <span className="font-mono" style={{ color: tierStyle.tx }}>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-[#0d0b0a] border border-[#2e2518]/60 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tierStyle.bar }} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button className="flex-1 py-2 border border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8] hover:border-[#c9a96e]/40 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                              <ChevronDown size={12} /> Historial
                            </button>
                            <button className="flex-1 py-2 bg-[#8aab8a]/10 border border-[#8aab8a]/25 text-[#a8c8a8] hover:bg-[#8aab8a]/20 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {MOCK_CLIENTS.filter(c => {
              const q = searchClient.trim().toLowerCase();
              const tier = c.visits >= 10 ? 'vip' : c.visits >= 5 ? 'oro' : 'nueva';
              return (!q || c.name.toLowerCase().includes(q) || c.phone.includes(q)) && (clientTier === 'all' || tier === clientTier);
            }).length === 0 && (
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl py-12 text-center">
                <Users size={26} className="mx-auto text-[#2e2518] mb-3" />
                <p className="font-serif text-[#8a7d6e] text-lg">Sin clientas con esos filtros</p>
                <button onClick={() => { setSearchClient(''); setClientTier('all'); }}
                  className="mt-4 px-4 py-2 border border-[#c9a96e]/40 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            USERS & ROLES
        ════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="space-y-5">
            {/* ── Barra compacta ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#181310] border border-[#2e2518] w-fit">
                {([
                  { id: 'users', label: `Usuarios (${users.length})` },
                  { id: 'roles', label: `Roles y permisos (${ROLES.length})` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setUsersSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${usersSubtab === t.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {usersSubtab === 'users' && (
                <button onClick={() => setAddUserModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all shrink-0 w-fit">
                  <UserPlus size={14} /> Nuevo usuario
                </button>
              )}
            </div>

            {usersSubtab === 'users' && (
            <>
            {/* ── Mini KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total equipo', value: String(users.length), sub: `${users.filter(u => u.active).length} activos` },
                { label: 'Administradoras', value: String(users.filter(u => u.role === 'admin').length), sub: 'acceso total' },
                { label: 'Artistas', value: String(users.filter(u => u.role === 'artist').length), sub: 'en cabina' },
                { label: 'Recepción', value: String(users.filter(u => u.role === 'receptionist').length), sub: 'front desk' },
              ].map(k => (
                <div key={k.label} className="bg-[#181310] border border-[#2e2518] rounded-2xl px-5 py-4">
                  <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#f0ebe4] mt-1">{k.value}</p>
                  <p className="text-[#c9a96e]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238]" />
                  <input
                    value={searchUser}
                    onChange={e => { setSearchUser(e.target.value); usersPag.setPage(1); }}
                    placeholder="Buscar por nombre o email…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 w-full md:w-72 transition-all"
                  />
                </div>
                <p className="text-[#8a7d6e] text-xs font-mono">{filteredUsers.length} resultado(s)</p>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setUserRoleFilter('all'); usersPag.setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${userRoleFilter === 'all' ? 'bg-[#c9a96e] text-[#0d0b0a] border-[#c9a96e] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                  Todos
                </button>
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => { setUserRoleFilter(r.id); usersPag.setPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${userRoleFilter === r.id ? 'text-[#0d0b0a] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8]'}`}
                    style={userRoleFilter === r.id ? { background: r.color, borderColor: r.color } : undefined}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: userRoleFilter === r.id ? '#0d0b0a' : r.color }} /> {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tabla premium ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#2e2518] bg-[#0d0b0a]/60">
                    {['Usuario', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                      <th key={h} className="text-left text-[#8a7d6e] font-mono text-[11px] uppercase tracking-widest py-3.5 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersPag.paginated.map(u => {
                    const role = roleOf(u.role);
                    const initials = u.name.split(' ').map(w => w[0]).slice(0, 2).join('');
                    return (
                      <tr key={u.id} className="border-b border-[#2e2518]/60 last:border-0 hover:bg-[#c9a96e]/[0.04] transition-colors group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border"
                              style={{ background: `${role.color}14`, borderColor: `${role.color}40`, color: role.color }}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif text-[#f0ebe4] leading-tight truncate">{u.name}</p>
                              <p className="text-[#4a4238] text-[11px] font-mono truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                            style={{ background: `${role.color}12`, borderColor: `${role.color}35`, color: role.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: role.color }} /> {role.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button onClick={() => toggleUserActive(u.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${u.active ? 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25 hover:bg-[#8aab8a]/20' : 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/25 hover:bg-[#d4613a]/20'}`}>
                            {u.active ? '● Activo' : '○ Inactivo'}
                          </button>
                        </td>
                        <td className="py-3.5 px-5 text-[#8a7d6e] text-xs font-mono whitespace-nowrap">{u.lastLogin}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button title="Editar" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 border border-transparent hover:border-[#c9a96e]/30 transition-all"><Edit3 size={14} /></button>
                            {u.role !== 'admin' && (
                              <button title="Eliminar" onClick={() => setDeleteUserModal({ open: true, id: u.id })}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {usersPag.paginated.length === 0 && (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <Shield size={26} className="mx-auto text-[#2e2518] mb-3" />
                      <p className="font-serif text-[#8a7d6e] text-lg">Sin usuarios con esos filtros</p>
                      <button onClick={() => { setSearchUser(''); setUserRoleFilter('all'); usersPag.setPage(1); }}
                        className="mt-4 px-4 py-2 border border-[#c9a96e]/40 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">
                        Limpiar filtros
                      </button>
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
            <Pagination page={usersPag.page} total={usersPag.totalPages} onChange={usersPag.setPage} count={filteredUsers.length} pageSize={6} />
            </>
            )}

            {usersSubtab === 'roles' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ROLES.map(r => {
                    const nUsers = users.filter(u => u.role === r.id).length;
                    const active = selectedRole.id === r.id;
                    return (
                      <button key={r.id} onClick={() => setSelectedRole(r)}
                        className={`relative text-left rounded-2xl border p-5 overflow-hidden transition-all ${active ? 'border-[#c9a96e]/50 shadow-[0_0_28px_rgba(201,169,110,0.10)]' : 'border-[#2e2518] bg-[#181310] hover:border-[#c9a96e]/30'}`}
                        style={active ? { background: 'linear-gradient(140deg,#1e160c 0%,#14100a 70%)' } : undefined}>
                        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }} />
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center border"
                            style={{ background: `${r.color}14`, borderColor: `${r.color}35`, color: r.color }}>
                            <Shield size={15} />
                          </div>
                          {active && <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#c9a96e]/15 text-[#e8d4a8] border border-[#c9a96e]/30">viendo</span>}
                        </div>
                        <p className="font-serif text-lg text-[#f0ebe4] leading-tight">{r.name}</p>
                        <p className="text-[#8a7d6e] text-xs mt-1">{r.permissions.length} permisos · {nUsers} usuario(s)</p>
                        <div className="h-1 bg-[#0d0b0a] border border-[#2e2518]/60 rounded-full overflow-hidden mt-3">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((r.permissions.length / ALL_PERMISSIONS.length) * 100)}%`, background: r.color }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedRole.color }} />
                      <p className="font-serif text-lg text-[#f0ebe4]">{selectedRole.name}</p>
                    </div>
                    <p className="text-[#8a7d6e] text-xs font-mono">
                      {selectedRole.permissions.length}/{ALL_PERMISSIONS.length} permisos · {users.filter(u => u.role === selectedRole.id).length} usuarios
                    </p>
                  </div>
                  <p className="text-[#4a4238] text-xs mb-5">
                    {selectedRole.id === 'admin' ? 'Acceso total: puede gestionar todo el estudio.' :
                     selectedRole.id === 'artist' ? 'Enfocado en cabina: catálogo y sus reservas.' :
                     'Front desk: agenda, clientas y gift cards, sin usuarios.'}
                  </p>
                  {([
                    { g: 'Catálogo', keys: ['catalog_view', 'catalog_edit'] },
                    { g: 'Reservas', keys: ['bookings_view', 'bookings_edit'] },
                    { g: 'Clientas & Gift Cards', keys: ['clients_view', 'clients_edit', 'giftcards'] },
                    { g: 'Sistema', keys: ['users_manage', 'reports'] },
                  ] as const).map(section => (
                    <div key={section.g} className="mb-4 last:mb-0">
                      <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Key size={10} /> {section.g}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {section.keys.map(k => {
                          const perm = ALL_PERMISSIONS.find(p => p.key === k)!;
                          const has = selectedRole.permissions.includes(k);
                          return (
                            <div key={k} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs transition-all ${has ? 'bg-[#8aab8a]/[0.07] border-[#8aab8a]/25 text-[#c8d8c8]' : 'bg-[#0d0b0a]/60 border-[#2e2518]/70 text-[#4a4238]'}`}>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${has ? 'bg-[#8aab8a]/20 text-[#8aab8a]' : 'bg-[#2a2018] text-[#4a4238]'}`}>
                                {has ? <Check size={11} /> : <XIcon size={11} />}
                              </span>
                              {perm.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            GIFT CARDS
        ════════════════════════════════════ */}
        {tab === 'giftcards' && (
          <div className="space-y-4">
            {/* ── Barra compacta ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#181310] border border-[#2e2518] w-fit">
                {([
                  { id: 'all', label: `Todas (${giftCards.length})` },
                  { id: 'active', label: `Activas (${giftCards.filter(g => !g.used).length})` },
                  { id: 'used', label: `Canjeadas (${giftCards.filter(g => g.used).length})` },
                ] as const).map(f => (
                  <button key={f.id} onClick={() => setGcFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${gcFilter === f.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setAddGcModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all w-fit">
                <Plus size={15} /> Nueva gift card
              </button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Emitidas', value: String(giftCards.length), sub: `${filteredGcs.length} visibles` },
                { label: 'Valor activo', value: `$${gcActiveValue.toLocaleString()}`, sub: 'por canjear' },
                { label: 'Valor canjeado', value: `$${gcUsedValue.toLocaleString()}`, sub: 'ingreso realizado' },
                { label: 'Monto promedio', value: giftCards.length ? `$${Math.round((gcActiveValue + gcUsedValue) / giftCards.length)}` : '$0', sub: 'por tarjeta' },
              ].map(k => (
                <div key={k.label} className="bg-[#181310] border border-[#2e2518] rounded-2xl px-5 py-4">
                  <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#f0ebe4] mt-1">{k.value}</p>
                  <p className="text-[#c9a96e]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Buscador ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238]" />
                <input
                  value={searchGc}
                  onChange={e => setSearchGc(e.target.value)}
                  placeholder="Buscar por código o comprador…"
                  className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 w-full md:w-72 transition-all"
                />
              </div>
              <p className="text-[#8a7d6e] text-xs font-mono">{filteredGcs.length} resultado(s)</p>
            </div>

            {filteredGcs.length === 0 ? (
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl py-14 text-center">
                <Gift size={28} className="mx-auto text-[#2e2518] mb-3" />
                <p className="font-serif text-[#8a7d6e] text-lg">Sin gift cards con esos filtros</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button onClick={() => { setSearchGc(''); setGcFilter('all'); }}
                    className="px-4 py-2 border border-[#2e2518] text-[#8a7d6e] text-xs rounded-lg hover:border-[#8a7d6e] transition-colors">
                    Limpiar
                  </button>
                  <button onClick={() => setAddGcModal(true)}
                    className="px-4 py-2 bg-[#c9a96e] text-[#0d0b0a] text-xs font-semibold rounded-lg hover:bg-[#d4b87e] transition-colors">
                    Crear la primera
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGcs.map(g => (
                  <div key={g.code} className={`relative rounded-2xl border p-5 overflow-hidden transition-all group ${g.used ? 'bg-[#141110] border-[#2e2518] opacity-70' : 'bg-[#181310] border-[#c9a96e]/30 hover:border-[#c9a96e]/55 hover:shadow-[0_8px_36px_rgba(201,169,110,0.12)]'}`}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: g.used ? '#2e2518' : 'linear-gradient(90deg,#8a5f2e,#e8d4a8,#8a5f2e)' }} />
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${g.used ? 'text-[#4a4238] border-[#2e2518]' : 'text-[#e8d4a8] border-[#c9a96e]/30 bg-[#c9a96e]/10'}`}>
                        <Gift size={16} />
                      </div>
                      <button onClick={() => toggleGcUsed(g.code)} title={g.used ? 'Reactivar' : 'Marcar canjeada'}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${g.used ? 'bg-[#2a2018] text-[#8a7d6e] border-[#2e2518] hover:border-[#8a7d6e]' : 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/30 hover:bg-[#8aab8a]/20'}`}>
                        {g.used ? 'Canjeada' : '● Activa'}
                      </button>
                    </div>
                    <p className={`font-serif leading-none ${g.used ? 'text-[#8a7d6e]' : 'text-gradient'}`} style={{ fontSize: '2.1rem' }}>${g.amount.toLocaleString()}</p>
                    <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest mt-1">Gift card · Nails Studio</p>
                    <button onClick={() => copyGc(g.code)}
                      className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0d0b0a] border border-dashed border-[#2e2518] hover:border-[#c9a96e]/50 transition-colors group/code">
                      <span className="font-mono text-[#e8d4a8] text-xs tracking-widest">{g.code}</span>
                      <span className="text-[#8a7d6e] group-hover/code:text-[#c9a96e] transition-colors flex items-center gap-1 text-[11px]">
                        {copiedCode === g.code ? <><Check size={11} /> ¡Copiado!</> : <><Copy size={11} /> Copiar</>}
                      </span>
                    </button>
                    <div className="flex justify-between text-xs mt-3">
                      <span className="text-[#8a7d6e]">De: <span className="text-[#f0ebe4]">{g.buyer}</span></span>
                      {g.recipient ? <span className="text-[#8a7d6e]">Para: <span className="text-[#e8d4a8]">{g.recipient}</span></span> : <span className="text-[#4a4238]">{g.created}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => toggleGcUsed(g.code)}
                        className="flex-1 py-2 text-xs rounded-xl border border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8] hover:border-[#c9a96e]/40 transition-all">
                        {g.used ? 'Reactivar' : 'Marcar canjeada'}
                      </button>
                      <button onClick={() => setDeleteGcModal({ open: true, code: g.code })} title="Eliminar"
                        className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#4a4238] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

      {/* Add category */}
      <Modal open={addCategoryModal} onClose={() => { setAddCategoryModal(false); setCatDeleteError(''); }} title="Nueva categoría" size="sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre</label>
            <input value={newCategory.name} onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Pedicure Spa" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono (emoji)</label>
              <input value={newCategory.icon} onChange={e => setNewCategory(c => ({ ...c, icon: e.target.value }))}
                placeholder="💅" maxLength={4} className={inputCls} />
            </div>
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={newCategory.color} onChange={e => setNewCategory(c => ({ ...c, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#2e2518]" />
                <input value={newCategory.color} onChange={e => setNewCategory(c => ({ ...c, color: e.target.value }))}
                  placeholder="#c9a96e" className={inputCls} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
            <input value={newCategory.description} onChange={e => setNewCategory(c => ({ ...c, description: e.target.value }))}
              placeholder="Tratamiento completo…" className={inputCls} />
          </div>
          {catDeleteError && addCategoryModal && (
            <p className="text-[#e08a6d] text-xs">{catDeleteError}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setAddCategoryModal(false); setCatDeleteError(''); }}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={handleAddCategory}
            className="flex-1 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] transition-colors">Crear categoría</button>
        </div>
      </Modal>

      {/* Delete category */}
      <Modal open={deleteCategoryModal.open} onClose={() => { setDeleteCategoryModal({ open: false, id: null }); setCatDeleteError(''); }} title="Eliminar categoría" size="sm">
        <p className="text-[#8a7d6e] mb-4 text-sm">¿Eliminar esta categoría? Solo es posible si no tiene diseños asignados.</p>
        {catDeleteError && (
          <p className="p-3 mb-4 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#e08a6d] text-xs">{catDeleteError}</p>
        )}
        <div className="flex gap-3">
          <button onClick={() => { setDeleteCategoryModal({ open: false, id: null }); setCatDeleteError(''); }}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={confirmDeleteCategory}
            className="flex-1 py-2.5 bg-[#d4613a] text-white text-sm rounded hover:bg-[#e06848] transition-colors">Eliminar</button>
        </div>
      </Modal>

      {/* Add gift card */}
      <Modal open={addGcModal} onClose={() => setAddGcModal(false)} title="Nueva gift card" size="sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-2">Monto</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['300', '500', '1000'].map(m => (
                <button key={m} type="button" onClick={() => setNewGc(g => ({ ...g, amount: m, customAmount: '' }))}
                  className={`py-2 rounded-xl border text-sm font-serif transition-all ${(!newGc.customAmount && newGc.amount === m) ? 'bg-[#c9a96e] text-[#0d0b0a] border-[#c9a96e] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}>
                  ${m}
                </button>
              ))}
            </div>
            <input type="number" min={1} value={newGc.customAmount} onChange={e => setNewGc(g => ({ ...g, customAmount: e.target.value }))}
              placeholder="O monto personalizado…" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Comprador *</label>
            <input value={newGc.buyer} onChange={e => setNewGc(g => ({ ...g, buyer: e.target.value }))}
              placeholder="Ej. Ana R." className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Para (destinataria)</label>
            <input value={newGc.recipient} onChange={e => setNewGc(g => ({ ...g, recipient: e.target.value }))}
              placeholder="Ej. Mamá (opcional)" className={inputCls} />
          </div>
          <div className="rounded-xl border border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] p-3.5 flex items-center gap-3">
            <Gift size={18} className="text-[#c9a96e] shrink-0" />
            <p className="text-xs text-[#8a7d6e]">Se generará un código único <span className="font-mono text-[#e8d4a8]">NS-GC-XXXX</span> listo para copiar y compartir por WhatsApp.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAddGcModal(false)}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={handleAddGc} disabled={!newGc.buyer.trim() || !(Number(newGc.customAmount || newGc.amount) > 0)}
            className="flex-1 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Crear · ${Number(newGc.customAmount || newGc.amount || 0).toLocaleString()}
          </button>
        </div>
      </Modal>

      {/* Delete gift card */}
      <Modal open={deleteGcModal.open} onClose={() => setDeleteGcModal({ open: false, code: null })} title="Eliminar gift card" size="sm">
        <p className="text-[#8a7d6e] mb-1 text-sm">¿Eliminar <span className="font-mono text-[#e8d4a8]">{deleteGcModal.code}</span>?</p>
        <p className="text-[#4a4238] text-xs mb-6">Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteGcModal({ open: false, code: null })}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={confirmDeleteGc}
            className="flex-1 py-2.5 bg-[#d4613a] text-white text-sm rounded hover:bg-[#e06848] transition-colors">Eliminar</button>
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
