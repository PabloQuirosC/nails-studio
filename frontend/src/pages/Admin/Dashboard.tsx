import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart2, Calendar, Users, Package, Gift,
  Bell, LogOut, Plus, Trash2, Edit3, ChevronDown,
  ChevronLeft, ChevronRight, Shield, Check, X as XIcon,
  Search, UserPlus, Key, Clock, ArrowRight, Sparkles,
  Phone, MessageCircle, Crown, Copy, Star,
} from 'lucide-react';
import { DESIGNS, CATEGORIES } from '../../data';
import { useAuthStore } from '../../shared/auth/auth-store';
import { Can } from '../../shared/auth/guards';
import {
  isOffline,
  useCreateGiftCard,
  useCreateUser,
  useDeleteGiftCard,
  useGiftCardHistory,
  useDeleteUser,
  useGrantPermission,
  useRevokePermission,
  useRolePermissions,
  useServerGiftCards,
  useServerPermissions,
  useServerRoles,
  useServerUsers,
  useSetGiftCardUsed,
  useUpdateGiftCard,
  useToggleUserStatus,
  type BackendUser,
} from '../../features/admin/rbac-api';
import {
  useAdjustClientPoints,
  useCreateAppointment,
  useCreateCategory,
  useCreateClient,
  useCreateDesign,
  useDeleteAppointment,
  useDeleteCategory,
  useDeleteDesign,
  useClientRewards,
  useDeleteClient,
  useServerClient,
  useServerDesign,
  useUpdateCategory,
  useUpdateClient,
  useUpdateDesign,
  useServerAppointments,
  useServerCategories,
  useServerClients,
  useServerDesigns,
  useSetAppointmentStatus,
  useAdminPosts,
  usePublishPost,
  useUpdatePost,
  useDeletePost,
  type Appointment,
  type Design,
} from '../../features/admin/studio-api';
import { ConfirmDeleteModal, EditModalShell, Modal } from '../../components/ui/Modal';
import { CategoryIcon, CATEGORY_ICONS } from '../../shared/category-icons';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Resumen',   icon: BarChart2 },
  { id: 'catalog',   label: 'Catálogo',  icon: Package   },
  { id: 'agenda',    label: 'Agenda',    icon: Calendar  },
  { id: 'clients',   label: 'Clientas',  icon: Users     },
  { id: 'users',     label: 'Usuarios',  icon: Shield    },
  { id: 'giftcards', label: 'Gift Cards',icon: Gift      },
  { id: 'reviews',   label: 'Reseñas',   icon: Star      },
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

// ─── Permisos (códigos del backend: `modulo.tipo` en minúsculas) ─────────────
const ALL_PERMISSIONS = [
  { key: 'catalogo.read',    label: 'Ver catálogo'      },
  { key: 'catalogo.update',  label: 'Editar catálogo'   },
  { key: 'reservas.read',    label: 'Ver reservas'      },
  { key: 'reservas.update',  label: 'Editar reservas'   },
  { key: 'clientas.read',    label: 'Ver clientas'      },
  { key: 'clientas.update',  label: 'Editar clientas'   },
  { key: 'giftcards.read',   label: 'Ver gift cards'    },
  { key: 'giftcards.create', label: 'Crear gift cards'  },
  { key: 'usuarios.read',    label: 'Ver usuarios'      },
  { key: 'usuarios.create',  label: 'Crear usuarios'    },
  { key: 'usuarios.update',  label: 'Editar usuarios'   },
  { key: 'usuarios.delete',  label: 'Eliminar usuarios' },
  { key: 'roles.read',       label: 'Ver roles'         },
  { key: 'roles.update',     label: 'Administrar roles' },
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
    permissions: ['catalogo.read', 'reservas.read', 'reservas.update', 'clientas.read'],
  },
  {
    id: 'receptionist',
    name: 'Recepcionista',
    color: '#8aab8a',
    permissions: ['catalogo.read', 'reservas.read', 'reservas.update', 'clientas.read', 'clientas.update', 'giftcards.read', 'giftcards.create', 'usuarios.read'],
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

/** Forma de diseño del mock (la API se mapea a esta forma al estar online). */
interface MockDesign {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  image: string;
  description: string;
  technique: string;
  tags: string[];
  occasion: string;
  complexity: string;
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
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'sparkles', color: '#c9a96e', description: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'artist', password: '' });
  const [newDesign, setNewDesign] = useState({ name: '', category: 'mano-alzada', price: '', duration: '' });
  const [giftCards, setGiftCards] = useState(MOCK_GIFTCARDS.map(g => ({ ...g, recipient: '', created: 'Sep 2026' })));
  const [gcFilter, setGcFilter] = useState<'all' | 'active' | 'used'>('all');
  const [searchGc, setSearchGc] = useState('');
  const [addGcModal, setAddGcModal] = useState(false);
  const [deleteGcModal, setDeleteGcModal] = useState<{ open: boolean; code: string | null }>({ open: false, code: null });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newGc, setNewGc] = useState({ amount: '', buyer: '', recipient: '' });
  const [editGcCode, setEditGcCode] = useState<string | null>(null);
  const [editGc, setEditGc] = useState({ amount: '', buyer: '', recipient: '' });
  const [editGcError, setEditGcError] = useState('');

  useEffect(() => {
    // La protección real la hace <ProtectedRoute>; aquí solo hidratamos por si entra directo.
    void useAuthStore.getState().hydrate();
  }, []);

  const handleLogout = () => {
    void useAuthStore.getState().logout().then(() => navigate('/admin', { replace: true }));
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

  const handleAddCategoryLocal = () => {
    const name = newCategory.name.trim();
    if (!name) return;
    const id = slugify(name);
    if (categories.some(c => c.id === id)) {
      setCatDeleteError('Ya existe una categoría con ese nombre.');
      return;
    }
    setCategories(cs => [...cs, { id, name, icon: newCategory.icon || 'sparkles', color: newCategory.color, description: newCategory.description.trim() || 'Nueva colección del estudio' }]);
    setNewCategory({ name: '', icon: 'sparkles', color: '#c9a96e', description: '' });
    setCatDeleteError('');
    setAddCategoryModal(false);
    setCatalogSubtab('categories');
  };

  const handleDeleteCategoryLocal = () => {
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

  // ── Gift cards: servidor (búsqueda en API) con fallback a mocks ──
  const genGcCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `NS-GC-${s}`;
  };
  const serverGcQuery = useServerGiftCards('all', searchGc);
  const onlineGc = serverGcQuery.data !== undefined;
  const serverGcItems = (serverGcQuery.data?.items ?? []).map(g => ({
    ...g, recipient: g.recipient ?? '', created: 'Servidor',
  }));
  const gcSource = onlineGc ? serverGcItems : giftCards;
  const gcAmountOf = (g: { amount: number }) => g.amount;
  const gcActiveValue = gcSource.filter(g => !g.used).reduce((a, g) => a + gcAmountOf(g), 0);
  const gcUsedValue = gcSource.filter(g => g.used).reduce((a, g) => a + gcAmountOf(g), 0);
  const gcTotal = onlineGc ? (serverGcQuery.data?.total ?? 0) : giftCards.length;
  const filteredGcs = gcSource.filter(g => {
    const q = searchGc.trim().toLowerCase();
    const matchQ = onlineGc || !q || g.code.toLowerCase().includes(q) || g.buyer.toLowerCase().includes(q) || (g.recipient ?? '').toLowerCase().includes(q);
    const matchF = gcFilter === 'all' || (gcFilter === 'active' ? !g.used : g.used);
    return matchQ && matchF;
  });
  const handleAddGc = () => {
    const amount = Number(newGc.amount);
    if (!amount || amount <= 0 || !newGc.buyer.trim()) return;
    if (onlineGc) {
      createGcMut.mutate(
        { amount, buyer: newGc.buyer.trim(), recipient: newGc.recipient.trim() || undefined },
        {
          onSuccess: () => {
            setNewGc({ amount: '', buyer: '', recipient: '' });
            setAddGcModal(false);
            setGcFilter('all');
          },
          onError: (err) => { if (isOffline(err)) addGcLocal(amount); },
        },
      );
      return;
    }
    addGcLocal(amount);
  };
  const addGcLocal = (amount: number) => {
    setGiftCards(gs => [...gs, {
      code: genGcCode(), amount, used: false,
      buyer: newGc.buyer.trim(), recipient: newGc.recipient.trim(), created: 'Sep 2026',
    }]);
    setNewGc({ amount: '', buyer: '', recipient: '' });
    setAddGcModal(false);
    setGcFilter('all');
  };
  const toggleGcUsed = (code: string) => {
    if (onlineGc) {
      const current = gcSource.find(g => g.code === code);
      if (!current) return;
      setGcUsedMut.mutate(
        { code, used: !current.used },
        { onError: (err) => { if (isOffline(err)) setGiftCards(gs => gs.map(g => g.code === code ? { ...g, used: !g.used } : g)); } },
      );
      return;
    }
    setGiftCards(gs => gs.map(g => g.code === code ? { ...g, used: !g.used } : g));
  };
  const confirmDeleteGc = () => {
    if (!deleteGcModal.code) return;
    if (onlineGc) {
      const code = deleteGcModal.code;
      deleteGcMut.mutate(code, {
        onSuccess: () => setDeleteGcModal({ open: false, code: null }),
        onError: (err) => {
          if (isOffline(err)) setGiftCards(gs => gs.filter(g => g.code !== code));
          setDeleteGcModal({ open: false, code: null });
        },
      });
      return;
    }
    setGiftCards(gs => gs.filter(g => g.code !== deleteGcModal.code));
    setDeleteGcModal({ open: false, code: null });
  };
  const copyGc = async (code: string) => {
    try { await navigator.clipboard?.writeText(code); } catch { /* portapapeles no disponible */ }
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(c => c === code ? null : c), 1600);
  };

  // ── Reseñas: moderación (pendientes + publicadas, editar/eliminar) ──
  const REVIEW_PAGE_SIZE = 6;
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'published'>('pending');
  const [reviewPage, setReviewPage] = useState(1);
  const [editReviewId, setEditReviewId] = useState<number | null>(null);
  const [editReview, setEditReview] = useState({ text: '', rating: 5, design_name: '' });
  const [editReviewError, setEditReviewError] = useState('');
  const [deleteReviewModal, setDeleteReviewModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const reviewsQuery = useAdminPosts(reviewFilter === 'pending' ? false : true, reviewPage, REVIEW_PAGE_SIZE);
  const onlineReviews = reviewsQuery.data !== undefined;
  const reviewItems = (reviewsQuery.data?.items ?? []).filter(p => p.kind === 'testimonio');
  const reviewTotal = reviewsQuery.data?.total ?? reviewItems.length;
  const reviewTotalPages = Math.max(1, Math.ceil(reviewTotal / REVIEW_PAGE_SIZE));
  const goReviewPage = (p: number) => setReviewPage(Math.max(1, Math.min(reviewTotalPages, p)));
  const switchReviewFilter = (f: 'pending' | 'published') => {
    setReviewFilter(f);
    setReviewPage(1);
  };
  // Contador liviano para el badge del sidebar (solo usa `total`, trae 1 item).
  const pendingBadgeQuery = useAdminPosts(false, 1, 1);
  const pendingCount = pendingBadgeQuery.data?.total ?? 0;
  // Si al moderar la página queda vacía (último item aprobado/eliminado), retrocede.
  useEffect(() => {
    if (!reviewsQuery.isLoading && reviewItems.length === 0 && reviewPage > 1 && reviewsQuery.data !== undefined) {
      setReviewPage(reviewPage - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewsQuery.data, reviewItems.length, reviewPage]);
  const publishMut = usePublishPost();
  const updatePostMut = useUpdatePost();
  const deletePostMut = useDeletePost();

  const openEditReview = (p: { id: number; excerpt: string | null; rating: number | null; design_name: string | null }) => {
    setEditReviewError('');
    setEditReview({
      text: p.excerpt ?? '',
      rating: p.rating ?? 5,
      design_name: p.design_name ?? '',
    });
    setEditReviewId(p.id);
  };

  const handleSaveReview = () => {
    if (editReviewId === null) return;
    if (editReview.text.trim().length < 10) {
      setEditReviewError('El texto necesita mínimo 10 caracteres.');
      return;
    }
    setEditReviewError('');
    updatePostMut.mutate(
      {
        id: editReviewId,
        patch: {
          excerpt: editReview.text.trim(),
          rating: editReview.rating,
          design_name: editReview.design_name.trim() || null,
        },
      },
      {
        onSuccess: () => setEditReviewId(null),
        onError: (err) => setEditReviewError((err as Error).message),
      },
    );
  };

  const confirmDeleteReview = () => {
    if (deleteReviewModal.id === null) return;
    deletePostMut.mutate(deleteReviewModal.id, {
      onSuccess: () => setDeleteReviewModal({ open: false, id: null, name: '' }),
    });
  };
  const updateGcMut = useUpdateGiftCard();

  const openEditGc = (g: { code: string; amount: number; buyer: string; recipient: string }) => {
    setEditGcError('');
    setEditGc({ amount: String(g.amount), buyer: g.buyer, recipient: g.recipient });
    setEditGcCode(g.code);
  };

  const handleSaveGc = () => {
    if (!editGcCode) return;
    if (!(Number(editGc.amount) > 0) || !editGc.buyer.trim()) {
      setEditGcError('Monto válido y comprador son obligatorios.');
      return;
    }
    setEditGcError('');
    const patch = {
      amount: Number(editGc.amount),
      buyer: editGc.buyer.trim(),
      recipient: editGc.recipient.trim() || null,
    };
    if (onlineGc) {
      updateGcMut.mutate(
        { code: editGcCode, patch },
        {
          onSuccess: () => setEditGcCode(null),
          onError: (err) => {
            if (isOffline(err)) {
              setGiftCards(gs => gs.map(x => x.code === editGcCode
                ? { ...x, amount: patch.amount, buyer: patch.buyer, recipient: patch.recipient ?? '' } : x));
              setEditGcCode(null);
            } else setEditGcError((err as Error).message);
          },
        },
      );
      return;
    }
    setGiftCards(gs => gs.map(x => x.code === editGcCode
      ? { ...x, amount: patch.amount, buyer: patch.buyer, recipient: patch.recipient ?? '' } : x));
    setEditGcCode(null);
  };

  // ── Users: servidor (paginado) con fallback a mocks ──
  const [userPage, setUserPage] = useState(1);
  const serverUsersQuery = useServerUsers(userPage, searchUser, userRoleFilter);
  const onlineUsers = serverUsersQuery.data !== undefined;
  const serverUserTotal = serverUsersQuery.data?.total ?? 0;
  const formatLastLogin = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const fecha = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    return `${fecha}, ${hora}`;
  };
  const mapBackendUser = (u: BackendUser): AppUser => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: (u.roles[0] ?? 'staff').toLowerCase(),
    active: u.status === 'ACTIVE',
    lastLogin: formatLastLogin(u.last_login),
  });
  const effectiveUsers: AppUser[] = onlineUsers
    ? (serverUsersQuery.data?.items.map(mapBackendUser) ?? [])
    : users.filter(u => {
        const q = searchUser.trim().toLowerCase();
        const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchR = userRoleFilter === 'all' || u.role === userRoleFilter;
        return matchQ && matchR;
      });
  const userTotalPages = onlineUsers ? Math.max(1, Math.ceil(serverUserTotal / 6)) : Math.max(1, Math.ceil(effectiveUsers.length / 6));
  const userRows = onlineUsers
    ? effectiveUsers
    : effectiveUsers.slice((userPage - 1) * 6, userPage * 6);
  const goUserPage = (p: number) => setUserPage(Math.max(1, Math.min(userTotalPages, p)));

  const createUserMut = useCreateUser();
  const deleteUserMut = useDeleteUser();
  const toggleUserMut = useToggleUserStatus();

  // ── Roles/permisos del servidor (para el tab Roles cuando hay backend) ──
  const serverRolesQuery = useServerRoles();
  const serverPermsQuery = useServerPermissions();
  const onlineRbac = serverRolesQuery.data !== undefined && serverPermsQuery.data !== undefined;
  const [serverRoleId, setServerRoleId] = useState<number | null>(null);
  const serverRolePerms = useRolePermissions(onlineRbac ? serverRoleId : null);
  const grantPermMut = useGrantPermission();
  const revokePermMut = useRevokePermission();

  // ── Gift cards: mutaciones servidor (los datos viven en el bloque Gift cards) ──
  const createGcMut = useCreateGiftCard();
  const setGcUsedMut = useSetGiftCardUsed();
  const deleteGcMut = useDeleteGiftCard();

  const confirmDeleteDesignLocal = () => {
    if (deleteDesignModal.id) setDesigns(d => d.filter(x => x.id !== deleteDesignModal.id));
    setDeleteDesignModal({ open: false, id: null });
  };

  const confirmDeleteUser = () => {
    if (!deleteUserModal.id) return;
    if (onlineUsers) {
      deleteUserMut.mutate(deleteUserModal.id, {
        onSuccess: () => setDeleteUserModal({ open: false, id: null }),
        onError: (err) => {
          if (isOffline(err)) setUsers(u => u.filter(x => x.id !== deleteUserModal.id));
          setDeleteUserModal({ open: false, id: null });
        },
      });
      return;
    }
    setUsers(u => u.filter(x => x.id !== deleteUserModal.id));
    setDeleteUserModal({ open: false, id: null });
  };

  const resetNewUser = () => {
    setNewUser({ name: '', email: '', role: 'artist', password: '' });
    setAddUserModal(false);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    if (onlineUsers) {
      const username = newUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || `user${Date.now()}`;
      createUserMut.mutate(
        { username, email: newUser.email, full_name: newUser.name, password: newUser.password || 'Cambiar-1234' },
        {
          onSuccess: () => resetNewUser(),
          onError: (err) => {
            if (isOffline(err)) {
              setUsers(u => [...u, {
                id: Date.now(), name: newUser.name, email: newUser.email,
                role: newUser.role, active: true, lastLogin: '—',
              }]);
              resetNewUser();
            }
          },
        },
      );
      return;
    }
    setUsers(u => [...u, {
      id: Date.now(), name: newUser.name, email: newUser.email,
      role: newUser.role, active: true, lastLogin: '—',
    }]);
    resetNewUser();
  };

  const handleAddDesignLocal = () => {
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

  // ── Estudio: servidor con fallback a mocks ──
  const [designPage, setDesignPage] = useState(1);
  const serverCatsQuery = useServerCategories();
  const onlineCats = serverCatsQuery.data !== undefined;
  const effCategories = onlineCats
    ? (serverCatsQuery.data ?? []).map(c => ({
        id: c.slug, name: c.name, icon: c.icon, color: c.color, description: c.description ?? '',
        design_count: c.design_count ?? 0,
      }))
    : categories.map(c => ({ ...c, design_count: designs.filter(d => d.category === c.id).length }));
  const catSlugById = new Map((serverCatsQuery.data ?? []).map(c => [c.id, c.slug] as const));
  const serverDesignsQuery = useServerDesigns(designPage, searchDesign, selectedCat);
  const onlineDesigns = serverDesignsQuery.data !== undefined;
  const mapDesign = (d: Design): MockDesign => ({
    id: d.id,
    name: d.name,
    category: catSlugById.get(d.category_id) ?? 'mano-alzada',
    price: d.price,
    duration: d.duration_min,
    image: d.image_url ?? '',
    description: d.description ?? '',
    technique: d.technique ?? '',
    tags: d.tags ?? [],
    occasion: d.occasion ?? 'Diario',
    complexity: d.complexity ?? 'Express',
  });
  const effDesigns: MockDesign[] = onlineDesigns
    ? (serverDesignsQuery.data?.items.map(mapDesign) ?? [])
    : filteredDesigns;
  const designTotal = onlineDesigns ? (serverDesignsQuery.data?.total ?? 0) : filteredDesigns.length;
  const designTotalPages = Math.max(1, Math.ceil(designTotal / 6));
  const designRows = onlineDesigns ? effDesigns : effDesigns.slice((designPage - 1) * 6, designPage * 6);
  const goDesignPage = (p: number) => setDesignPage(Math.max(1, Math.min(designTotalPages, p)));

  const createCatMut = useCreateCategory();
  const deleteCatMut = useDeleteCategory();
  const createDesignMut = useCreateDesign();
  const deleteDesignMut = useDeleteDesign();
  const updateDesignMut = useUpdateDesign();
  const updateCatMut = useUpdateCategory();
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [editDesign, setEditDesign] = useState({ name: '', price: '', duration: '', image: '', description: '' });
  const [editDesignError, setEditDesignError] = useState('');
  const [editCatSlug, setEditCatSlug] = useState<string | null>(null);
  const [editCat, setEditCat] = useState({ name: '', icon: '', color: '', description: '' });
  const [editCatError, setEditCatError] = useState('');
  const [deleteDesignError, setDeleteDesignError] = useState('');
  const editDesignQuery = useServerDesign(onlineDesigns ? editDesignId : null);

  useEffect(() => {
    const d = editDesignQuery.data;
    if (d && editDesignId !== null) {
      setEditDesign({
        name: d.name, price: String(d.price), duration: String(d.duration_min),
        image: d.image_url ?? '', description: d.description ?? '',
      });
      setEditDesignError('');
    }
  }, [editDesignQuery.data, editDesignId]);

  const openEditDesign = (id: number) => {
    setEditDesignError('');
    if (onlineDesigns) {
      const row = designRows.find(r => r.id === id);
      setEditDesign({
        name: row?.name ?? '', price: row ? String(row.price) : '', duration: row ? String(row.duration) : '',
        image: row?.image ?? '', description: row?.description ?? '',
      });
      setEditDesignId(id);
    } else {
      const found = designs.find(x => x.id === id);
      if (!found) return;
      setEditDesign({
        name: found.name, price: String(found.price), duration: String(found.duration),
        image: found.image, description: found.description,
      });
      setEditDesignId(id);
    }
  };

  const handleSaveDesign = () => {
    if (editDesignId === null) return;
    if (!editDesign.name.trim() || !(Number(editDesign.price) > 0)) {
      setEditDesignError('Nombre y precio válido son obligatorios.');
      return;
    }
    setEditDesignError('');
    const patch = {
      name: editDesign.name.trim(), price: Number(editDesign.price),
      duration_min: Number(editDesign.duration) || 90,
      image_url: editDesign.image.trim() || null, description: editDesign.description.trim() || null,
    };
    if (onlineDesigns) {
      updateDesignMut.mutate(
        { id: editDesignId, patch },
        {
          onSuccess: () => setEditDesignId(null),
          onError: (err) => {
            if (isOffline(err)) {
              setDesigns(ds => ds.map(x => x.id === editDesignId
                ? { ...x, name: patch.name, price: patch.price, duration: patch.duration_min,
                    image: (patch.image_url as string) ?? x.image, description: (patch.description as string) ?? x.description }
                : x));
              setEditDesignId(null);
            } else setEditDesignError((err as Error).message);
          },
        },
      );
      return;
    }
    setDesigns(ds => ds.map(x => x.id === editDesignId
      ? { ...x, name: patch.name, price: patch.price, duration: patch.duration_min } : x));
    setEditDesignId(null);
  };

  const openEditCategory = (slug: string) => {
    const found = effCategories.find(c => c.id === slug);
    if (!found) return;
    setEditCatError('');
    setEditCat({ name: found.name, icon: found.icon, color: found.color, description: found.description });
    setEditCatSlug(slug);
  };

  const handleSaveCategory = () => {
    if (!editCatSlug || !editCat.name.trim()) {
      setEditCatError('El nombre es obligatorio.');
      return;
    }
    setEditCatError('');
    const patch = {
      name: editCat.name.trim(), icon: editCat.icon || 'sparkles', color: editCat.color,
      description: editCat.description.trim() || null,
    };
    if (onlineCats) {
      const target = (serverCatsQuery.data ?? []).find(c => c.slug === editCatSlug);
      if (!target) return;
      updateCatMut.mutate(
        { id: target.id, patch },
        {
          onSuccess: () => setEditCatSlug(null),
          onError: (err) => {
            if (isOffline(err)) {
              setCategories(cs => cs.map(c => c.id === editCatSlug ? { ...c, ...patch, description: patch.description ?? '' } : c));
              setEditCatSlug(null);
            } else setEditCatError((err as Error).message);
          },
        },
      );
      return;
    }
    setCategories(cs => cs.map(c => c.id === editCatSlug
      ? { ...c, name: patch.name, icon: patch.icon, color: patch.color, description: patch.description ?? '' } : c));
    setEditCatSlug(null);
  };

  const handleAddCategoryOnline = () => {
    const name = newCategory.name.trim();
    if (!name) return;
    if (onlineCats) {
      createCatMut.mutate(
        { name, icon: newCategory.icon || 'sparkles', color: newCategory.color, description: newCategory.description.trim() || undefined },
        {
          onSuccess: () => {
            setNewCategory({ name: '', icon: 'sparkles', color: '#c9a96e', description: '' });
            setCatDeleteError('');
            setAddCategoryModal(false);
            setCatalogSubtab('categories');
          },
          onError: (err) => {
            if (isOffline(err)) handleAddCategoryLocal();
            else setCatDeleteError((err as Error).message);
          },
        },
      );
      return;
    }
    handleAddCategoryLocal();
  };

  const confirmDeleteCategoryOnline = () => {
    const id = deleteCategoryModal.id;
    if (!id) return;
    if (onlineCats) {
      const target = (serverCatsQuery.data ?? []).find(c => c.slug === id);
      if (!target) { handleDeleteCategoryLocal(); return; }
      deleteCatMut.mutate(target.id, {
        onSuccess: () => {
          if (selectedCat === id) setSelectedCat('all');
          setCatDeleteError('');
          setDeleteCategoryModal({ open: false, id: null });
        },
        onError: (err) => {
          if (isOffline(err)) handleDeleteCategoryLocal();
          else setCatDeleteError((err as Error).message);
        },
      });
      return;
    }
    handleDeleteCategoryLocal();
  };

  const handleAddDesignOnline = () => {
    if (!newDesign.name || !newDesign.price) return;
    if (onlineDesigns) {
      const catId = (serverCatsQuery.data ?? []).find(c => c.slug === newDesign.category)?.id;
      if (!catId) { handleAddDesignLocal(); return; }
      createDesignMut.mutate(
        {
          category_id: catId, name: newDesign.name, price: Number(newDesign.price),
          duration_min: Number(newDesign.duration) || 90,
          image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop',
        },
        {
          onSuccess: () => {
            setNewDesign({ name: '', category: 'mano-alzada', price: '', duration: '' });
            setAddDesignModal(false);
          },
          onError: (err) => { if (isOffline(err)) handleAddDesignLocal(); },
        },
      );
      return;
    }
    handleAddDesignLocal();
  };

  const confirmDeleteDesignOnline = () => {
    if (!deleteDesignModal.id) return;
    if (onlineDesigns) {
      deleteDesignMut.mutate(deleteDesignModal.id, {
        onSuccess: () => setDeleteDesignModal({ open: false, id: null }),
        onError: (err) => {
          if (isOffline(err)) setDesigns(d => d.filter(x => x.id !== deleteDesignModal.id));
          setDeleteDesignModal({ open: false, id: null });
        },
      });
      return;
    }
    setDesigns(d => d.filter(x => x.id !== deleteDesignModal.id));
    setDeleteDesignModal({ open: false, id: null });
  };

  // ── Agenda: día seleccionado + queries ──
  const todayStr = new Date().toISOString().slice(0, 10);
  const [agendaDay, setAgendaDay] = useState(todayStr);
  const [addApptModal, setAddApptModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ client_id: '', design_id: '', date: todayStr, time: '10:00', notes: '' });
  const [apptError, setApptError] = useState('');
  const dayApptsQuery = useServerAppointments(agendaDay);
  const onlineAgenda = dayApptsQuery.data !== undefined;
  const monthApptsQuery = useServerAppointments('');
  const todayApptsQuery = useServerAppointments(todayStr);
  const onlineToday = todayApptsQuery.data !== undefined;
  const todayAppts = todayApptsQuery.data?.items ?? [];

  const createApptMut = useCreateAppointment();
  const setApptStatusMut = useSetAppointmentStatus();
  const deleteApptMut = useDeleteAppointment();

  // ── Clientas: servidor (lista amplia) con fallback a mocks ──
  const [localClients, setLocalClients] = useState(MOCK_CLIENTS);
  const clientsAllQuery = useServerClients(1, '', 100);
  const onlineClients = clientsAllQuery.data !== undefined;
  const effClientsBase = onlineClients
    ? (clientsAllQuery.data?.items.map(c => ({
        id: c.id, name: c.name, phone: c.phone, visits: c.visits, points: c.points,
        lastVisit: c.last_visit ? c.last_visit.slice(0, 10) : '—', lastDesign: '—',
      })) ?? [])
    : localClients;

  const handleAddClient = () => {
    if (!newClient.name.trim() || !newClient.phone.trim()) {
      setClientError('Nombre y teléfono son obligatorios.');
      return;
    }
    setClientError('');
    if (onlineClients) {
      createClientMut.mutate(
        { name: newClient.name.trim(), phone: newClient.phone.trim(), email: newClient.email.trim() || undefined },
        {
          onSuccess: () => {
            setNewClient({ name: '', phone: '', email: '' });
            setAddClientModal(false);
          },
          onError: (err) => {
            if (isOffline(err)) {
              setLocalClients(cs => [...cs, {
                id: Date.now(), name: newClient.name.trim(), phone: newClient.phone.trim(),
                visits: 0, points: 0, lastVisit: '—', lastDesign: '—',
              }]);
              setNewClient({ name: '', phone: '', email: '' });
              setAddClientModal(false);
            } else setClientError((err as Error).message);
          },
        },
      );
      return;
    }
    setLocalClients(cs => [...cs, {
      id: Date.now(), name: newClient.name.trim(), phone: newClient.phone.trim(),
      visits: 0, points: 0, lastVisit: '—', lastDesign: '—',
    }]);
    setNewClient({ name: '', phone: '', email: '' });
    setAddClientModal(false);
  };

  const [addClientModal, setAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  const [clientError, setClientError] = useState('');
  const [rewardsFor, setRewardsFor] = useState<number | null>(null);
  const [editClientId, setEditClientId] = useState<number | null>(null);
  const [editClient, setEditClient] = useState({ name: '', phone: '', email: '', notes: '' });
  const [editClientError, setEditClientError] = useState('');
  const [deleteClientModal, setDeleteClientModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const [deleteClientError, setDeleteClientError] = useState('');
  const updateClientMut = useUpdateClient();
  const deleteClientMut = useDeleteClient();
  const editDetailQuery = useServerClient(onlineClients ? editClientId : null);
  const adjustPointsMut = useAdjustClientPoints();
  const createClientMut = useCreateClient();

  useEffect(() => {
    const d = editDetailQuery.data;
    if (d && editClientId !== null) {
      setEditClient({ name: d.name, phone: d.phone, email: d.email ?? '', notes: d.notes ?? '' });
      setEditClientError('');
    }
  }, [editDetailQuery.data, editClientId]);

  const openEditClient = (id: number, fallbackName: string, fallbackPhone: string) => {
    setEditClientError('');
    if (onlineClients) {
      setEditClient({ name: fallbackName, phone: fallbackPhone, email: '', notes: '' });
      setEditClientId(id);
    } else {
      const found = localClients.find(c => c.id === id);
      setEditClient({
        name: found?.name ?? fallbackName, phone: found?.phone ?? fallbackPhone,
        email: '', notes: '',
      });
      setEditClientId(id);
    }
  };

  const handleSaveClient = () => {
    if (editClientId === null) return;
    if (!editClient.name.trim() || !editClient.phone.trim()) {
      setEditClientError('Nombre y teléfono son obligatorios.');
      return;
    }
    setEditClientError('');
    const patch = {
      name: editClient.name.trim(), phone: editClient.phone.trim(),
      email: editClient.email.trim() || null, notes: editClient.notes.trim() || null,
    };
    if (onlineClients) {
      updateClientMut.mutate(
        { id: editClientId, patch },
        {
          onSuccess: () => setEditClientId(null),
          onError: (err) => {
            if (isOffline(err)) {
              setLocalClients(cs => cs.map(c => c.id === editClientId ? { ...c, name: patch.name, phone: patch.phone } : c));
              setEditClientId(null);
            } else setEditClientError((err as Error).message);
          },
        },
      );
      return;
    }
    setLocalClients(cs => cs.map(c => c.id === editClientId ? { ...c, name: patch.name, phone: patch.phone } : c));
    setEditClientId(null);
  };

  const confirmDeleteClient = () => {
    if (deleteClientModal.id === null) return;
    setDeleteClientError('');
    if (onlineClients) {
      const id = deleteClientModal.id;
      deleteClientMut.mutate(id, {
        onSuccess: () => setDeleteClientModal({ open: false, id: null, name: '' }),
        onError: (err) => {
          if (isOffline(err)) {
            setLocalClients(cs => cs.filter(c => c.id !== id));
            setDeleteClientModal({ open: false, id: null, name: '' });
          } else setDeleteClientError((err as Error).message);
        },
      });
      return;
    }
    setLocalClients(cs => cs.filter(c => c.id !== deleteClientModal.id));
    setDeleteClientModal({ open: false, id: null, name: '' });
  };
  const [pointsFor, setPointsFor] = useState<{ id: number; delta: string } | null>(null);
  const [deleteApptModal, setDeleteApptModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  // ── Derivados agenda ──
  const agendaDate = new Date(agendaDay + 'T12:00:00');
  const agendaMonthLabel = agendaDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const agendaDayLabel = agendaDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' });
  const agendaY = agendaDate.getFullYear();
  const agendaM = agendaDate.getMonth();
  const agendaLead = new Date(agendaY, agendaM, 1).getDay();
  const agendaDays = new Date(agendaY, agendaM + 1, 0).getDate();
  const monthDaySet = new Set((monthApptsQuery.data?.items ?? []).map(a => a.starts_at.slice(0, 10)));
  const shiftMonth = (delta: number) => {
    const d = new Date(agendaY, agendaM + delta, Math.min(agendaDate.getDate(), 28));
    setAgendaDay(d.toISOString().slice(0, 10));
  };
  const STATUS_META: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pendiente', cls: 'bg-[#d4613a]/12 text-[#e08a6d] border-[#d4613a]/30' },
    confirmed: { label: 'Confirmada', cls: 'bg-[#8aab8a]/12 text-[#8aab8a] border-[#8aab8a]/30' },
    in_progress: { label: 'En curso', cls: 'bg-[#c9a96e]/15 text-[#e8d4a8] border-[#c9a96e]/30' },
    completed: { label: 'Completada', cls: 'bg-[#2a2018] text-[#8a7d6e] border-[#2e2518]' },
    cancelled: { label: 'Cancelada', cls: 'bg-[#2a2018] text-[#4a4238] border-[#2e2518]' },
  };
  const NEXT_STATUS: Record<string, { to: string; label: string }> = {
    pending: { to: 'confirmed', label: 'Confirmar' },
    confirmed: { to: 'in_progress', label: 'Iniciar' },
    in_progress: { to: 'completed', label: 'Completar' },
  };
  const allClientsQuery = useServerClients(1, '', 100);
  const allDesignsQuery = useServerDesigns(1, '', 'all', 100);
  const clientNameById = new Map((allClientsQuery.data?.items ?? []).map(c => [c.id, c.name] as const));
  const designNameById = new Map((allDesignsQuery.data?.items ?? []).map(d => [d.id, d.name] as const));

  interface TodayRow {
    key: number | string;
    time: string;
    color: string;
    title: string;
    sub: string;
    avatar: string;
    status: string;
    cls: string;
  }
  const overviewRows: TodayRow[] = onlineToday
    ? todayAppts.slice(0, 5).map(a => {
        const meta = STATUS_META[a.status] ?? STATUS_META.pending;
        const mins = Math.round((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000);
        const cname = clientNameById.get(a.client_id) ?? `Clienta #${a.client_id}`;
        return {
          key: a.id,
          time: a.starts_at.slice(11, 16),
          color: '#c9a96e',
          title: cname,
          sub: `${a.design_id ? (designNameById.get(a.design_id) ?? 'Diseño') : 'Servicio general'} · ${mins} min`,
          avatar: cname[0] ?? '?',
          status: meta.label,
          cls: meta.cls,
        };
      })
    : ([
        { ...MOCK_APPOINTMENTS[0], artist: 'Gaby M.', status: 'En curso', statusCls: 'bg-[#c9a96e]/15 text-[#e8d4a8] border-[#c9a96e]/30' },
        { ...MOCK_APPOINTMENTS[1], artist: 'Dani R.', status: 'Confirmada', statusCls: 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' },
        { ...MOCK_APPOINTMENTS[2], artist: 'Gaby M.', status: 'Confirmada', statusCls: 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' },
        { ...MOCK_APPOINTMENTS[3], artist: 'Dani R.', status: 'Pendiente', statusCls: 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/25' },
      ] as const).map(a => ({
        key: a.id,
        time: a.time,
        color: a.color,
        title: a.client,
        sub: `${a.service} · ${a.artist}`,
        avatar: a.client[0],
        status: a.status,
        cls: a.statusCls,
      }));

  interface AgendaRow {
    key: number | string;
    time: string;
    color: string;
    title: string;
    sub: string;
    avatar: string;
    status: string;
    cls: string;
    id: number | null;
    statusKey: string;
  }
  const agendaRows: AgendaRow[] = onlineAgenda
    ? (dayApptsQuery.data?.items ?? []).map(a => {
        const meta = STATUS_META[a.status] ?? STATUS_META.pending;
        const cname = clientNameById.get(a.client_id) ?? `Clienta #${a.client_id}`;
        return {
          key: a.id,
          time: a.starts_at.slice(11, 16),
          color: '#c9a96e',
          title: cname,
          sub: `${a.design_id ? (designNameById.get(a.design_id) ?? 'Diseño') : 'Servicio general'} · ${a.artist_name}`,
          avatar: cname[0] ?? '?',
          status: meta.label,
          cls: meta.cls,
          id: a.id,
          statusKey: a.status,
        };
      })
    : ([
        { ...MOCK_APPOINTMENTS[0], artist: 'Gaby M.', status: 'En curso', cls: 'bg-[#c9a96e]/15 text-[#e8d4a8] border-[#c9a96e]/30' },
        { ...MOCK_APPOINTMENTS[1], artist: 'Dani R.', status: 'Confirmada', cls: 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' },
        { ...MOCK_APPOINTMENTS[2], artist: 'Gaby M.', status: 'Confirmada', cls: 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' },
        { ...MOCK_APPOINTMENTS[3], artist: 'Dani R.', status: 'Pendiente', cls: 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/30' },
      ] as const).map(a => ({
        key: `mock-${a.id}`,
        time: a.time,
        color: a.color,
        title: a.client,
        sub: `${a.service} · ${a.artist}`,
        avatar: a.client[0],
        status: a.status,
        cls: a.cls,
        id: null,
        statusKey: '',
      }));

  const handleAddAppointment = () => {
    const cid = Number(newAppt.client_id);
    if (!cid || !newAppt.date || !newAppt.time) {
      setApptError('Elige clienta, fecha y hora.');
      return;
    }
    const start = new Date(`${newAppt.date}T${newAppt.time}:00`);
    const design = (allDesignsQuery.data?.items ?? []).find(d => d.id === Number(newAppt.design_id));
    const end = new Date(start.getTime() + (design?.duration_min ?? 60) * 60000);
    const toISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    setApptError('');
    createApptMut.mutate(
      {
        client_id: cid, design_id: newAppt.design_id ? Number(newAppt.design_id) : null,
        starts_at: toISO(start), ends_at: toISO(end), notes: newAppt.notes || undefined,
      },
      {
        onSuccess: () => {
          setAddApptModal(false);
          setNewAppt({ client_id: '', design_id: '', date: agendaDay, time: '10:00', notes: '' });
          setAgendaDay(newAppt.date);
        },
        onError: (err) => setApptError((err as Error).message || 'No se pudo reservar.'),
      },
    );
  };

  const advanceAppointment = (id: number, status: string) => {
    const next = NEXT_STATUS[status];
    if (!next) return;
    setApptStatusMut.mutate({ id, status: next.to });
  };

  const confirmDeleteAppointment = () => {
    if (deleteApptModal.id == null) return;
    deleteApptMut.mutate(deleteApptModal.id, {
      onSuccess: () => setDeleteApptModal({ open: false, id: null }),
      onError: () => setDeleteApptModal({ open: false, id: null }),
    });
  };

  const toggleUserActive = (id: number, active: boolean) => {
    if (onlineUsers) {
      toggleUserMut.mutate(
        { id, status: active ? 'INACTIVE' : 'ACTIVE' },
        { onError: (err) => { if (isOffline(err)) setUsers(u => u.map(x => x.id === id ? { ...x, active: !x.active } : x)); } },
      );
      return;
    }
    setUsers(u => u.map(x => x.id === id ? { ...x, active: !x.active } : x));
  };

  const roleOf = (roleId: string) =>
    ROLES.find(r => r.id === roleId) ?? { id: roleId, name: roleId, color: '#8a7d6e', permissions: [] as string[] };

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
            { section: 'Negocio', ids: ['giftcards', 'reviews'] },
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
                    t.id === 'clients' ? String(effClientsBase.length) :
                    t.id === 'users' ? String(onlineUsers ? serverUserTotal : users.length) :
                    t.id === 'giftcards' ? String(onlineGc ? gcSource.filter(g => !g.used).length : giftCards.filter(g => !g.used).length) :
                    t.id === 'reviews' ? (pendingCount > 0 ? String(pendingCount) : null) : null;
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
                { label: 'Citas hoy', value: String(onlineToday ? todayAppts.length : 4), sub: onlineToday ? `${todayAppts.filter(a => a.status === 'pending').length} pendientes` : '3 confirmadas · 1 pendiente', icon: Calendar, accent: '#c9a96e', spark: [35, 55, 40, 70, 58, 85, 64] },
                { label: 'Diseños', value: String(onlineDesigns ? designTotal : designs.length), sub: onlineCats ? `${effCategories.length} categorías` : 'catálogo activo', icon: Package, accent: '#8aab8a', spark: [30, 45, 38, 60, 52, 78, 90] },
                { label: 'Clientas', value: String(effClientsBase.length), sub: onlineClients ? 'base en servidor' : 'base local', icon: Users, accent: '#9b8ea8', spark: [50, 62, 55, 70, 66, 74, 68] },
                { label: 'Gift activas', value: String(gcSource.filter(g => !g.used).length), sub: onlineGc ? 'por canjear' : 'demo local', icon: Gift, accent: '#d4613a', spark: [40, 48, 55, 52, 64, 70, 76] },
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
                    <p className="text-[#8a7d6e] text-xs mt-0.5">
                      {onlineToday ? `${todayAppts.length} cita(s) · una artista en turno` : '4 citas · 2 artistas en turno'}
                    </p>
                  </div>
                  <button onClick={() => setTab('agenda')} className="flex items-center gap-1 text-xs text-[#c9a96e] hover:gap-2 transition-all">
                    Ver todo <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  {overviewRows.length === 0 ? (
                    <p className="py-6 text-center text-[#8a7d6e] text-xs">Sin citas hoy. La agenda está libre.</p>
                  ) : overviewRows.map(a => (
                    <div key={a.key} className="flex items-center gap-4 py-3 border-b border-[#2e2518]/70 last:border-0 hover:bg-[#2a2018]/30 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="text-center w-12 shrink-0">
                        <p className="font-mono text-[#e8d4a8] text-sm font-medium">{a.time}</p>
                      </div>
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="w-9 h-9 rounded-full bg-[#2a2018] border border-[#c9a96e]/25 flex items-center justify-center font-serif text-[#c9a96e] text-sm shrink-0">
                        {a.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f0ebe4] text-sm truncate">{a.title}</p>
                        <p className="text-[#8a7d6e] text-xs truncate">{a.sub}</p>
                      </div>
                      <span className={"hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] border " + a.cls}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {/* ── Próxima cita ── */}
                {(() => {
                  const upcoming = onlineToday
                    ? [...todayAppts].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
                        .find(a => a.status === 'pending' || a.status === 'confirmed')
                    : null;
                  if (!upcoming) {
                    return (
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
                    );
                  }
                  const cname = clientNameById.get(upcoming.client_id) ?? `Clienta #${upcoming.client_id}`;
                  const dname = upcoming.design_id ? (designNameById.get(upcoming.design_id) ?? 'Diseño') : 'Servicio general';
                  const meta = STATUS_META[upcoming.status] ?? STATUS_META.pending;
                  return (
                <div className="rounded-2xl p-5 border border-[#c9a96e]/30 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #2a2013 0%, #1a1409 100%)' }}>
                  <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.25em] uppercase mb-2">Próxima · {upcoming.starts_at.slice(11, 16)}</p>
                  <p className="font-serif text-xl text-[#f0ebe4]">{cname}</p>
                  <p className="text-[#c8bfb0] text-xs mt-1">{dname} · {meta.label}</p>
                  <div className="flex gap-2 mt-4">
                    {NEXT_STATUS[upcoming.status] && (
                      <Can code="reservas.update">
                        <button onClick={() => advanceAppointment(upcoming.id, upcoming.status)}
                          className="flex-1 py-2 bg-[#c9a96e] text-[#0d0b0a] text-xs font-semibold rounded-lg hover:bg-[#d4b87e] transition-colors">
                          {NEXT_STATUS[upcoming.status].label}
                        </button>
                      </Can>
                    )}
                    <button onClick={() => setTab('agenda')} className="flex-1 py-2 border border-[#c9a96e]/30 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">Ver agenda</button>
                  </div>
                </div>
                  );
                })()}

                {/* ── Estado de hoy ── */}
                <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5">
                  <p className="text-[#f0ebe4] text-sm font-medium mb-4">Estado de hoy</p>
                  <div className="space-y-4">
                    {(() => {
                      const counts = onlineToday
                        ? [
                            { label: 'Pendientes', n: todayAppts.filter(a => a.status === 'pending').length, color: '#d4613a' },
                            { label: 'Confirmadas / en curso', n: todayAppts.filter(a => a.status === 'confirmed' || a.status === 'in_progress').length, color: '#c9a96e' },
                            { label: 'Completadas', n: todayAppts.filter(a => a.status === 'completed').length, color: '#8aab8a' },
                          ]
                        : [
                            { label: 'Pendientes', n: 1, color: '#d4613a' },
                            { label: 'Confirmadas / en curso', n: 3, color: '#c9a96e' },
                            { label: 'Completadas', n: 0, color: '#8aab8a' },
                          ];
                      const max = Math.max(1, ...counts.map(c => c.n));
                      return counts.map(t => (
                      <div key={t.label}>
                        <div className="flex justify-between items-baseline text-xs mb-1.5">
                          <span className="text-[#f0ebe4]">{t.label}</span>
                          <span className="font-mono" style={{ color: t.color }}>{t.n}</span>
                        </div>
                        <div className="h-1.5 bg-[#2a2018] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((t.n / max) * 100)}%`, background: `linear-gradient(90deg, ${t.color}88, ${t.color})` }} />
                        </div>
                      </div>
                      ));
                    })()}
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
                  {(() => {
                    if (!onlineAgenda && !onlineToday) {
                      return [
                        { name: 'Mano Alzada', detail: '18 citas · ₡270,000', pct: 85 },
                        { name: 'Acrílicas', detail: '14 citas · ₡238,000', pct: 72 },
                        { name: 'Efectos Chrome', detail: '11 citas · ₡132,000', pct: 60 },
                        { name: 'Encapsulados', detail: '8 citas · ₡96,000', pct: 48 },
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
                      ));
                    }
                    const byDesign = new Map<number, number>();
                    for (const a of (monthApptsQuery.data?.items ?? [])) {
                      if (a.design_id) byDesign.set(a.design_id, (byDesign.get(a.design_id) ?? 0) + 1);
                    }
                    const top = [...byDesign.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4);
                    if (top.length === 0) {
                      return <p className="py-4 text-center text-[#8a7d6e] text-xs">Sin citas registradas este mes.</p>;
                    }
                    const max = top[0][1];
                    const priceById = new Map((allDesignsQuery.data?.items ?? []).map(d => [d.id, d.price] as const));
                    return top.map(([id, n]) => {
                      const name = designNameById.get(id) ?? `Diseño #${id}`;
                      const income = n * (priceById.get(id) ?? 0);
                      const pct = Math.round((n / max) * 100);
                      return (
                        <div key={id}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[#f0ebe4]">{name} <span className="text-[#4a4238]">· {n} citas{income > 0 ? ` · ₡${income.toLocaleString()}` : ''}</span></span>
                            <span className="text-[#c9a96e] font-mono">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[#2a2018] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#8a5f2e] to-[#c9a96e] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* ── Requieren atención (datos vivos) ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5 sm:p-6">
                <p className="text-[#f0ebe4] text-sm font-medium mb-4">Requieren atención</p>
                <div className="space-y-3">
                  {(() => {
                    if (!onlineToday) {
                      return <p className="text-[#8a7d6e] text-xs">○ Local — conecta el servidor para ver pendientes reales.</p>;
                    }
                    const pending = todayAppts.filter(a => a.status === 'pending');
                    const activeGc = gcSource.filter(g => !g.used).length;
                    if (pending.length === 0 && activeGc === 0) {
                      return <p className="text-[#8aab8a] text-xs">Todo al día. Sin pendientes ni gift por canjear.</p>;
                    }
                    return (
                      <>
                        {pending.slice(0, 3).map(a => (
                          <div key={a.id} className="flex gap-3 p-3 rounded-xl bg-[#d4613a]/8 border border-[#d4613a]/25">
                            <Clock size={15} className="text-[#e08a6d] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[#f0ebe4] text-xs font-medium">
                                Confirmar: {clientNameById.get(a.client_id) ?? `Clienta #${a.client_id}`} · {a.starts_at.slice(11, 16)}
                              </p>
                              <p className="text-[#8a7d6e] text-xs mt-0.5">Cita pendiente de hoy sin confirmar</p>
                            </div>
                          </div>
                        ))}
                        {activeGc > 0 && (
                          <div className="flex gap-3 p-3 rounded-xl bg-[#c9a96e]/6 border border-[#c9a96e]/20">
                            <Gift size={15} className="text-[#c9a96e] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[#f0ebe4] text-xs font-medium">{activeGc} gift card(s) por canjear</p>
                              <p className="text-[#8a7d6e] text-xs mt-0.5">Recuerda ofrecerlas en el cierre del servicio</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
                  { id: 'designs', label: `Diseños (${onlineDesigns ? designTotal : designs.length})` },
                  { id: 'categories', label: `Categorías (${onlineCats ? effCategories.length : categories.length})` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setCatalogSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${catalogSubtab === t.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                {(onlineDesigns || onlineCats) && (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                )}
                {catalogSubtab === 'designs' ? (
                  <Can code="catalogo.create">
                    <button onClick={() => setAddDesignModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all">
                      <Plus size={15} /> Nuevo diseño
                    </button>
                  </Can>
                ) : (
                  <Can code="catalogo.create">
                    <button onClick={() => { setCatDeleteError(''); setAddCategoryModal(true); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all">
                      <Plus size={15} /> Nueva categoría
                    </button>
                  </Can>
                )}
              </div>
            </div>

            {catalogSubtab === 'designs' && (
            <>
            {/* ── Mini KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total diseños', value: String(onlineDesigns ? designTotal : designs.length), sub: `${onlineDesigns ? designRows.length : filteredDesigns.length} visibles` },
                { label: 'Precio promedio', value: `₡${(onlineDesigns ? (designRows.length ? Math.round(designRows.reduce((a, d) => a + d.price, 0) / designRows.length) : 0) : avgPrice).toLocaleString()}`, sub: 'por servicio' },
                { label: 'Duración prom.', value: `${onlineDesigns ? (designRows.length ? Math.round(designRows.reduce((a, d) => a + d.duration, 0) / designRows.length) : 0) : avgDuration} min`, sub: 'por cita' },
                { label: 'Categorías', value: String(onlineCats ? effCategories.length : catCount), sub: 'colecciones activas' },
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
                    onChange={e => { setSearchDesign(e.target.value); catalogPag.setPage(1); goDesignPage(1); }}
                    placeholder="Buscar por nombre…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.1)] w-full md:w-64 transition-all"
                  />
                </div>
                <p className="text-[#8a7d6e] text-xs font-mono md:text-right">{onlineDesigns ? designTotal : filteredDesigns.length} resultado(s)</p>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setSelectedCat('all'); catalogPag.setPage(1); goDesignPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${selectedCat === 'all' ? 'bg-[#c9a96e] text-[#0d0b0a] border-[#c9a96e] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}>
                  Todas
                </button>
                {effCategories.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCat(c.id); catalogPag.setPage(1); goDesignPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${selectedCat === c.id ? 'text-[#0d0b0a] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}
                    style={selectedCat === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                    <CategoryIcon name={c.icon} size={13} /> {c.name}
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
                  {designRows.map(d => {
                    const cat = effCategories.find(c => c.id === d.category);
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
                          <span>{cat && <CategoryIcon name={cat.icon} size={11} />}</span> {cat?.name ?? d.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5"><span className="font-serif text-lg text-[#e8d4a8]">₡{d.price.toLocaleString()}</span></td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 text-[#8a7d6e] text-xs">
                          <Clock size={12} className="text-[#4a4238]" /> {d.duration} min
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Can code="catalogo.update">
                            <button title="Editar" onClick={() => openEditDesign(d.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]/30 hover:bg-[#c9a96e]/10 transition-all"><Edit3 size={14} /></button>
                          </Can>
                          <Can code="catalogo.delete">
                            <button title="Eliminar" onClick={() => setDeleteDesignModal({ open: true, id: d.id })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#8a7d6e] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 transition-all"><Trash2 size={14} /></button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {designRows.length === 0 && (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <Package size={28} className="mx-auto text-[#2e2518] mb-3" />
                      <p className="font-serif text-[#8a7d6e] text-lg">Sin diseños con esos filtros</p>
                      <p className="text-[#4a4238] text-xs mt-1 mb-4">Prueba con otro nombre o categoría</p>
                      <button onClick={() => { setSearchDesign(''); setSelectedCat('all'); catalogPag.setPage(1); goDesignPage(1); }}
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
            <Pagination page={onlineDesigns ? designPage : catalogPag.page} total={onlineDesigns ? designTotalPages : catalogPag.totalPages} onChange={onlineDesigns ? goDesignPage : catalogPag.setPage} count={onlineDesigns ? designTotal : filteredDesigns.length} pageSize={6} />
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
                  <p className="text-[#8a7d6e] text-xs font-mono">{effCategories.filter(c => {
                    const q = searchCat.trim().toLowerCase();
                    return !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
                  }).length} categoría(s)</p>
                </div>

                {(() => {
                  const list = effCategories.filter(c => {
                    const q = searchCat.trim().toLowerCase();
                    return !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
                  });
                  return list.length === 0 ? (
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
                    {list.map(c => {
                      const n = c.design_count ?? designsInCat(c.id);
                      return (
                        <div key={c.id} className="group relative bg-[#181310] border border-[#2e2518] hover:border-[#c9a96e]/35 rounded-2xl p-5 transition-all overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                                style={{ background: `${c.color}14`, borderColor: `${c.color}35`, color: c.color }}>
                                <CategoryIcon name={c.icon} size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-serif text-[#f0ebe4] leading-tight truncate">{c.name}</p>
                                <p className="text-[#4a4238] text-[11px] font-mono mt-0.5">/{c.id} · {n} diseño(s)</p>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Can code="catalogo.update">
                                <button title="Editar categoría" onClick={() => openEditCategory(c.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 border border-transparent hover:border-[#c9a96e]/30 transition-all shrink-0">
                                  <Edit3 size={14} />
                                </button>
                              </Can>
                              <Can code="catalogo.delete">
                                <button title="Eliminar categoría"
                                  onClick={() => { setCatDeleteError(''); setDeleteCategoryModal({ open: true, id: c.id }); }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a4238] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all shrink-0">
                                  <Trash2 size={14} />
                                </button>
                              </Can>
                            </div>
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
                );
                })()}
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.25em] uppercase">Agenda · {agendaMonthLabel}</p>
                <h2 className="font-serif text-xl text-[#f0ebe4] mt-0.5 capitalize">
                  {onlineAgenda ? `${dayApptsQuery.data?.total ?? 0} citas · ${agendaDayLabel}` : '4 citas programadas'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onlineAgenda ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#2a2018] text-[#8a7d6e] border border-[#2e2518]">○ Local</span>
                )}
                <input type="date" value={agendaDay} onChange={e => e.target.value && setAgendaDay(e.target.value)}
                  className="bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-xs text-[#f0ebe4] px-3 py-2 outline-none focus:border-[#c9a96e]/60 [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-4 items-start">
              {/* ── Mini calendario ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-serif text-sm text-[#f0ebe4] capitalize">{agendaMonthLabel}</p>
                  <div className="flex gap-1">
                    <button onClick={() => shiftMonth(-1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-[#2e2518] text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]/40 transition-colors"><ChevronLeft size={12} /></button>
                    <button onClick={() => shiftMonth(1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-[#2e2518] text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]/40 transition-colors"><ChevronRight size={12} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-[#4a4238] mb-1.5">
                  {['D','L','M','M','J','V','S'].map((d, i) => <div key={i} className="py-0.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: agendaLead }).map((_, i) => <div key={`p${i}`} className="h-8" />)}
                  {Array.from({ length: agendaDays }).map((_, i) => {
                    const day = i + 1;
                    const iso = `${agendaY}-${String(agendaM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasAppt = onlineAgenda ? monthDaySet.has(iso) : [10, 12, 15, 17, 20, 22].includes(day);
                    const isSel = iso === agendaDay;
                    const isToday = iso === todayStr;
                    return (
                      <button key={day} onClick={() => setAgendaDay(iso)} title={hasAppt ? `${day} · con citas` : `${day}`}
                        className={`h-8 rounded-lg flex items-center justify-center text-[11px] transition-all relative
                        ${isSel ? 'bg-[#c9a96e] text-[#0d0b0a] font-bold shadow-[0_2px_12px_rgba(201,169,110,0.35)]' :
                          hasAppt ? 'bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#e8d4a8] hover:bg-[#c9a96e]/20' :
                          'text-[#8a7d6e] hover:bg-[#2a2018]'}`}>
                        {day}
                        {!isSel && isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#c9a96e]" />}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setAgendaDay(todayStr)}
                  className="mt-3 w-full py-1.5 text-[11px] font-mono text-[#8a7d6e] hover:text-[#c9a96e] border border-[#2e2518] hover:border-[#c9a96e]/40 rounded-lg transition-all">
                  Volver a hoy
                </button>
              </div>

              {/* ── Citas del día ── */}
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#f0ebe4] text-[13px] font-medium capitalize">{agendaDayLabel}</p>
                  <Can code="reservas.create">
                    <button onClick={() => { setApptError(''); setNewAppt(a => ({ ...a, date: agendaDay })); setAddApptModal(true); }}
                      className="flex items-center gap-1 text-[11px] text-[#c9a96e] hover:gap-2 transition-all">
                      <Plus size={11} /> Nueva cita
                    </button>
                  </Can>
                </div>
                <div className="divide-y divide-[#2e2518]/60">
                  {agendaRows.length === 0 ? (
                    <p className="py-8 text-center text-[#8a7d6e] text-xs">Sin citas este día. Crea la primera con Nueva cita.</p>
                  ) : agendaRows.map(a => {
                    const apptId = a.id;
                    const next = apptId !== null ? NEXT_STATUS[a.statusKey] : undefined;
                    return (
                    <div key={a.key} className="flex items-center gap-3 py-2.5 group hover:bg-[#c9a96e]/[0.03] rounded-lg px-1.5 -mx-1.5 transition-colors">
                      <span className="font-mono text-[12px] text-[#e8d4a8] w-10 shrink-0">{a.time}</span>
                      <span className="w-1 h-7 rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#2a2018] border border-[#c9a96e]/25 font-serif text-[#c9a96e] text-sm shrink-0">
                        {a.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f0ebe4] text-[13px] leading-tight truncate">{a.title}</p>
                        <p className="text-[#8a7d6e] text-[11px] truncate">{a.sub}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap">{a.status}</span>
                      {apptId !== null && next && (
                        <button onClick={() => advanceAppointment(apptId, a.statusKey)} title={next.label}
                          className="text-[10px] px-2 py-1 rounded-lg border border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-all shrink-0">
                          {next.label}
                        </button>
                      )}
                      {apptId !== null && (
                        <button onClick={() => setDeleteApptModal({ open: true, id: apptId })} title="Eliminar"
                          className="text-[#4a4238] hover:text-[#e08a6d] transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            GIFT CARDS
        ════════════════════════════════════ */}
        {tab === 'clients' && (
          <div className="space-y-4">
            {/* ── KPIs boutique ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Clientas', value: String(effClientsBase.length), sub: 'base activa' },
                { label: 'VIP (10+ visitas)', value: String(effClientsBase.filter(c => c.visits >= 10).length), sub: 'prioridad agenda' },
                { label: 'Visita promedio', value: `${Math.round(effClientsBase.reduce((a, c) => a + c.visits, 0) / Math.max(1, effClientsBase.length))}`, sub: 'por clienta' },
                { label: 'Puntos activos', value: String(effClientsBase.reduce((a, c) => a + c.points, 0)), sub: 'en circulación' },
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
                <div className="flex gap-2 items-center">
                  {onlineClients ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#2a2018] text-[#8a7d6e] border border-[#2e2518]">○ Local</span>
                  )}
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
                  <Can code="clientas.create">
                    <button onClick={() => { setClientError(''); setAddClientModal(true); }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#c9a96e] text-[#0d0b0a] hover:bg-[#d4b87e] transition-all whitespace-nowrap">
                      <Plus size={12} /> Nueva
                    </button>
                  </Can>
                </div>
              </div>
            </div>

            {/* ── Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {effClientsBase .map(c => ({
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
                            <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Can code="clientas.update">
                                <button title="Editar" onClick={() => openEditClient(c.id, c.name, c.phone)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 border border-transparent hover:border-[#c9a96e]/30 transition-all"><Edit3 size={13} /></button>
                              </Can>
                              <Can code="clientas.delete">
                                <button title="Eliminar" onClick={() => { setDeleteClientError(''); setDeleteClientModal({ open: true, id: c.id, name: c.name }); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all"><Trash2 size={13} /></button>
                              </Can>
                            </div>
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
                            <button onClick={() => setRewardsFor(c.id)}
                              className="flex-1 py-2 border border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/10 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                              <Gift size={12} /> Lealtad
                            </button>
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

            {effClientsBase.filter(c => {
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
                  { id: 'users', label: `Usuarios (${onlineUsers ? serverUserTotal : users.length})` },
                  { id: 'roles', label: `Roles y permisos (${onlineRbac ? (serverRolesQuery.data?.length ?? 0) : ROLES.length})` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setUsersSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${usersSubtab === t.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {usersSubtab === 'users' && (
                <div className="flex items-center gap-2 shrink-0">
                  {onlineUsers ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#2a2018] text-[#8a7d6e] border border-[#2e2518]">○ Local</span>
                  )}
                  <Can code="usuarios.create">
                    <button onClick={() => setAddUserModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all w-fit">
                      <UserPlus size={14} /> Nuevo usuario
                    </button>
                  </Can>
                </div>
              )}
            </div>

            {usersSubtab === 'users' && (
            <>
            {/* ── Toolbar ── */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238]" />
                  <input
                    value={searchUser}
                    onChange={e => { setSearchUser(e.target.value); goUserPage(1); }}
                    placeholder="Buscar por nombre o email…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b0a] border border-[#2e2518] rounded-xl text-sm text-[#f0ebe4] placeholder-[#4a4238] focus:outline-none focus:border-[#c9a96e]/60 w-full md:w-72 transition-all"
                  />
                </div>
                <p className="text-[#8a7d6e] text-xs font-mono">{(onlineUsers ? serverUserTotal : effectiveUsers.length)} resultado(s)</p>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setUserRoleFilter('all'); goUserPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${userRoleFilter === 'all' ? 'bg-[#c9a96e] text-[#0d0b0a] border-[#c9a96e] font-semibold' : 'border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                  Todos
                </button>
                {(onlineRbac && serverRolesQuery.data
                  ? serverRolesQuery.data.map((r, i) => ({
                      id: r.name, name: r.name,
                      color: ['#c9a96e', '#9b8ea8', '#8aab8a', '#d4613a', '#8ab0c8'][i % 5] ?? '#c9a96e',
                    }))
                  : ROLES
                ).map(r => (
                  <button key={r.id} onClick={() => { setUserRoleFilter(r.id); goUserPage(1); }}
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
                  {userRows.map(u => {
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
                          <Can code="usuarios.update">
                            <button onClick={() => toggleUserActive(u.id, u.active)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${u.active ? 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25 hover:bg-[#8aab8a]/20' : 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/25 hover:bg-[#d4613a]/20'}`}>
                            {u.active ? '● Activo' : '○ Inactivo'}
                          </button>
                          </Can>
                        </td>
                        <td className="py-3.5 px-5 text-[#8a7d6e] text-xs font-mono whitespace-nowrap">{u.lastLogin}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button title="Editar" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 border border-transparent hover:border-[#c9a96e]/30 transition-all"><Edit3 size={14} /></button>
                            {u.role !== 'admin' && (
                              <Can code="usuarios.delete">
                                <button title="Eliminar" onClick={() => setDeleteUserModal({ open: true, id: u.id })}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a7d6e] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all"><Trash2 size={14} /></button>
                              </Can>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {userRows.length === 0 && (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <Shield size={26} className="mx-auto text-[#2e2518] mb-3" />
                      <p className="font-serif text-[#8a7d6e] text-lg">Sin usuarios con esos filtros</p>
                      <button onClick={() => { setSearchUser(''); setUserRoleFilter('all'); goUserPage(1); }}
                        className="mt-4 px-4 py-2 border border-[#c9a96e]/40 text-[#c9a96e] text-xs rounded-lg hover:bg-[#c9a96e]/10 transition-colors">
                        Limpiar filtros
                      </button>
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
            <Pagination page={userPage} total={userTotalPages} onChange={goUserPage} count={(onlineUsers ? serverUserTotal : effectiveUsers.length)} pageSize={6} />
            </>
            )}

            {usersSubtab === 'roles' && onlineRbac && (
              <ServerRolesPanel
                roles={serverRolesQuery.data ?? []}
                permissions={serverPermsQuery.data ?? []}
                activeRoleId={serverRoleId ?? serverRolesQuery.data?.[0]?.id ?? null}
                onSelect={setServerRoleId}
                rolePerms={serverRolePerms.data ?? []}
                permsLoading={serverRolePerms.isLoading}
                onGrant={(roleId, permissionId) => grantPermMut.mutate({ roleId, permissionId })}
                onRevoke={(roleId, permissionId) => revokePermMut.mutate({ roleId, permissionId })}
                busy={grantPermMut.isPending || revokePermMut.isPending}
              />
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
                    { g: 'Catálogo', keys: ['catalogo.read', 'catalogo.update'] },
                    { g: 'Reservas', keys: ['reservas.read', 'reservas.update'] },
                    { g: 'Clientas & Gift Cards', keys: ['clientas.read', 'clientas.update', 'giftcards.read', 'giftcards.create'] },
                    { g: 'Equipo', keys: ['usuarios.read', 'usuarios.create', 'usuarios.update', 'usuarios.delete'] },
                    { g: 'Roles', keys: ['roles.read', 'roles.update'] },
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
        {tab === 'giftcards' && (
          <div className="space-y-4">
            {/* ── Barra compacta ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#181310] border border-[#2e2518] w-fit">
                {([
                  { id: 'all', label: `Todas (${gcTotal})` },
                  { id: 'active', label: `Activas (${gcSource.filter(g => !g.used).length})` },
                  { id: 'used', label: `Canjeadas (${gcSource.filter(g => g.used).length})` },
                ] as const).map(f => (
                  <button key={f.id} onClick={() => setGcFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${gcFilter === f.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineGc ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#2a2018] text-[#8a7d6e] border border-[#2e2518]">○ Local</span>
                )}
                <Can code="giftcards.create">
                  <button onClick={() => setAddGcModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-semibold rounded-xl hover:bg-[#d4b87e] shadow-[0_4px_20px_rgba(201,169,110,0.25)] transition-all w-fit">
                    <Plus size={15} /> Nueva gift card
                  </button>
                </Can>
              </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Emitidas', value: String(gcTotal), sub: `${filteredGcs.length} visibles` },
                { label: 'Valor activo', value: `₡${gcActiveValue.toLocaleString()}`, sub: 'por canjear' },
                { label: 'Valor canjeado', value: `₡${gcUsedValue.toLocaleString()}`, sub: 'ingreso realizado' },
                { label: 'Monto promedio', value: gcTotal ? `₡${Math.round((gcActiveValue + gcUsedValue) / gcTotal)}` : '₡0', sub: 'por tarjeta' },
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
                {filteredGcs.map(g => (                  <div key={g.code} className={`relative rounded-2xl border p-5 overflow-hidden transition-all group ${g.used ? 'bg-[#141110] border-[#2e2518] opacity-70' : 'bg-[#181310] border-[#c9a96e]/30 hover:border-[#c9a96e]/55 hover:shadow-[0_8px_36px_rgba(201,169,110,0.12)]'}`}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: g.used ? '#2e2518' : 'linear-gradient(90deg,#8a5f2e,#e8d4a8,#8a5f2e)' }} />
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${g.used ? 'text-[#4a4238] border-[#2e2518]' : 'text-[#e8d4a8] border-[#c9a96e]/30 bg-[#c9a96e]/10'}`}>
                        <Gift size={16} />
                      </div>
                      <Can code="giftcards.update">
                        <button onClick={() => toggleGcUsed(g.code)} title={g.used ? 'Reactivar' : 'Marcar canjeada'}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${g.used ? 'bg-[#2a2018] text-[#8a7d6e] border-[#2e2518] hover:border-[#8a7d6e]' : 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/30 hover:bg-[#8aab8a]/20'}`}>
                          {g.used ? 'Canjeada' : '● Activa'}
                        </button>
                      </Can>
                    </div>
                    <p className={`font-serif leading-none ${g.used ? 'text-[#8a7d6e]' : 'text-gradient'}`} style={{ fontSize: '2.1rem' }}>₡{g.amount.toLocaleString()}</p>
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
                      <Can code="giftcards.update">
                        <button onClick={() => toggleGcUsed(g.code)}
                          className="flex-1 py-2 text-xs rounded-xl border border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8] hover:border-[#c9a96e]/40 transition-all">
                          {g.used ? 'Reactivar' : 'Marcar canjeada'}
                        </button>
                      </Can>
                      <Can code="giftcards.update">
                        <button onClick={() => openEditGc(g)} title="Editar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#8a7d6e] hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 hover:border-[#c9a96e]/30 transition-all">
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can code="giftcards.delete">
                        <button onClick={() => setDeleteGcModal({ open: true, code: g.code })} title="Eliminar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#4a4238] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'reviews' && (
          <div className="space-y-4">
            {/* ── Barra: pendientes / publicadas ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#181310] border border-[#2e2518] w-fit">
                {([
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'published', label: 'Publicadas' },
                ] as const).map(f => (
                  <button key={f.id} onClick={() => switchReviewFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${reviewFilter === f.id ? 'bg-[#c9a96e] text-[#0d0b0a]' : 'text-[#8a7d6e] hover:text-[#e8d4a8]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineReviews ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#2a2018] text-[#8a7d6e] border border-[#2e2518]">○ Sin conexión</span>
                )}
              </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: reviewFilter === 'pending' ? 'Por moderar' : 'Publicadas', value: String(reviewTotal), sub: reviewFilter === 'pending' ? 'esperando revisión' : 'visibles en el sitio' },
                { label: 'Rating promedio', value: reviewItems.length ? (reviewItems.reduce((a, p) => a + (p.rating ?? 0), 0) / reviewItems.length).toFixed(1) + ' ★' : '—', sub: 'promedio de esta página' },
                { label: 'Con diseño', value: String(reviewItems.filter(p => p.design_name).length), sub: 'mencionan un diseño' },
              ].map(k => (
                <div key={k.label} className="bg-[#181310] border border-[#2e2518] rounded-2xl px-5 py-4">
                  <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#f0ebe4] mt-1">{k.value}</p>
                  <p className="text-[#c9a96e]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Estados: loading / error ── */}
            {reviewsQuery.isLoading ? (
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando reseñas…</p>
              </div>
            ) : reviewsQuery.isError ? (
              <div role="alert" className="bg-[#181310] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <p className="font-serif text-[#f0ebe4] text-lg">No se pudieron cargar las reseñas</p>
                <p className="text-[#8a7d6e] text-xs mt-1 font-mono">{(reviewsQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                <button onClick={() => void reviewsQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#c9a96e] text-[#0d0b0a] text-xs font-semibold rounded-lg hover:bg-[#d4b87e] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : reviewItems.length === 0 ? (
              <div className="bg-[#181310] border border-[#2e2518] rounded-2xl py-14 text-center px-6">
                <Star size={28} className="mx-auto text-[#2e2518] mb-3" />
                <p className="font-serif text-[#8a7d6e] text-lg">
                  {reviewFilter === 'pending' ? 'Sin reseñas pendientes' : 'Sin reseñas publicadas'}
                </p>
                <p className="text-[#4a4238] text-xs mt-1">
                  {reviewFilter === 'pending'
                    ? 'Las reseñas del formulario público aparecerán aquí para moderar.'
                    : 'Aprueba una reseña pendiente para verla aquí y en el sitio.'}
                </p>
                <button onClick={() => switchReviewFilter(reviewFilter === 'pending' ? 'published' : 'pending')}
                  className="mt-4 px-4 py-2 border border-[#2e2518] text-[#8a7d6e] text-xs rounded-lg hover:border-[#8a7d6e] transition-colors">
                  Ver {reviewFilter === 'pending' ? 'publicadas' : 'pendientes'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {reviewItems.map(p => (
                  <div key={p.id} className="relative rounded-2xl border border-[#2e2518] bg-[#181310] p-5 overflow-hidden transition-all hover:border-[#c9a96e]/40">
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }} />
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border border-[#c9a96e]/40 text-[#e8d4a8]"
                        style={{ background: 'linear-gradient(135deg,#2a2013,#14100a)' }}>
                        {(p.author ?? p.title ?? '?')[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f0ebe4] text-sm font-medium truncate">{p.author ?? p.title ?? 'Anónima'}</p>
                        <div className="flex items-center gap-0.5 mt-1" aria-label={`Calificación ${p.rating ?? 0} de 5`}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={12} className={(p.rating ?? 0) >= n ? 'fill-[#c9a96e] text-[#c9a96e]' : 'text-[#4a4238]'} />
                          ))}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 ${reviewFilter === 'pending' ? 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/30' : 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25'}`}>
                        {reviewFilter === 'pending' ? 'Pendiente' : 'Publicada'}
                      </span>
                    </div>
                    <p className="text-[#8a7d6e] text-sm leading-relaxed line-clamp-4 min-h-[3.5rem]">{p.excerpt ?? '—'}</p>
                    {p.design_name && (
                      <p className="text-[#c9a96e]/80 text-xs mt-2 font-mono truncate">Diseño: {p.design_name}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Can code="blog.update">
                        {reviewFilter === 'pending' ? (
                          <button onClick={() => publishMut.mutate({ id: p.id, published: true })} disabled={publishMut.isPending}
                            className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#8aab8a]/15 border border-[#8aab8a]/30 text-[#8aab8a] hover:bg-[#8aab8a]/25 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
                            <Check size={13} /> Aprobar
                          </button>
                        ) : (
                          <button onClick={() => publishMut.mutate({ id: p.id, published: false })} disabled={publishMut.isPending}
                            className="flex-1 py-2 text-xs rounded-xl border border-[#2e2518] text-[#8a7d6e] hover:text-[#e8d4a8] hover:border-[#c9a96e]/40 disabled:opacity-50 transition-all">
                            Ocultar
                          </button>
                        )}
                      </Can>
                      <Can code="blog.update">
                        <button onClick={() => openEditReview(p)} title="Editar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#8a7d6e] hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 hover:border-[#c9a96e]/30 transition-all">
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can code="blog.delete">
                        <button onClick={() => setDeleteReviewModal({ open: true, id: p.id, name: p.author ?? p.title ?? `Reseña #${p.id}` })} title="Eliminar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#4a4238] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={reviewPage} total={reviewTotalPages} onChange={goReviewPage} count={reviewTotal} pageSize={REVIEW_PAGE_SIZE} />
          </div>
        )}
      </main>

      {/* ── Modals ── */}

      {/* Delete design */}
      <ConfirmDeleteModal
        open={deleteDesignModal.open}
        onClose={() => { setDeleteDesignModal({ open: false, id: null }); setDeleteDesignError(''); }}
        title="Eliminar diseño"
        description="¿Segura que deseas eliminar este diseño? Esta acción no se puede deshacer."
        consequence="Si tiene citas asociadas, primero reasígnalas o elimínalas."
        error={deleteDesignError}
        onConfirm={confirmDeleteDesignOnline}
        pending={deleteDesignMut.isPending}
      />

      {/* Edit design */}
      <EditModalShell
        open={editDesignId !== null}
        onClose={() => setEditDesignId(null)}
        title="Editar diseño"
        eyebrow="Catálogo · Diseño"
        error={editDesignError}
        onSave={handleSaveDesign}
        pending={updateDesignMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={editDesign.name} onChange={e => setEditDesign(d => ({ ...d, name: e.target.value }))}
              placeholder="Ej. Botanical Nude" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Precio (₡) *</label>
              <input type="number" value={editDesign.price} onChange={e => setEditDesign(d => ({ ...d, price: e.target.value }))}
                placeholder="3500" className={inputCls} />
            </div>
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Duración (min)</label>
              <input type="number" value={editDesign.duration} onChange={e => setEditDesign(d => ({ ...d, duration: e.target.value }))}
                placeholder="90" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Imagen (URL)</label>
            <input value={editDesign.image} onChange={e => setEditDesign(d => ({ ...d, image: e.target.value }))}
              placeholder="https://…" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
            <input value={editDesign.description} onChange={e => setEditDesign(d => ({ ...d, description: e.target.value }))}
              placeholder="Detalle del diseño…" className={inputCls} />
          </div>
          {editDesignQuery.isLoading && (
            <p className="text-[#8a7d6e] text-xs font-mono animate-pulse">Cargando datos…</p>
          )}
      </EditModalShell>

      {/* Delete user */}
      <ConfirmDeleteModal
        open={deleteUserModal.open}
        onClose={() => setDeleteUserModal({ open: false, id: null })}
        title="Eliminar usuario"
        description="¿Eliminar este usuario? Perderá acceso inmediatamente."
        onConfirm={confirmDeleteUser}
      />

      {/* Add user */}
      <EditModalShell
        open={addUserModal}
        onClose={() => setAddUserModal(false)}
        title="Nuevo usuario"
        eyebrow="Equipo · Nuevo"
        error={createUserMut.isError && !isOffline(createUserMut.error) ? (createUserMut.error as Error).message : null}
        onSave={handleAddUser}
        saveLabel={onlineUsers && createUserMut.isPending ? 'Creando…' : 'Crear usuario'}
        pending={onlineUsers && createUserMut.isPending}
      >
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
              {(onlineRbac && serverRolesQuery.data ? serverRolesQuery.data.map(r => ({ id: String(r.id), name: r.name })) : ROLES).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Contraseña inicial</label>
            <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
              placeholder={onlineUsers ? 'Mínimo 8 caracteres (requerida por el servidor)' : 'Solo para el servidor (opcional en local)'} className={inputCls} />
          </div>
      </EditModalShell>

      {/* Add design */}
      <EditModalShell
        open={addDesignModal}
        onClose={() => setAddDesignModal(false)}
        title="Agregar diseño"
        eyebrow="Catálogo · Nuevo"
        onSave={handleAddDesignOnline}
        saveLabel="Guardar diseño"
        pending={createDesignMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre del diseño</label>
            <input value={newDesign.name} onChange={e => setNewDesign(d => ({ ...d, name: e.target.value }))}
              placeholder="Ej. Botanical Nude" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría</label>
            <select value={newDesign.category} onChange={e => setNewDesign(d => ({ ...d, category: e.target.value }))}
              className={inputCls}>
              {effCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Precio (₡)</label>
              <input type="number" value={newDesign.price} onChange={e => setNewDesign(d => ({ ...d, price: e.target.value }))}
                placeholder="15000" className={inputCls} />
            </div>
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Duración (min)</label>
              <input type="number" value={newDesign.duration} onChange={e => setNewDesign(d => ({ ...d, duration: e.target.value }))}
                placeholder="90" className={inputCls} />
            </div>
          </div>
      </EditModalShell>

      {/* Add category */}
      <EditModalShell
        open={addCategoryModal}
        onClose={() => { setAddCategoryModal(false); setCatDeleteError(''); }}
        title="Nueva categoría"
        eyebrow="Catálogo · Nueva"
        onSave={handleAddCategoryOnline}
        saveLabel="Crear categoría"
        pending={createCatMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre</label>
            <input value={newCategory.name} onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Pedicure Spa" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(Object.keys(CATEGORY_ICONS) as Array<keyof typeof CATEGORY_ICONS>).map(key => (
                  <button key={key} type="button" title={key} onClick={() => setNewCategory(c => ({ ...c, icon: key }))}
                    className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${newCategory.icon === key ? 'border-[#c9a96e] bg-[#c9a96e]/15 text-[#e8d4a8]' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}>
                    <CategoryIcon name={key} size={15} />
                  </button>
                ))}
              </div>
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
      </EditModalShell>

      {/* Delete category */}
      <ConfirmDeleteModal
        open={deleteCategoryModal.open}
        onClose={() => { setDeleteCategoryModal({ open: false, id: null }); setCatDeleteError(''); }}
        title="Eliminar categoría"
        description="¿Eliminar esta categoría? Solo es posible si no tiene diseños asignados."
        error={catDeleteError}
        onConfirm={confirmDeleteCategoryOnline}
        pending={deleteCatMut.isPending}
      />

      {/* Edit category */}
      <EditModalShell
        open={editCatSlug !== null}
        onClose={() => setEditCatSlug(null)}
        title="Editar categoría"
        eyebrow="Catálogo · Categoría"
        error={editCatError}
        onSave={handleSaveCategory}
        pending={updateCatMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={editCat.name} onChange={e => setEditCat(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Pedicure Spa" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(Object.keys(CATEGORY_ICONS) as Array<keyof typeof CATEGORY_ICONS>).map(key => (
                  <button key={key} type="button" title={key} onClick={() => setEditCat(c => ({ ...c, icon: key }))}
                    className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${editCat.icon === key ? 'border-[#c9a96e] bg-[#c9a96e]/15 text-[#e8d4a8]' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e]/50 hover:text-[#e8d4a8]'}`}>
                    <CategoryIcon name={key} size={15} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={editCat.color} onChange={e => setEditCat(c => ({ ...c, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#2e2518]" />
                <input value={editCat.color} onChange={e => setEditCat(c => ({ ...c, color: e.target.value }))}
                  placeholder="#c9a96e" className={inputCls} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
            <input value={editCat.description} onChange={e => setEditCat(c => ({ ...c, description: e.target.value }))}
              placeholder="Tratamiento completo…" className={inputCls} />
          </div>
      </EditModalShell>

      {/* Add gift card */}
      <EditModalShell
        open={addGcModal}
        onClose={() => setAddGcModal(false)}
        title="Nueva gift card"
        eyebrow="Gift Cards · Nueva"
        onSave={handleAddGc}
        saveLabel={`Crear · ₡${Number(newGc.amount || 0).toLocaleString()}`}
        pending={createGcMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-2">Monto en colones (₡) *</label>
            <input type="number" min={1} value={newGc.amount} onChange={e => setNewGc(g => ({ ...g, amount: e.target.value }))}
              placeholder="Ej. 5000" className={inputCls} />
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
      </EditModalShell>

      {/* Edit gift card */}
      <EditModalShell
        open={editGcCode !== null}
        onClose={() => { setEditGcCode(null); setEditGcError(''); }}
        title="Editar gift card"
        eyebrow={`Gift Cards · ${editGcCode ?? ''}`}
        error={editGcError}
        onSave={handleSaveGc}
        pending={updateGcMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-2">Monto en colones (₡) *</label>
            <input type="number" min={1} value={editGc.amount} onChange={e => setEditGc(g => ({ ...g, amount: e.target.value }))}
              placeholder="Ej. 5000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Comprador *</label>
            <input value={editGc.buyer} onChange={e => setEditGc(g => ({ ...g, buyer: e.target.value }))}
              placeholder="Ej. Ana R." className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Para (destinataria)</label>
            <input value={editGc.recipient} onChange={e => setEditGc(g => ({ ...g, recipient: e.target.value }))}
              placeholder="Ej. Mamá (opcional)" className={inputCls} />
          </div>
          <p className="text-[#4a4238] text-xs">El código nunca cambia; el estado (activa/canjeada) se alterna desde la tarjeta.</p>
          <GcHistory code={onlineGc ? editGcCode : null} />
      </EditModalShell>

      {/* Delete gift card */}
      <ConfirmDeleteModal
        open={deleteGcModal.open}
        onClose={() => setDeleteGcModal({ open: false, code: null })}
        title="Eliminar gift card"
        itemName={deleteGcModal.code ?? undefined}
        description="¿Eliminar esta gift card? Esta acción no se puede deshacer."
        onConfirm={confirmDeleteGc}
      />

      {/* Add appointment */}
      <EditModalShell
        open={addApptModal}
        onClose={() => { setAddApptModal(false); setApptError(''); }}
        title="Nueva cita"
        eyebrow="Agenda · Nueva"
        error={apptError || null}
        onSave={handleAddAppointment}
        saveLabel={createApptMut.isPending ? 'Reservando…' : 'Reservar'}
        pending={createApptMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Clienta *</label>
            <select value={newAppt.client_id} onChange={e => setNewAppt(a => ({ ...a, client_id: e.target.value }))}
              className={inputCls}>
              <option value="">Seleccionar…</option>
              {(allClientsQuery.data?.items ?? []).map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Diseño</label>
            <select value={newAppt.design_id} onChange={e => setNewAppt(a => ({ ...a, design_id: e.target.value }))}
              className={inputCls}>
              <option value="">Servicio general</option>
              {(allDesignsQuery.data?.items ?? []).map(d => <option key={d.id} value={d.id}>{d.name} · ₡{d.price.toLocaleString()}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Fecha *</label>
              <input type="date" value={newAppt.date} onChange={e => setNewAppt(a => ({ ...a, date: e.target.value }))}
                className={`${inputCls} [color-scheme:dark]`} />
            </div>
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Hora *</label>
              <input type="time" value={newAppt.time} onChange={e => setNewAppt(a => ({ ...a, time: e.target.value }))}
                className={`${inputCls} [color-scheme:dark]`} />
            </div>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Notas</label>
            <input value={newAppt.notes} onChange={e => setNewAppt(a => ({ ...a, notes: e.target.value }))}
              placeholder="Alergias, referencias…" className={inputCls} />
          </div>
      </EditModalShell>

      {/* Delete appointment */}
      <ConfirmDeleteModal
        open={deleteApptModal.open}
        onClose={() => setDeleteApptModal({ open: false, id: null })}
        title="Eliminar cita"
        description="¿Eliminar esta cita? Libera el horario para otra reserva."
        onConfirm={confirmDeleteAppointment}
      />

      {/* Add client */}
      <EditModalShell
        open={addClientModal}
        onClose={() => { setAddClientModal(false); setClientError(''); }}
        title="Nueva clienta"
        eyebrow="Clientas · Nueva"
        error={clientError || null}
        onSave={handleAddClient}
        saveLabel={createClientMut.isPending ? 'Guardando…' : 'Registrar'}
        pending={createClientMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={newClient.name} onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Ana López" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Teléfono *</label>
            <input value={newClient.phone} onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))}
              placeholder="+52 55 0000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={newClient.email} onChange={e => setNewClient(c => ({ ...c, email: e.target.value }))}
              placeholder="ana@ejemplo.com (opcional)" className={inputCls} />
          </div>
      </EditModalShell>

      {/* Rewards (lealtad cada 10 visitas) */}
      <Modal open={rewardsFor !== null} onClose={() => { setRewardsFor(null); setPointsFor(null); }} size="sm">
        <div className="relative overflow-hidden rounded-xl -m-6 p-6">
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }} />
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-[#c9a96e]/40"
              style={{ background: 'linear-gradient(135deg, #2a2013, #14100a)', boxShadow: '0 0 20px rgba(201,169,110,0.22)' }}>
              <Crown size={17} className="text-[#e8d4a8]" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.28em] uppercase">Clientas · Lealtad</p>
              <h3 className="font-serif text-xl text-[#f0ebe4] mt-1 leading-tight truncate">
                {effClientsBase.find(c => c.id === rewardsFor)?.name ?? 'Clienta'}
              </h3>
            </div>
          </div>
          <RewardsBody
            clientId={rewardsFor}
            clientName={effClientsBase.find(c => c.id === rewardsFor)?.name ?? ''}
            points={effClientsBase.find(c => c.id === rewardsFor)?.points ?? 0}
            pointsFor={pointsFor}
            setPointsFor={setPointsFor}
            adjustMut={adjustPointsMut}
            online={onlineClients}
          />
        </div>
      </Modal>

      {/* Edit client */}
      <EditModalShell
        open={editClientId !== null}
        onClose={() => setEditClientId(null)}
        title="Editar clienta"
        eyebrow="Clientas · Ficha"
        error={editClientError}
        onSave={handleSaveClient}
        pending={updateClientMut.isPending}
      >
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={editClient.name} onChange={e => setEditClient(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Ana López" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Teléfono *</label>
            <input value={editClient.phone} onChange={e => setEditClient(c => ({ ...c, phone: e.target.value }))}
              placeholder="+52 55 0000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={editClient.email} onChange={e => setEditClient(c => ({ ...c, email: e.target.value }))}
              placeholder="ana@ejemplo.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Notas</label>
            <input value={editClient.notes} onChange={e => setEditClient(c => ({ ...c, notes: e.target.value }))}
              placeholder="Alergias, preferencias…" className={inputCls} />
          </div>
          {editDetailQuery.isLoading && (
            <p className="text-[#8a7d6e] text-xs font-mono animate-pulse">Cargando datos…</p>
          )}
      </EditModalShell>

      {/* Delete client */}
      <ConfirmDeleteModal
        open={deleteClientModal.open}
        onClose={() => { setDeleteClientModal({ open: false, id: null, name: '' }); setDeleteClientError(''); }}
        title="Eliminar clienta"
        itemName={deleteClientModal.name || undefined}
        description="¿Eliminar a esta clienta de la base?"
        consequence="No es posible si tiene citas registradas. Esta acción no se puede deshacer."
        error={deleteClientError}
        onConfirm={confirmDeleteClient}
        pending={deleteClientMut.isPending}
      />

      {/* Edit review */}
      <EditModalShell
        open={editReviewId !== null}
        onClose={() => { setEditReviewId(null); setEditReviewError(''); }}
        title="Editar reseña"
        eyebrow="Reseñas · Moderación"
        error={editReviewError || null}
        onSave={handleSaveReview}
        pending={updatePostMut.isPending}
      >
        <div>
          <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Texto * (mín. 10)</label>
          <textarea value={editReview.text} onChange={e => setEditReview(r => ({ ...r, text: e.target.value }))}
            rows={4} maxLength={2000} placeholder="Texto de la reseña…" className={inputCls} />
        </div>
        <div>
          <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Calificación *</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setEditReview(r => ({ ...r, rating: n }))} aria-label={`${n} estrellas`}>
                <Star size={26} className={n <= editReview.rating ? 'fill-[#c9a96e] text-[#c9a96e]' : 'text-[#4a4238] hover:text-[#8a7d6e]'} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Diseño (opcional)</label>
          <input value={editReview.design_name} onChange={e => setEditReview(r => ({ ...r, design_name: e.target.value }))}
            placeholder="Ej. Botanical Garden" maxLength={150} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Delete review */}
      <ConfirmDeleteModal
        open={deleteReviewModal.open}
        onClose={() => setDeleteReviewModal({ open: false, id: null, name: '' })}
        title="Eliminar reseña"
        itemName={deleteReviewModal.name || undefined}
        description="¿Eliminar esta reseña? Desaparecerá del panel y del sitio."
        consequence="Esta acción no se puede deshacer."
        onConfirm={confirmDeleteReview}
        pending={deletePostMut.isPending}
      />
    </div>
  );
}

// ─── Panel de roles contra el servidor (APIs reales + invalidación) ─────────
import type { BackendPermission, BackendRole } from '../../features/admin/rbac-api';

const ROLE_PALETTE = ['#c9a96e', '#9b8ea8', '#8aab8a', '#d4613a', '#8ab0c8'];

function ServerRolesPanel({ roles, permissions, activeRoleId, onSelect, rolePerms, permsLoading, onGrant, onRevoke, busy }: {
  roles: BackendRole[];
  permissions: BackendPermission[];
  activeRoleId: number | null;
  onSelect: (id: number) => void;
  rolePerms: BackendPermission[];
  permsLoading: boolean;
  onGrant: (roleId: number, permissionId: number) => void;
  onRevoke: (roleId: number, permissionId: number) => void;
  busy: boolean;
}) {
  const active = roles.find(r => r.id === activeRoleId) ?? roles[0];
  const granted = new Set(rolePerms.map(p => p.code.toLowerCase()));
  const groups = new Map<string, BackendPermission[]>();
  for (const p of permissions) {
    const mod = p.code.split('.')[0] ?? 'otros';
    if (!groups.has(mod)) groups.set(mod, []);
    groups.get(mod)?.push(p);
  }
  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest px-1 text-[#8aab8a]">● Servidor · cambios con invalidación inmediata</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((r, i) => {
          const color = ROLE_PALETTE[i % ROLE_PALETTE.length] ?? '#c9a96e';
          const isActive = active?.id === r.id;
          return (
            <button key={r.id} onClick={() => onSelect(r.id)}
              className={`relative text-left rounded-2xl border p-5 overflow-hidden transition-all ${isActive ? 'border-[#c9a96e]/50 shadow-[0_0_28px_rgba(201,169,110,0.10)]' : 'border-[#2e2518] bg-[#181310] hover:border-[#c9a96e]/30'}`}
              style={isActive ? { background: 'linear-gradient(140deg,#1e160c 0%,#14100a 70%)' } : undefined}>
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border"
                  style={{ background: `${color}14`, borderColor: `${color}35`, color }}>
                  <Shield size={15} />
                </div>
                {r.is_system && <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#2a2018] text-[#8a7d6e] border border-[#2e2518]">sistema</span>}
              </div>
              <p className="font-serif text-lg text-[#f0ebe4] leading-tight">{r.name}</p>
              <p className="text-[#8a7d6e] text-xs mt-1">{r.description ?? 'Sin descripción'}</p>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="bg-[#181310] border border-[#2e2518] rounded-2xl p-5 sm:p-6">
          <p className="font-serif text-lg text-[#f0ebe4] mb-1">{active.name} — Permisos</p>
          <p className="text-[#4a4238] text-xs mb-5">Toca un permiso para asignarlo o retirarlo{permsLoading ? ' · cargando…' : ''}.</p>
          {[...groups.entries()].map(([mod, perms]) => (
            <div key={mod} className="mb-4 last:mb-0">
              <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                <Key size={10} /> {mod}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map(p => {
                  const has = granted.has(p.code.toLowerCase());
                  return (
                    <button key={p.id} disabled={busy} onClick={() => has ? onRevoke(active.id, p.id) : onGrant(active.id, p.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs transition-all text-left disabled:opacity-50 ${has ? 'bg-[#8aab8a]/[0.07] border-[#8aab8a]/25 text-[#c8d8c8] hover:border-[#8aab8a]/50' : 'bg-[#0d0b0a]/60 border-[#2e2518]/70 text-[#4a4238] hover:border-[#c9a96e]/40 hover:text-[#8a7d6e]'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${has ? 'bg-[#8aab8a]/20 text-[#8aab8a]' : 'bg-[#2a2018] text-[#4a4238]'}`}>
                        {has ? <Check size={11} /> : <XIcon size={11} />}
                      </span>
                      <span><span className="font-mono">{p.code}</span> · {p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lealtad: progreso 10 visitas + tarjetas + ajuste de puntos ────────────
// ─── Historial de cambios de valor de una gift card (quién/cuándo) ─────────
import type { GiftCardAudit } from '../../features/admin/rbac-api';

const FIELD_LABEL: Record<string, string> = {
  amount: 'Monto',
  buyer: 'Comprador',
  recipient: 'Destinataria',
  used: 'Estado',
};

function GcHistory({ code }: { code: string | null }) {
  const query = useGiftCardHistory(code);
  if (code === null) return null;
  const items: GiftCardAudit[] = query.data ?? [];
  return (
    <div className="rounded-xl border border-[#2e2518] bg-[#0d0b0a]/60 p-3.5">
      <p className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest mb-2.5">Historial de cambios</p>
      {query.isLoading ? (
        <p className="text-[#8a7d6e] text-xs font-mono animate-pulse">Cargando historial…</p>
      ) : items.length === 0 ? (
        <p className="text-[#4a4238] text-xs">Sin cambios registrados todavía.</p>
      ) : (
        <ol className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
          {items.map(h => (
            <li key={h.id} className="flex gap-2.5 text-xs">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c9a96e]/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-[#f0ebe4]">
                  {FIELD_LABEL[h.field] ?? h.field}:{' '}
                  <span className="text-[#8a7d6e] line-through">{h.old_value ?? '—'}</span>{' '}
                  <span className="text-[#c9a96e]">→</span>{' '}
                  <span className="font-mono">{h.new_value ?? '—'}</span>
                </p>
                <p className="text-[#4a4238] text-[11px] font-mono mt-0.5">
                  {h.actor_username ?? 'sistema'} · {new Date(h.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}{' '}
                  {new Date(h.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RewardsBody({ clientId, clientName, points, pointsFor, setPointsFor, adjustMut, online }: {
  clientId: number | null;
  clientName: string;
  points: number;
  pointsFor: { id: number; delta: string } | null;
  setPointsFor: (v: { id: number; delta: string } | null) => void;
  adjustMut: ReturnType<typeof useAdjustClientPoints>;
  online: boolean;
}) {
  const rewards = useClientRewards(online && clientId !== null ? clientId : null);
  if (clientId === null) return null;
  if (!online) {
    return <p className="text-[#8a7d6e] text-sm">Conecta el servidor para ver el progreso de lealtad de {clientName}.</p>;
  }
  const r = rewards.data;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#8a7d6e]">{r ? `${r.visits} visitas · faltan ${r.visits_to_reward}` : 'Cargando progreso…'}</span>
          <span className="font-mono text-[#c9a96e]">{r ? `${r.progress_pct}%` : '—'}</span>
        </div>
        <div className="h-2 bg-[#0d0b0a] border border-[#2e2518]/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#8a5f2e] to-[#e8d4a8] rounded-full transition-all"
            style={{ width: `${r?.progress_pct ?? 0}%` }} />
        </div>
        <p className="text-[#4a4238] text-[11px] mt-1.5">Las gift cards se crean manualmente desde el tab Gift Cards.</p>
      </div>
      {(r?.loyalty_cards.length ?? 0) > 0 && (
        <div>
          <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest mb-2">Tarjetas ganadas</p>
          <div className="flex flex-wrap gap-2">
            {r?.loyalty_cards.map(code => (
              <span key={code} className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#e8d4a8]">{code}</span>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-xl border border-[#2e2518] bg-[#0d0b0a]/60 p-3.5">
        <p className="text-[#8a7d6e] text-xs mb-2">Puntos actuales: <span className="font-mono text-[#e8d4a8]">{points}</span></p>
        {pointsFor?.id === clientId ? (
          <div className="flex gap-2">
            <input type="number" value={pointsFor.delta} onChange={e => setPointsFor({ id: clientId, delta: e.target.value })}
              placeholder="+50 / -20" className="flex-1 bg-[#0d0b0a] border border-[#2e2518] rounded-lg px-3 py-2 text-sm text-[#f0ebe4] outline-none focus:border-[#c9a96e]/60" />
            <button
              onClick={() => {
                const delta = Number(pointsFor.delta);
                if (!delta) return;
                adjustMut.mutate(
                  { id: clientId, delta, reason: 'Ajuste manual admin' },
                  { onSuccess: () => setPointsFor(null) },
                );
              }}
              disabled={adjustMut.isPending}
              className="px-4 py-2 bg-[#c9a96e] text-[#0d0b0a] text-xs font-semibold rounded-lg hover:bg-[#d4b87e] disabled:opacity-50 transition-colors">
              Aplicar
            </button>
          </div>
        ) : (
          <Can code="clientas.update">
            <button onClick={() => setPointsFor({ id: clientId, delta: '' })}
              className="text-xs text-[#c9a96e] hover:underline">Ajustar puntos manualmente</button>
          </Can>
        )}
      </div>
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
