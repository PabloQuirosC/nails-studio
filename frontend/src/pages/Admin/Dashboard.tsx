import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  BarChart2, Calendar, Users, Package, Gift,
  Bell, LogOut, Plus, Trash2, Edit3, ChevronDown,
  ChevronLeft, ChevronRight, Shield, Check, X as XIcon,
  Search, UserPlus, Key, Clock, ArrowRight, Sparkles,
  Phone, MessageCircle, Crown, Copy, Star, BookOpen, Heart, Mail, Share2,
  User, Menu,
} from 'lucide-react';
import { DESIGNS, CATEGORIES } from '../../data';
import { useAuthStore } from '../../shared/auth/auth-store';
import { Can } from '../../shared/auth/guards';
import {
  isOffline,
  useCreateGiftCard,
  useCreateRole,
  useCreateUser,
  useDeleteGiftCard,
  useGiftCardHistory,
  useDeleteRole,
  useDeleteUser,
  useRolePermissions,
  useServerGiftCards,
  useServerPermissions,
  useServerRoles,
  useServerUsers,
  useSetGiftCardUsed,
  useUpdateGiftCard,
  useUpdateRole,
  useUpdateUser,
  useToggleUserStatus,
  type BackendUser,
} from '../../features/admin/rbac-api';
import { apiFetch, ApiError } from '../../shared/auth/api-client';
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
  useClientAppointments,
  useServerCategories,
  useServerClients,
  useServerDesigns,
  useSetAppointmentStatus,
  useAdminPosts,
  useCreatePost,
  usePublishPost,
  useUpdatePost,
  useDeletePost,
  useBlogCategories,
  useCreateBlogCategory,
  useUpdateBlogCategory,
  useDeleteBlogCategory,
  type Appointment,
  type Design,
} from '../../features/admin/studio-api';
import {
  useAdminMessages,
  useMarkMessageRead,
  useDeleteMessage,
  useAdminContactInfo,
  useUpdateContactInfo,
  useContactSocials,
  useCreateSocial,
  useUpdateSocial,
  useDeleteSocial,
  SOCIAL_ICONS,
} from '../../features/contact/contact-api';
import { useReferralInfo, useUpdateReferralInfo } from '../../features/contact/referral-api';
import { SocialIcon } from '../../features/contact/social-icons';
import { resolveImageUrl } from '../../shared/images';
import { ConfirmDeleteModal, EditModalShell, Modal } from '../../components/ui/Modal';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { CategoryIcon, CATEGORY_ICONS } from '../../shared/category-icons';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Resumen',   icon: BarChart2 },
  { id: 'catalog',   label: 'Catálogo',  icon: Package   },
  { id: 'monthly',   label: 'Diseños del mes', icon: Sparkles },
  { id: 'agenda',    label: 'Agenda',    icon: Calendar  },
  { id: 'clients',   label: 'Clientas',  icon: Users     },
  { id: 'users',     label: 'Usuarios',  icon: Shield    },
  { id: 'giftcards', label: 'Gift Cards',icon: Gift      },
  { id: 'referidos', label: 'Referidos', icon: Share2    },
  { id: 'reviews',   label: 'Reseñas',   icon: Star      },
  { id: 'blog',      label: 'Blog',      icon: BookOpen  },
  { id: 'nosotros',  label: 'Nosotros',  icon: Heart     },
  { id: 'contacto',  label: 'Contacto',  icon: Mail      },
];

/** Módulo backend que da acceso a cada tab. Overview lo ve cualquiera con sesión válida. */
const TAB_MODULE: Record<string, string[]> = {
  overview: [],
  catalog: ['catalogo.'],
  monthly: ['catalogo.'],
  agenda: ['reservas.'],
  clients: ['clientas.'],
  users: ['usuarios.', 'roles.', 'permisos.'],
  giftcards: ['giftcards.'],
  referidos: ['referidos.'],
  reviews: ['blog.'],
  blog: ['blog.'],
  nosotros: ['blog.'],
  contacto: ['contacto.'],
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_APPOINTMENTS = [
  { id: 1, client: 'Ana López',    service: 'Botanical Garden',      time: '10:00', color: '#f2d29b' },
  { id: 2, client: 'Laura Martínez',service: 'Chrome Espejo Dorado', time: '11:30', color: '#9b8ea8' },
  { id: 3, client: 'Sofía Ruiz',   service: 'Encapsulado Flores',    time: '14:00', color: '#8aab8a' },
  { id: 4, client: 'Carmen Villa', service: 'Ombre Terracota',       time: '16:00', color: '#d4613a' },
];

const MOCK_CLIENTS = [
  { id: 1, name: 'Valentina Ríos',  phone: '+52 55 1234', visits: 12, points: 240, lastVisit: '10 Sep 2026' },
  { id: 2, name: 'Camila Serrano',  phone: '+52 55 5678', visits: 8,  points: 160, lastVisit: '5 Sep 2026'  },
  { id: 3, name: 'María José López',phone: '+52 55 9012', visits: 5,  points: 100, lastVisit: '1 Sep 2026'  },
  { id: 4, name: 'Andrea Fuentes', phone: '+52 55 3456', visits: 3,  points: 60,  lastVisit: '28 Ago 2026' },
];

const MOCK_GIFTCARDS = [
  { code: 'NS-GC-A1B2', amount: 500,  used: false, buyer: 'Ana R.'   },
  { code: 'NS-GC-C3D4', amount: 1000, used: true,  buyer: 'Laura M.' },
  { code: 'NS-GC-E5F6', amount: 300,  used: false, buyer: 'Sofía V.' },
];

// ─── Permisos y roles: solo datos del servidor (sin mocks) ───────────────────
// Sin conexión estos tabs muestran aviso + Reintentar en vez de datos inventados.

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
  /** Marcado del mes (Admin → Catálogo ★). Local cuando no hay servidor. */
  monthly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();

  // ── State
  const [tab,         setTabState]         = useState(() => {
    // El tab vive en la URL (?tab=) para sobrevivir al refresh.
    const fromUrl = new URLSearchParams(window.location.search).get('tab') ?? '';
    return TABS.some(t => t.id === fromUrl) ? fromUrl : 'overview';
  });
  const [, setSearchParams] = useSearchParams();
  const goTab = (id: string) => {
    const valid = TABS.some(t => t.id === id) ? id : 'overview';
    setTabState(valid);
    setSearchParams(valid === 'overview' ? {} : { tab: valid }, { replace: true });
  };
  const [designs,     setDesigns]     = useState<MockDesign[]>(DESIGNS);
  const [categories,  setCategories]  = useState(CATEGORIES);
  const [catalogSubtab, setCatalogSubtab] = useState<'designs' | 'categories'>('designs');
  const [searchCat,   setSearchCat]   = useState('');
  const [searchDesign,setSearchDesign]= useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchUser,  setSearchUser]  = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [usersSubtab, setUsersSubtab] = useState<'users' | 'roles' | 'permissions'>('users');
  // Catálogo de permisos: 4 por página (con encabezado de módulo).
  const PERM_PAGE_SIZE = 4;
  const [permPage, setPermPage] = useState(1);
  const [searchClient,setSearchClient]= useState('');
  const [clientTier,  setClientTier]  = useState<'all' | 'vip' | 'oro' | 'nueva'>('all');
  const [mobileUserOpen, setMobileUserOpen] = useState(false);

  // Modals
  const [deleteDesignModal, setDeleteDesignModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleteUserModal,   setDeleteUserModal]   = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleteUserError, setDeleteUserError] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [addUserModal,      setAddUserModal]       = useState(false);
  const [addDesignModal,    setAddDesignModal]     = useState(false);
  const [addCategoryModal,  setAddCategoryModal]   = useState(false);
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [catDeleteError, setCatDeleteError] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'sparkles', color: '#f2d29b', description: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'artist', password: '' });
  const [newDesign, setNewDesign] = useState({ name: '', category: 'mano-alzada', price: '', duration: '' });
  const [giftCards, setGiftCards] = useState(MOCK_GIFTCARDS.map(g => ({ ...g, recipient: '', created: 'Sep 2026' })));
  const [gcFilter, setGcFilter] = useState<'all' | 'active' | 'used'>('all');
  const [searchGc, setSearchGc] = useState('');
  // Referidos: gift cards de lealtad (source=loyalty), mantenimiento separado.
  const [refFilter, setRefFilter] = useState<'all' | 'active' | 'used'>('all');
  const [searchRef, setSearchRef] = useState('');
  // Contenido del programa (lo que ve /referidos): se inicializa con el servidor.
  const refInfoQuery = useReferralInfo();
  const updateRefMut = useUpdateReferralInfo();
  const [refTitle, setRefTitle] = useState('');
  const [refSubtitle, setRefSubtitle] = useState('');
  const [refSteps, setRefSteps] = useState<string[]>(['', '', '']);
  const [refInit, setRefInit] = useState(false);
  const [refError, setRefError] = useState('');
  useEffect(() => {
    const d = refInfoQuery.data;
    if (d && !refInit) {
      setRefTitle(d.title);
      setRefSubtitle(d.subtitle);
      setRefSteps([...d.steps, '', '', ''].slice(0, Math.max(3, Math.min(8, d.steps.length))));
      setRefInit(true);
    }
  }, [refInfoQuery.data, refInit]);
  const handleSaveRefInfo = () => {
    const steps = refSteps.map(s => s.trim()).filter(Boolean);
    if (refTitle.trim().length < 2) { setRefError('El título necesita mínimo 2 caracteres.'); return; }
    if (steps.length === 0) { setRefError('Agrega al menos un paso.'); return; }
    setRefError('');
    updateRefMut.mutate(
      { title: refTitle.trim(), subtitle: refSubtitle.trim(), steps: steps.map(s => s.slice(0, 300)) },
      { onError: (err) => setRefError(err instanceof Error ? err.message : 'No se pudo guardar') },
    );
  };
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const menu = document.querySelector('[role="menu"]');
      const trigger = document.querySelector('[aria-label="Menú de usuario"]');
      if (menu && !menu.contains(target) && trigger && !trigger.contains(target)) {
        setMobileUserOpen(false);
      }
    }
    if (mobileUserOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileUserOpen]);

  // Usuario real de la sesión para el sidebar (nada hardcodeado).
  const sessionUser = useAuthStore(s => s.user);
  const verified = useAuthStore(s => s.verified);
  const sessionName = sessionUser?.full_name?.trim() || sessionUser?.username || 'Staff';
  const sessionRole = sessionUser?.roles?.[0] ?? '';
  const sessionInitial = (sessionName.trim()[0] ?? '?').toUpperCase();

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    if (mobileDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [tab]);

  // Tabs visibles según permisos VERIFICADOS por servidor. Caché no autoriza.
  const canSeeTab = (id: string): boolean => {
    if (!verified) return id === 'overview';
    if (id === 'overview') return true;
    const prefixes = TAB_MODULE[id] ?? [];
    if (prefixes.length === 0) return true;
    const perms = sessionUser?.permissions ?? [];
    return perms.some((p) => prefixes.some((pre) => p.toLowerCase().startsWith(pre)));
  };
  const visibleTabs = TABS.filter((t) => canSeeTab(t.id));

  useEffect(() => {
    // Si el tab actual no está permitido (ej. ?tab=users sin permiso), vuelve a overview.
    if (!canSeeTab(tab)) {
      setTabState('overview');
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.permissions?.join(','), verified, tab]);

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
    setNewCategory({ name: '', icon: 'sparkles', color: '#f2d29b', description: '' });
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
  const serverGcQuery = useServerGiftCards('all', searchGc, 'manual');
  const onlineGc = serverGcQuery.data !== undefined;
  const serverGcItems = (serverGcQuery.data?.items ?? []).map(g => ({
    ...g, recipient: g.recipient ?? '', created: 'Servidor',
  }));
  // Tab Referidos: solo lealtad; sin mocks (aviso + Reintentar si no hay servidor).
  const serverRefQuery = useServerGiftCards(refFilter, searchRef, 'loyalty');
  const onlineRef = serverRefQuery.data !== undefined;
  const refItems = (serverRefQuery.data?.items ?? []).map(g => ({
    ...g, recipient: g.recipient ?? '', created: 'Servidor',
  }));
  const refTotal = serverRefQuery.data?.total ?? 0;
  const refActiveValue = refItems.filter(g => !g.used).reduce((a, g) => a + g.amount, 0);
  const refUsedValue = refItems.filter(g => g.used).reduce((a, g) => a + g.amount, 0);
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
    const current = gcSource.find(g => g.code === code)
      ?? (onlineRef ? refItems.find(g => g.code === code) : undefined);
    if (current) {
      setGcUsedMut.mutate(
        { code, used: !current.used },
        { onError: (err) => { if (isOffline(err)) setGiftCards(gs => gs.map(g => g.code === code ? { ...g, used: !g.used } : g)); } },
      );
      return;
    }
    if (onlineGc) return;
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

  // ── Blog: artículos propios (tips de uñas, kind=articulo) — crear/editar/publicar/eliminar ──
  const BLOG_PAGE_SIZE = 6;
  const [blogFilter, setBlogFilter] = useState<'published' | 'draft'>('published');
  const [blogSubtab, setBlogSubtab] = useState<'posts' | 'categories'>('posts');
  const [blogPage, setBlogPage] = useState(1);
  const [addBlogOpen, setAddBlogOpen] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', excerpt: '', body: '', category: '', image_url: '', read_minutes: '4', author: '' });
  const [newBlogError, setNewBlogError] = useState('');
  const [editBlogId, setEditBlogId] = useState<number | null>(null);
  const [editBlog, setEditBlog] = useState({ title: '', excerpt: '', body: '', category: '', image_url: '', read_minutes: '4', author: '' });
  const [editBlogError, setEditBlogError] = useState('');
  const [deleteBlogModal, setDeleteBlogModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const blogQuery = useAdminPosts(blogFilter === 'published', blogPage, BLOG_PAGE_SIZE, 'articulo');
  const onlineBlog = blogQuery.data !== undefined;
  const blogItems = (blogQuery.data?.items ?? []).filter(p => p.kind === 'articulo');
  const blogTotal = blogQuery.data?.total ?? blogItems.length;
  const blogTotalPages = Math.max(1, Math.ceil(blogTotal / BLOG_PAGE_SIZE));
  const goBlogPage = (p: number) => setBlogPage(Math.max(1, Math.min(blogTotalPages, p)));
  const switchBlogFilter = (f: 'published' | 'draft') => {
    setBlogFilter(f);
    setBlogPage(1);
  };
  useEffect(() => {
    if (!blogQuery.isLoading && blogItems.length === 0 && blogPage > 1 && blogQuery.data !== undefined) {
      setBlogPage(blogPage - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogQuery.data, blogItems.length, blogPage]);
  const createBlogMut = useCreatePost();

  const handleCreateBlog = () => {
    if (newBlog.title.trim().length < 2) {
      setNewBlogError('El título necesita mínimo 2 caracteres.');
      return;
    }
    setNewBlogError('');
    createBlogMut.mutate(
      {
        title: newBlog.title.trim(),
        kind: 'articulo',
        excerpt: newBlog.excerpt.trim() || null,
        body: newBlog.body.trim() || null,
        category: newBlog.category.trim() || 'General',
        image_url: newBlog.image_url.trim() || null,
        read_minutes: Math.max(1, Math.min(120, Number(newBlog.read_minutes) || 4)),
        author: newBlog.author.trim() || null,
        published: blogFilter === 'published',
      },
      {
        onSuccess: () => {
          setNewBlog({ title: '', excerpt: '', body: '', category: '', image_url: '', read_minutes: '4', author: '' });
          setAddBlogOpen(false);
        },
        onError: (err) => setNewBlogError((err as Error).message),
      },
    );
  };

  const openEditBlog = (p: { id: number; title: string; excerpt: string | null; body: string | null; category: string; image_url: string | null; read_minutes: number; author: string | null }) => {
    setEditBlogError('');
    setEditBlog({
      title: p.title,
      excerpt: p.excerpt ?? '',
      body: p.body ?? '',
      category: p.category,
      image_url: p.image_url ?? '',
      read_minutes: String(p.read_minutes ?? 4),
      author: p.author ?? '',
    });
    setEditBlogId(p.id);
  };

  const handleSaveBlog = () => {
    if (editBlogId === null) return;
    if (editBlog.title.trim().length < 2) {
      setEditBlogError('El título necesita mínimo 2 caracteres.');
      return;
    }
    setEditBlogError('');
    updatePostMut.mutate(
      {
        id: editBlogId,
        patch: {
          title: editBlog.title.trim(),
          excerpt: editBlog.excerpt.trim() || null,
          body: editBlog.body.trim() || null,
          category: editBlog.category.trim() || 'General',
          image_url: editBlog.image_url.trim() || null,
          read_minutes: Math.max(1, Math.min(120, Number(editBlog.read_minutes) || 4)),
          author: editBlog.author.trim() || null,
        },
      },
      {
        onSuccess: () => setEditBlogId(null),
        onError: (err) => setEditBlogError((err as Error).message),
      },
    );
  };

  const confirmDeleteBlog = () => {
    if (deleteBlogModal.id === null) return;
    deletePostMut.mutate(deleteBlogModal.id, {
      onSuccess: () => setDeleteBlogModal({ open: false, id: null, name: '' }),
    });
  };

  // ── Categorías del blog: crear/renombrar/eliminar + asociar por nombre ──
  const blogCatsQuery = useBlogCategories();
  const blogCats = blogCatsQuery.data ?? [];
  const createBlogCatMut = useCreateBlogCategory();
  const updateBlogCatMut = useUpdateBlogCategory();
  const deleteBlogCatMut = useDeleteBlogCategory();
  const [addBlogCatOpen, setAddBlogCatOpen] = useState(false);
  const [newBlogCat, setNewBlogCat] = useState('');
  const [newBlogCatError, setNewBlogCatError] = useState('');
  const [editBlogCatId, setEditBlogCatId] = useState<number | null>(null);
  const [editBlogCat, setEditBlogCat] = useState('');
  const [editBlogCatError, setEditBlogCatError] = useState('');
  const [deleteBlogCatModal, setDeleteBlogCatModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const [deleteBlogCatError, setDeleteBlogCatError] = useState('');

  const handleCreateBlogCat = () => {
    if (newBlogCat.trim().length < 2) {
      setNewBlogCatError('El nombre necesita mínimo 2 caracteres.');
      return;
    }
    setNewBlogCatError('');
    createBlogCatMut.mutate(
      { name: newBlogCat.trim() },
      {
        onSuccess: (cat) => {
          setNewBlogCat('');
          setAddBlogCatOpen(false);
          setNewBlog(b => ({ ...b, category: cat.name }));
        },
        onError: (err) => setNewBlogCatError((err as Error).message),
      },
    );
  };

  const openEditBlogCat = (c: { id: number; name: string }) => {
    setEditBlogCatError('');
    setEditBlogCat(c.name);
    setEditBlogCatId(c.id);
  };

  const handleSaveBlogCat = () => {
    if (editBlogCatId === null) return;
    if (editBlogCat.trim().length < 2) {
      setEditBlogCatError('El nombre necesita mínimo 2 caracteres.');
      return;
    }
    setEditBlogCatError('');
    updateBlogCatMut.mutate(
      { id: editBlogCatId, name: editBlogCat.trim() },
      {
        onSuccess: () => setEditBlogCatId(null),
        onError: (err) => setEditBlogCatError((err as Error).message),
      },
    );
  };

  const confirmDeleteBlogCat = () => {
    if (deleteBlogCatModal.id === null) return;
    setDeleteBlogCatError('');
    deleteBlogCatMut.mutate(deleteBlogCatModal.id, {
      onSuccess: () => setDeleteBlogCatModal({ open: false, id: null, name: '' }),
      onError: (err) => setDeleteBlogCatError((err as Error).message),
    });
  };

  // ── Nosotros: secciones editables (historia/valores/equipo, kind=nosotros) ──
  // Reutiliza permisos blog.* del backend (mismo router /posts).
  const NOS_PAGE_SIZE = 6;
  const [nosFilter, setNosFilter] = useState<'published' | 'draft'>('published');
  const [nosPage, setNosPage] = useState(1);
  const [addNosOpen, setAddNosOpen] = useState(false);
  const [newNos, setNewNos] = useState({ title: '', excerpt: '', body: '', category: 'Historia', image_url: '', author: '' });
  const [newNosError, setNewNosError] = useState('');
  const [editNosId, setEditNosId] = useState<number | null>(null);
  const [editNos, setEditNos] = useState({ title: '', excerpt: '', body: '', category: '', image_url: '', author: '' });
  const [editNosError, setEditNosError] = useState('');
  const [deleteNosModal, setDeleteNosModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const nosQuery = useAdminPosts(nosFilter === 'published', nosPage, NOS_PAGE_SIZE, 'nosotros');
  const onlineNos = nosQuery.data !== undefined;
  const nosItems = (nosQuery.data?.items ?? []).filter(p => p.kind === 'nosotros');
  const nosTotal = nosQuery.data?.total ?? nosItems.length;
  const nosTotalPages = Math.max(1, Math.ceil(nosTotal / NOS_PAGE_SIZE));
  const goNosPage = (p: number) => setNosPage(Math.max(1, Math.min(nosTotalPages, p)));
  const switchNosFilter = (f: 'published' | 'draft') => {
    setNosFilter(f);
    setNosPage(1);
  };
  useEffect(() => {
    if (!nosQuery.isLoading && nosItems.length === 0 && nosPage > 1 && nosQuery.data !== undefined) {
      setNosPage(nosPage - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nosQuery.data, nosItems.length, nosPage]);

  const handleCreateNos = () => {
    if (newNos.title.trim().length < 2) {
      setNewNosError('El título necesita mínimo 2 caracteres.');
      return;
    }
    setNewNosError('');
    createBlogMut.mutate(
      {
        title: newNos.title.trim(),
        kind: 'nosotros',
        excerpt: newNos.excerpt.trim() || null,
        body: newNos.body.trim() || null,
        category: newNos.category.trim() || 'Historia',
        image_url: newNos.image_url.trim() || null,
        author: newNos.author.trim() || null,
        published: nosFilter === 'published',
      },
      {
        onSuccess: () => {
          setNewNos({ title: '', excerpt: '', body: '', category: 'Historia', image_url: '', author: '' });
          setAddNosOpen(false);
        },
        onError: (err) => setNewNosError((err as Error).message),
      },
    );
  };

  const openEditNos = (p: { id: number; title: string; excerpt: string | null; body: string | null; category: string; image_url: string | null; author: string | null }) => {
    setEditNosError('');
    setEditNos({
      title: p.title,
      excerpt: p.excerpt ?? '',
      body: p.body ?? '',
      category: p.category,
      image_url: p.image_url ?? '',
      author: p.author ?? '',
    });
    setEditNosId(p.id);
  };

  const handleSaveNos = () => {
    if (editNosId === null) return;
    if (editNos.title.trim().length < 2) {
      setEditNosError('El título necesita mínimo 2 caracteres.');
      return;
    }
    setEditNosError('');
    updatePostMut.mutate(
      {
        id: editNosId,
        patch: {
          title: editNos.title.trim(),
          excerpt: editNos.excerpt.trim() || null,
          body: editNos.body.trim() || null,
          category: editNos.category.trim() || 'Historia',
          image_url: editNos.image_url.trim() || null,
          author: editNos.author.trim() || null,
        },
      },
      {
        onSuccess: () => setEditNosId(null),
        onError: (err) => setEditNosError((err as Error).message),
      },
    );
  };

  const confirmDeleteNos = () => {
    if (deleteNosModal.id === null) return;
    deletePostMut.mutate(deleteNosModal.id, {
      onSuccess: () => setDeleteNosModal({ open: false, id: null, name: '' }),
    });
  };

  // ── Contacto: buzón (mensajes que llegan del form público) + datos editables ──
  const MSG_PAGE_SIZE = 4;
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread'>('all');
  const [contactSubtab, setContactSubtab] = useState<'messages' | 'socials' | 'info'>('messages');
  const [msgPage, setMsgPage] = useState(1);
  const [deleteMsgModal, setDeleteMsgModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });
  const msgsQuery = useAdminMessages(msgFilter === 'unread', msgPage, MSG_PAGE_SIZE);
  const onlineMsgs = msgsQuery.data !== undefined;
  const msgItems = msgsQuery.data?.items ?? [];
  const msgTotal = msgsQuery.data?.total ?? msgItems.length;
  const msgTotalPages = Math.max(1, Math.ceil(msgTotal / MSG_PAGE_SIZE));
  const goMsgPage = (p: number) => setMsgPage(Math.max(1, Math.min(msgTotalPages, p)));
  const switchMsgFilter = (f: 'all' | 'unread') => {
    setMsgFilter(f);
    setMsgPage(1);
  };
  useEffect(() => {
    if (!msgsQuery.isLoading && msgItems.length === 0 && msgPage > 1 && msgsQuery.data !== undefined) {
      setMsgPage(msgPage - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgsQuery.data, msgItems.length, msgPage]);
  const markMsgMut = useMarkMessageRead();
  const deleteMsgMut = useDeleteMessage();
  const unreadCount = msgItems.filter(m => !m.is_read).length;

  const confirmDeleteMsg = () => {
    if (deleteMsgModal.id === null) return;
    deleteMsgMut.mutate(deleteMsgModal.id, {
      onSuccess: () => setDeleteMsgModal({ open: false, id: null, name: '' }),
    });
  };

  // Datos de contacto (misma página pública).
  const adminInfoQuery = useAdminContactInfo();
  const [infoForm, setInfoForm] = useState({ address: '', schedule: '' });
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSaved, setInfoSaved] = useState(false);
  const updateInfoMut = useUpdateContactInfo();
  useEffect(() => {
    const d = adminInfoQuery.data;
    if (d && !infoLoaded) {
      setInfoForm({ address: d.address, schedule: d.schedule });
      setInfoLoaded(true);
    }
  }, [adminInfoQuery.data, infoLoaded]);

  const handleSaveInfo = () => {
    setInfoError('');
    setInfoSaved(false);
    updateInfoMut.mutate(
      {
        address: infoForm.address.trim() || undefined,
        schedule: infoForm.schedule.trim() || undefined,
      },
      {
        onSuccess: () => setInfoSaved(true),
        onError: (err) => setInfoError((err as Error).message),
      },
    );
  };

  // ── Redes sociales agregables (Facebook, TikTok…) ──
  const socialsQuery = useContactSocials();
  const socialItems = socialsQuery.data ?? [];
  const createSocialMut = useCreateSocial();
  const updateSocialMut = useUpdateSocial();
  const deleteSocialMut = useDeleteSocial();
  const [addSocialOpen, setAddSocialOpen] = useState(false);
  const [newSocial, setNewSocial] = useState({ label: '', url: '', icon: 'facebook' });
  const [newSocialError, setNewSocialError] = useState('');
  const [editSocialId, setEditSocialId] = useState<number | null>(null);
  const [editSocial, setEditSocial] = useState({ label: '', url: '', icon: 'web' });
  const [editSocialError, setEditSocialError] = useState('');
  const [deleteSocialModal, setDeleteSocialModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });

  const handleCreateSocial = () => {
    if (newSocial.label.trim().length < 2) {
      setNewSocialError('El nombre necesita mínimo 2 caracteres (ej. Facebook).');
      return;
    }
    if (!/^https?:\/\/.+\..+/.test(newSocial.url.trim())) {
      setNewSocialError('URL inválida: debe empezar con http(s)://');
      return;
    }
    setNewSocialError('');
    createSocialMut.mutate(
      { label: newSocial.label.trim(), url: newSocial.url.trim(), icon: newSocial.icon },
      {
        onSuccess: () => {
          setNewSocial({ label: '', url: '', icon: 'facebook' });
          setAddSocialOpen(false);
        },
        onError: (err) => setNewSocialError((err as Error).message),
      },
    );
  };

  const openEditSocial = (s: { id: number; label: string; url: string; icon: string }) => {
    setEditSocialError('');
    setEditSocial({ label: s.label, url: s.url, icon: s.icon });
    setEditSocialId(s.id);
  };

  const handleSaveSocial = () => {
    if (editSocialId === null) return;
    if (editSocial.label.trim().length < 2) {
      setEditSocialError('El nombre necesita mínimo 2 caracteres.');
      return;
    }
    if (!/^https?:\/\/.+\..+/.test(editSocial.url.trim())) {
      setEditSocialError('URL inválida: debe empezar con http(s)://');
      return;
    }
    setEditSocialError('');
    updateSocialMut.mutate(
      {
        id: editSocialId,
        patch: { label: editSocial.label.trim(), url: editSocial.url.trim(), icon: editSocial.icon },
      },
      {
        onSuccess: () => setEditSocialId(null),
        onError: (err) => setEditSocialError((err as Error).message),
      },
    );
  };

  const confirmDeleteSocial = () => {
    if (deleteSocialModal.id === null) return;
    deleteSocialMut.mutate(deleteSocialModal.id, {
      onSuccess: () => setDeleteSocialModal({ open: false, id: null, name: '' }),
    });
  };
  const updateGcMut = useUpdateGiftCard();

  // ── Crear rol + asignar permisos marcados en un solo Guardar ──
  const toggleNewRolePerm = (id: number) =>
    setNewRolePerms(ps => ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]);

  const handleCreateRole = () => {
    if (newRole.name.trim().length < 2) {
      setNewRoleError('El nombre necesita mínimo 2 caracteres.');
      return;
    }
    setNewRoleError('');
    setNewRoleSaving(true);
    createRoleMut.mutate(
      { name: newRole.name.trim(), description: newRole.description.trim() || undefined },
      {
        onSuccess: async (role) => {
          try {
            // Asignación en lote: un POST por permiso marcado, sin spam de loaders.
            for (const pid of newRolePerms) {
              await apiFetch(`/api/v1/roles/${role.id}/permisos`, {
                method: 'POST',
                body: JSON.stringify({ permission_id: pid }),
                block: false,
              });
            }
            setNewRole({ name: '', description: '' });
            setNewRolePerms([]);
            setAddRoleOpen(false);
            setServerRoleId(role.id);
            setUsersSubtab('roles');
            await serverRolesQuery.refetch();
          } catch (err) {
            setNewRoleError((err as Error).message || 'El rol se creó pero falló algún permiso. Revísalo en Roles.');
          } finally {
            setNewRoleSaving(false);
          }
        },
        onError: (err) => {
          setNewRoleError((err as Error).message);
          setNewRoleSaving(false);
        },
      },
    );
  };

  const confirmDeleteRole = () => {
    if (deleteRoleModal.id === null) return;
    deleteRoleMut.mutate(deleteRoleModal.id, {
      onSuccess: () => {
        setDeleteRoleModal({ open: false, id: null, name: '' });
        if (serverRoleId === deleteRoleModal.id) setServerRoleId(null);
      },
    });
  };

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
    role: (u.roles[0] ?? 'sin rol').toLowerCase(),
    active: u.status === 'ACTIVE',
    lastLogin: formatLastLogin(u.last_login),
  });
  // Solo servidor: sin conexión no hay filas inventadas (aviso + Reintentar en la UI).
  const effectiveUsers: AppUser[] = (serverUsersQuery.data?.items ?? []).map(mapBackendUser);
  const userTotalPages = Math.max(1, Math.ceil(serverUserTotal / 6));
  const userRows = effectiveUsers;
  const goUserPage = (p: number) => setUserPage(Math.max(1, Math.min(userTotalPages, p)));

  const createUserMut = useCreateUser();
  const deleteUserMut = useDeleteUser();
  const toggleUserMut = useToggleUserStatus();

  // ── Roles/permisos del servidor (para el tab Roles cuando hay backend) ──
  const serverRolesQuery = useServerRoles();
  const serverPermsQuery = useServerPermissions();
  const onlineRbac = serverRolesQuery.data !== undefined && serverPermsQuery.data !== undefined;
  const [serverRoleId, setServerRoleId] = useState<number | null>(null);
  // Rol activo = seleccionado o el primero (así los permisos cargan desde el inicio, no en 0).
  const fallbackRoleId = serverRoleId ?? serverRolesQuery.data?.[0]?.id ?? null;
  const serverRolePerms = useRolePermissions(onlineRbac ? fallbackRoleId : null);
  const createRoleMut = useCreateRole();
  const deleteRoleMut = useDeleteRole();

  // ── Nuevo rol: nombre + checkboxes de permisos por módulo + todos/ninguno ──
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newRolePerms, setNewRolePerms] = useState<number[]>([]);
  const [newRoleError, setNewRoleError] = useState('');
  const [newRoleSaving, setNewRoleSaving] = useState(false);
  const [deleteRoleModal, setDeleteRoleModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });

  // ── Asignar permisos en modal aparte (checkboxes + todos + guardar) ──
  const [assignRole, setAssignRole] = useState<{ id: number; name: string } | null>(null);
  const [assignChecked, setAssignChecked] = useState<number[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState('');

  const openAssignPerms = (role: { id: number; name: string }) => {
    setAssignError('');
    setAssignRole({ id: role.id, name: role.name });
    // Precarga con lo asignado hoy; si es otro rol, se sincroniza al cargar.
    if (role.id === fallbackRoleId) {
      setAssignChecked((serverRolePerms.data ?? []).map(p => p.id));
    } else {
      setAssignChecked([]);
    }
    setServerRoleId(role.id);
  };

  useEffect(() => {
    if (assignRole && serverRolePerms.data !== undefined && serverRoleId === assignRole.id) {
      setAssignChecked(serverRolePerms.data.map(p => p.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignRole, serverRolePerms.data]);

  const toggleAssignPerm = (id: number) =>
    setAssignChecked(ps => ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]);

  const handleSaveAssign = async () => {
    if (!assignRole) return;
    setAssignError('');
    setAssignSaving(true);
    try {
      const current = new Set((serverRolePerms.data ?? []).map(p => p.id));
      const wanted = new Set(assignChecked);
      for (const pid of wanted) {
        if (!current.has(pid)) {
          await apiFetch(`/api/v1/roles/${assignRole.id}/permisos`, {
            method: 'POST', body: JSON.stringify({ permission_id: pid }), block: false,
          });
        }
      }
      for (const pid of current) {
        if (!wanted.has(pid)) {
          await apiFetch(`/api/v1/roles/${assignRole.id}/permisos/${pid}`, { method: 'DELETE', block: false });
        }
      }
      setAssignRole(null);
      await serverRolePerms.refetch();
    } catch (err) {
      setAssignError((err as Error).message || 'No se pudieron guardar los permisos.');
    } finally {
      setAssignSaving(false);
    }
  };

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
    deleteUserMut.mutate(deleteUserModal.id, {
      onSuccess: () => setDeleteUserModal({ open: false, id: null }),
      onError: (err) => {
        setDeleteUserError((err as Error).message || 'No se pudo eliminar. Solo ADMIN puede eliminar usuarios.');
      },
    });
  };

  // ── Editar usuario (nombre, email, rol, estado) ──
  const updateUserMut = useUpdateUser();
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState({ name: '', email: '', role: '', active: true });
  const [editUserError, setEditUserError] = useState('');
  const [editUserSaving, setEditUserSaving] = useState(false);

  const openEditUser = (u: AppUser) => {
    setEditUserError('');
    setEditUser({ name: u.name, email: u.email, role: u.role, active: u.active });
    setEditUserId(u.id);
  };

  const handleSaveUser = () => {
    if (editUserId === null) return;
    if (editUser.name.trim().length < 2) {
      setEditUserError('El nombre necesita mínimo 2 caracteres.');
      return;
    }
    if (!/.+@.+\..+/.test(editUser.email.trim())) {
      setEditUserError('Email inválido.');
      return;
    }
    setEditUserError('');
    const current = effectiveUsers.find(x => x.id === editUserId);
    setEditUserSaving(true);
    updateUserMut.mutate(
      {
        id: editUserId,
        patch: {
          full_name: editUser.name.trim(),
          email: editUser.email.trim(),
          status: editUser.active ? 'ACTIVE' : 'INACTIVE',
        },
      },
      {
        onSuccess: async () => {
          try {
            // Cambio de rol = revocar el anterior + asignar el nuevo (por nombre → id).
            const oldRole = (current?.role ?? '').toLowerCase();
            const newRole = editUser.role.toLowerCase();
            if (newRole && newRole !== oldRole && serverRolesQuery.data) {
              const oldTarget = serverRolesQuery.data.find(r => r.name.toLowerCase() === oldRole);
              const newTarget = serverRolesQuery.data.find(r => r.name.toLowerCase() === newRole);
              if (!newTarget) {
                throw new Error(`El rol "${editUser.role}" no existe en el servidor. Elige uno de la lista.`);
              }
              if (oldTarget) {
                await apiFetch(`/api/v1/usuarios/${editUserId}/roles/${oldTarget.id}`, { method: 'DELETE', block: false });
              }
              if (newTarget) {
                await apiFetch(`/api/v1/usuarios/${editUserId}/roles`, {
                  method: 'POST', body: JSON.stringify({ role_id: newTarget.id }), block: false,
                });
              }
            }
            setEditUserId(null);
            await serverUsersQuery.refetch();
          } catch (err) {
            setEditUserError(`Datos guardados, pero falló el cambio de rol: ${(err as Error).message}`);
          } finally {
            setEditUserSaving(false);
          }
        },
        onError: (err) => {
          setEditUserError((err as Error).message);
          setEditUserSaving(false);
        },
      },
    );
  };

  // ── Editar rol (nombre, descripción) ──
  const updateRoleMut = useUpdateRole();
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState({ name: '', description: '' });
  const [editRoleError, setEditRoleError] = useState('');

  const openEditRole = (r: { id: number; name: string; description: string | null }) => {
    setEditRoleError('');
    setEditRole({ name: r.name, description: r.description ?? '' });
    setEditRoleId(r.id);
  };

  const handleSaveRole = () => {
    if (editRoleId === null) return;
    if (editRole.name.trim().length < 2) {
      setEditRoleError('El nombre necesita mínimo 2 caracteres.');
      return;
    }
    setEditRoleError('');
    updateRoleMut.mutate(
      { id: editRoleId, patch: { name: editRole.name.trim(), description: editRole.description.trim() || null } },
      {
        onSuccess: () => {
          setEditRoleId(null);
          if (serverRoleId === editRoleId) void serverRolePerms.refetch();
        },
        onError: (err) => setEditRoleError((err as Error).message),
      },
    );
  };

  const resetNewUser = () => {
    setNewUser({ name: '', email: '', role: 'artist', password: '' });
    setAddUserModal(false);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    const username = newUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || `user${Date.now()}`;
    createUserMut.mutate(
      { username, email: newUser.email, full_name: newUser.name, password: newUser.password || 'Cambiar-1234' },
      { onSuccess: () => resetNewUser() },
    );
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
  const serverCatsQuery = useServerCategories(verified);
  const onlineCats = serverCatsQuery.data !== undefined;
  const effCategories = onlineCats
    ? (serverCatsQuery.data ?? []).map(c => ({
        id: c.slug, name: c.name, icon: c.icon, color: c.color, description: c.description ?? '',
        design_count: c.design_count ?? 0,
      }))
    : categories.map(c => ({ ...c, design_count: designs.filter(d => d.category === c.id).length }));
  const catSlugById = new Map((serverCatsQuery.data ?? []).map(c => [c.id, c.slug] as const));
  const serverDesignsQuery = useServerDesigns(designPage, searchDesign, selectedCat, 6, false, verified);
  const onlineDesigns = serverDesignsQuery.data !== undefined;
  const mapDesign = (d: Design): MockDesign => ({
    id: d.id,
    name: d.name,
    category: catSlugById.get(d.category_id) ?? 'mano-alzada',
    price: d.price,
    duration: d.duration_min,
    image: resolveImageUrl(d.image_url) ?? '',
    description: d.description ?? '',
    technique: d.technique ?? '',
    tags: d.tags ?? [],
    occasion: d.occasion ?? 'Diario',
    complexity: d.complexity ?? 'Express',
    monthly: d.is_monthly ?? false,
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

  // ★ Marca/quita un diseño de "Diseños del mes" (Home público). Online persiste
  // en el servidor (PUT is_monthly); offline/sin servidor vive en estado local.
  const toggleDesignMonthly = (id: number, value: boolean) => {
    if (onlineDesigns) {
      updateDesignMut.mutate(
        { id, patch: { is_monthly: value } },
        {
          onError: (err) => {
            if (isOffline(err)) {
              setDesigns(ds => ds.map(x => x.id === id ? { ...x, monthly: value } : x));
            }
          },
        },
      );
      return;
    }
    setDesigns(ds => ds.map(x => x.id === id ? { ...x, monthly: value } : x));
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
            setNewCategory({ name: '', icon: 'sparkles', color: '#f2d29b', description: '' });
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
  const dayApptsQuery = useServerAppointments(agendaDay, '', verified);
  const onlineAgenda = dayApptsQuery.data !== undefined;
  const monthApptsQuery = useServerAppointments('', '', verified);
  const todayApptsQuery = useServerAppointments(todayStr, '', verified);
  const onlineToday = todayApptsQuery.data !== undefined;
  const todayAppts = todayApptsQuery.data?.items ?? [];
  // Saludo real: nombre de sesión + fecha de hoy + resumen de citas de hoy.
  const _hour = new Date().getHours();
  const greetWord = _hour < 12 ? 'Buenos días' : _hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const todayLabel = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayActive = todayAppts.filter(a => a.status !== 'cancelled');
  const nextAppt = todayActive
    .filter(a => a.status === 'pending' || a.status === 'confirmed')
    .map(a => a.starts_at.slice(11, 16))
    .sort()[0] ?? null;

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
        lastVisit: c.last_visit ? c.last_visit.slice(0, 10) : '—',
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
                visits: 0, points: 0, lastVisit: '—',
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
      visits: 0, points: 0, lastVisit: '—',
    }]);
    setNewClient({ name: '', phone: '', email: '' });
    setAddClientModal(false);
  };

  const [addClientModal, setAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  const [clientError, setClientError] = useState('');
  const [rewardsFor, setRewardsFor] = useState<number | null>(null);
  const [historyFor, setHistoryFor] = useState<number | null>(null);
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
    in_progress: { label: 'En curso', cls: 'bg-[#f2d29b]/15 text-[#f9e9c8] border-[#f2d29b]/30' },
    completed: { label: 'Completada', cls: 'bg-[#332a1d] text-[#b3a893] border-[#403521]' },
    cancelled: { label: 'Cancelada', cls: 'bg-[#332a1d] text-[#6b6355] border-[#403521]' },
  };
  const NEXT_STATUS: Record<string, { to: string; label: string }> = {
    pending: { to: 'confirmed', label: 'Confirmar' },
    confirmed: { to: 'in_progress', label: 'Iniciar' },
    in_progress: { to: 'completed', label: 'Completar' },
  };
  const allClientsQuery = useServerClients(1, '', 100);
  const allDesignsQuery = useServerDesigns(1, '', 'all', 100, false, verified);
  // Diseños marcados del mes (servidor). Offline: se filtran del estado local.
  const monthlyDesignsQuery = useServerDesigns(1, '', 'all', 100, true, verified);
  const onlineMonthly = monthlyDesignsQuery.data !== undefined;
  const monthlyDesigns: MockDesign[] = onlineMonthly
    ? (monthlyDesignsQuery.data?.items.map(mapDesign) ?? [])
    : designs.filter(d => d.monthly);
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
          color: '#f2d29b',
          title: cname,
          sub: `${a.design_id ? (designNameById.get(a.design_id) ?? 'Diseño') : 'Servicio general'} · ${mins} min`,
          avatar: cname[0] ?? '?',
          status: meta.label,
          cls: meta.cls,
        };
      })
    : ([
        { ...MOCK_APPOINTMENTS[0], artist: 'Gaby M.', status: 'En curso', statusCls: 'bg-[#f2d29b]/15 text-[#f9e9c8] border-[#f2d29b]/30' },
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
          color: '#f2d29b',
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
        { ...MOCK_APPOINTMENTS[0], artist: 'Gaby M.', status: 'En curso', cls: 'bg-[#f2d29b]/15 text-[#f9e9c8] border-[#f2d29b]/30' },
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
    setUserActionError('');
    toggleUserMut.mutate(
      { id, status: active ? 'INACTIVE' : 'ACTIVE' },
      { onError: (err) => setUserActionError((err as Error).message || 'No se pudo cambiar el estado.') },
    );
  };

  // Badge de rol: con servidor usa los roles reales (nombre + color de paleta).
  // Sin dato (offline) la tabla ni se muestra, así que el gris es último recurso.
  const roleOf = (roleId: string) => {
    if (serverRolesQuery.data) {
      const idx = serverRolesQuery.data.findIndex(r => r.name.toLowerCase() === roleId.toLowerCase());
      if (idx >= 0) {
        const found = serverRolesQuery.data[idx];
        return {
          id: roleId,
          name: found.name,
          color: (['#f2d29b', '#9b8ea8', '#8aab8a', '#d4613a', '#8ab0c8'][idx % 5] ?? '#f2d29b') as string,
          permissions: [] as string[],
        };
      }
    }
    return { id: roleId, name: roleId, color: '#b3a893', permissions: [] as string[] };
  };

  // ── Input style helper
  const inputCls = "w-full bg-[#0d0b09] border border-[#403521] rounded px-3 py-2.5 text-[#faf7f0] text-sm focus:outline-none focus:border-[#f2d29b] transition-colors";

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar premium ── */}
      <aside className="w-60 fixed top-0 left-0 bottom-0 z-40 hidden lg:flex flex-col border-r border-[#3a2f1e] overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #100c07 0%, #0d0b09 45%, #0a0806 100%)' }}>
        {/* halo superior */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(242,210,155,0.16) 0%, transparent 70%)', filter: 'blur(10px)' }} />
        {/* Brand */}
        <div className="relative px-5 pt-6 pb-5 border-b border-[#3a2f1e]/70">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="Nails Studio"
                className="w-10 h-10 rounded-2xl object-cover border border-[#f2d29b]/40"
                style={{ boxShadow: '0 0 20px rgba(242,210,155,0.25)' }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#8aab8a] border-2 border-[#0d0b09]" title="En línea" />
            </div>
            <div>
              <p className="font-serif text-[17px] leading-none text-[#faf7f0]">Nails <span className="text-gradient-subtle">Studio</span></p>
            </div>
          </div>
        </div>

        {/* Nav — scroll sin barra visible (responsive: mantiene overflow en pantallas bajas) */}
        <nav className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {([
            { section: 'Gestión', ids: ['overview', 'catalog', 'monthly', 'agenda'] },
            { section: 'Personas', ids: ['clients', 'users'] },
            { section: 'Negocio', ids: ['giftcards', 'referidos', 'reviews', 'blog', 'nosotros', 'contacto'] },
          ] as const).map(group => (
            <div key={group.section}>
              <p className="px-3 mb-2 font-mono text-[9px] tracking-[0.28em] uppercase text-[#6b6355]">{group.section}</p>
              <div className="space-y-1">
                {group.ids.filter(canSeeTab).map(id => {
                  const t = TABS.find(x => x.id === id)!;
                  const active = tab === t.id;
                  return (
                    <button key={t.id} onClick={() => goTab(t.id)}
                      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-300 animate-slide-right ${active ? 'text-[#f9e9c8]' : 'text-[#b3a893] hover:text-[#faf7f0] hover:bg-white/[0.04] hover:translate-x-0.5'}`}
                      style={active ? { background: 'linear-gradient(90deg, rgba(242,210,155,0.18) 0%, rgba(242,210,155,0.06) 100%)', boxShadow: 'inset 0 0 0 1px rgba(242,210,155,0.22)' } : undefined}>
                      {/* indicador activo */}
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300 ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}
                        style={{ background: 'linear-gradient(180deg,#f9e9c8,#f2d29b)', boxShadow: active ? '0 0 12px rgba(242,210,155,0.8)' : undefined }} />
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${active ? 'border border-[#f2d29b]/40' : 'border border-transparent bg-white/[0.03] group-hover:border-[#f2d29b]/20'}`}
                        style={active ? { background: 'linear-gradient(135deg,#2a2013,#120e0a)', color: '#f9e9c8' } : undefined}>
                        <t.icon size={15} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
                      </span>
                      <span className="flex-1 text-left font-medium tracking-wide">{t.label}</span>
                      <ChevronRight size={12} className={`transition-all duration-300 ${active ? 'opacity-100 translate-x-0 text-[#f2d29b]' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Staff + salida */}
        <div className="relative p-3 border-t border-[#3a2f1e]/70 space-y-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl border border-[#403521]/70 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border border-[#f2d29b]/40 text-[#f9e9c8]"
              style={{ background: 'linear-gradient(135deg,#2a2013,#120e0a)' }}>{sessionInitial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[#faf7f0] text-[13px] font-medium truncate">{sessionName}</p>
              <p className="text-[#b3a893] text-[11px] flex items-center gap-1.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-[#8aab8a] animate-pulse shrink-0" /> {sessionRole || 'Sesión activa'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/')}
              className="py-2 rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 hover:bg-[#f2d29b]/[0.06] text-xs transition-all duration-300 hover:-translate-y-px">
              Ver sitio
            </button>
            <button onClick={handleLogout}
              className="py-2 rounded-xl border border-transparent text-[#b3a893] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 text-xs transition-all duration-300 hover:-translate-y-px flex items-center justify-center gap-1.5">
              <LogOut size={12} /> Salir
            </button>
          </div>
        </div>
</aside>

      {/* ── Mobile drawer (lg:hidden) ── */}
      {mobileDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed top-0 left-0 z-50 lg:hidden w-72 max-w-[85vw] h-[100vh] h-[100dvh] flex flex-col border-r border-[#3a2f1e] overflow-hidden animate-slide-right safe-top safe-bottom"
            style={{
              background: 'linear-gradient(180deg, #100c07 0%, #0d0b09 45%, #0a0806 100%)',
            }}
            role="dialog"
            aria-label="Menú de navegación"
          >
            {/* Brand header */}
            <div className="relative px-5 pt-6 pb-5 border-b border-[#3a2f1e]/70 flex items-center justify-between">
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="relative">
                  <img
                    src="/logo.jpg"
                    alt="Nails Studio"
                    className="w-10 h-10 rounded-2xl object-cover border border-[#f2d29b]/40"
                    style={{ boxShadow: '0 0 20px rgba(242,210,155,0.25)' }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#8aab8a] border-2 border-[#0d0b09]" title="En línea" />
                </div>
                <div>
                  <p className="font-serif text-[17px] leading-none text-[#faf7f0]">Nails <span className="text-gradient-subtle">Studio</span></p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="w-9 h-9 flex items-center justify-center text-[#a29885] hover:text-[#faf7f0] active:scale-[0.97] transition-[transform,color] duration-150 rounded-lg hover:bg-white/[0.04]"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Nav — scroll con safe-area */}
            <nav className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {([
                { section: 'Gestión', ids: ['overview', 'catalog', 'monthly', 'agenda'] },
                { section: 'Personas', ids: ['clients', 'users'] },
                { section: 'Negocio', ids: ['giftcards', 'referidos', 'reviews', 'blog', 'nosotros', 'contacto'] },
              ] as const).map(group => (
                <div key={group.section}>
                  <p className="px-3 mb-2 font-mono text-[9px] tracking-[0.28em] uppercase text-[#6b6355]">{group.section}</p>
                  <div className="space-y-1">
                    {group.ids.filter(canSeeTab).map(id => {
                      const t = TABS.find(x => x.id === id)!;
                      const active = tab === t.id;
                      return (
                        <button key={t.id} onClick={() => { goTab(t.id); setMobileDrawerOpen(false); }}
                          className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-300 animate-slide-right ${active ? 'text-[#f9e9c8]' : 'text-[#b3a893] hover:text-[#faf7f0] hover:bg-white/[0.04] hover:translate-x-0.5'}`}
                          style={active ? { background: 'linear-gradient(90deg, rgba(242,210,155,0.18) 0%, rgba(242,210,155,0.06) 100%)', boxShadow: 'inset 0 0 0 1px rgba(242,210,155,0.22)' } : undefined}>
                          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300 ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}
                            style={{ background: 'linear-gradient(180deg,#f9e9c8,#f2d29b)', boxShadow: active ? '0 0 12px rgba(242,210,155,0.8)' : undefined }} />
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${active ? 'border border-[#f2d29b]/40' : 'border border-transparent bg-white/[0.03] group-hover:border-[#f2d29b]/20'}`}
                            style={active ? { background: 'linear-gradient(135deg,#2a2013,#120e0a)', color: '#f9e9c8' } : undefined}>
                            <t.icon size={15} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
                          </span>
                          <span className="flex-1 text-left font-medium tracking-wide">{t.label}</span>
                          <ChevronRight size={12} className={`transition-all duration-300 ${active ? 'opacity-100 translate-x-0 text-[#f2d29b]' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Staff + salida */}
            <div className="relative p-3 border-t border-[#3a2f1e]/70 space-y-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl border border-[#403521]/70 bg-white/[0.02]">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border border-[#f2d29b]/40 text-[#f9e9c8]"
                  style={{ background: 'linear-gradient(135deg,#2a2013,#120e0a)' }}>{sessionInitial}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#faf7f0] text-[13px] font-medium truncate">{sessionName}</p>
                  <p className="text-[#b3a893] text-[11px] flex items-center gap-1.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-[#8aab8a] animate-pulse shrink-0" /> {sessionRole || 'Sesión activa'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { navigate('/'); setMobileDrawerOpen(false); }}
                  className="py-2 rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 hover:bg-[#f2d29b]/[0.06] text-xs transition-all duration-300 hover:-translate-y-px">
                  Ver sitio
                </button>
                <button onClick={handleLogout}
                  className="py-2 rounded-xl border border-transparent text-[#b3a893] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 text-xs transition-all duration-300 hover:-translate-y-px flex items-center justify-center gap-1.5">
                  <LogOut size={12} /> Salir
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

{/* ── Main content ── */}
      <main className="lg:ml-60 flex-1 p-6 pb-24 lg:pb-6 pt-8 max-w-full">
        {/* Top bar - responsive */}
        <div className="flex items-center justify-between mb-8">
          <div className="lg:hidden w-10" />
          {!mobileDrawerOpen && (
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={mobileDrawerOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-[#a29885] hover:text-[#faf7f0] active:scale-[0.97] transition-[transform,color] duration-150 rounded-xl hover:bg-white/[0.04]"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu size={22} />
            </button>
          )}
          <h1 className="font-serif text-2xl text-[#faf7f0] flex-1 text-center lg:text-left">{TABS.find(t => t.id === tab)?.label}</h1>
          <div className="w-10 lg:w-auto" />
        </div>

        {/* ════════════════════════════════════
            OVERVIEW
        ════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* ── Saludo + acciones ── */}
            <div className="relative overflow-hidden rounded-2xl border border-[#f2d29b]/20 p-6 sm:p-7"
              style={{ background: 'linear-gradient(120deg, #1a140d 0%, #120e0a 55%, #0d0b09 100%)' }}>
              <div className="orb orb-gold" style={{ width: 320, height: 320, top: '-40%', right: '-5%', opacity: 0.22 }} />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                <div>
                  <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.28em] uppercase mb-2 flex items-center gap-2">
                    <Sparkles size={11} /> <span className="capitalize">{todayLabel}</span>
                  </p>
                  <h2 className="font-serif text-[#faf7f0] leading-tight" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}>
                    {greetWord}, {sessionName}
                  </h2>
                  <p className="text-[#b3a893] text-sm mt-1">
                    {onlineToday ? (
                      todayActive.length === 0 ? (
                        <>Sin citas hoy. La agenda está libre.</>
                      ) : (
                        <>Tienes <span className="text-[#f9e9c8] font-medium">{todayActive.length} cita{todayActive.length === 1 ? '' : 's'} hoy</span>{nextAppt ? <> · próxima a las {nextAppt}</> : null}</>
                      )
                    ) : (
                      <>Conecta el servidor para ver tu día.</>
                    )}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => goTab('agenda')}
                    className="px-4 py-2.5 border border-[#f2d29b]/35 text-[#f2d29b] text-sm rounded-lg hover:bg-[#f2d29b]/10 transition-colors">
                    Ver agenda
                  </button>
                  <button onClick={() => goTab('agenda')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded-lg hover:bg-[#f7ddab] transition-colors">
                    <Plus size={14} /> Nueva cita
                  </button>
                </div>
              </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Citas hoy', value: String(onlineToday ? todayAppts.length : 4), sub: onlineToday ? `${todayAppts.filter(a => a.status === 'pending').length} pendientes` : '3 confirmadas · 1 pendiente', icon: Calendar, accent: '#f2d29b', spark: [35, 55, 40, 70, 58, 85, 64] },
                { label: 'Diseños', value: String(onlineDesigns ? designTotal : designs.length), sub: onlineCats ? `${effCategories.length} categorías` : 'catálogo activo', icon: Package, accent: '#8aab8a', spark: [30, 45, 38, 60, 52, 78, 90] },
                { label: 'Clientas', value: String(effClientsBase.length), sub: onlineClients ? 'base en servidor' : 'base local', icon: Users, accent: '#9b8ea8', spark: [50, 62, 55, 70, 66, 74, 68] },
                { label: 'Gift activas', value: String(gcSource.filter(g => !g.used).length), sub: onlineGc ? 'por canjear' : 'demo local', icon: Gift, accent: '#d4613a', spark: [40, 48, 55, 52, 64, 70, 76] },
              ].map(s => (
                <div key={s.label} className="group bg-[#14110c] border border-[#403521] hover:border-[#f2d29b]/30 rounded-2xl p-5 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}55, transparent)` }} />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{s.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#403521]"
                      style={{ background: `${s.accent}14`, color: s.accent }}>
                      <s.icon size={14} />
                    </div>
                  </div>
                  <p className="font-serif text-[2rem] leading-none text-[#faf7f0]">{s.value}</p>
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
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[#faf7f0] text-sm font-medium">Agenda de hoy</p>
                    <p className="text-[#b3a893] text-xs mt-0.5">
                      {onlineToday ? `${todayAppts.length} cita(s) · una artista en turno` : '4 citas · 2 artistas en turno'}
                    </p>
                  </div>
                  <button onClick={() => goTab('agenda')} className="flex items-center gap-1 text-xs text-[#f2d29b] hover:gap-2 transition-all">
                    Ver todo <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  {overviewRows.length === 0 ? (
                    <p className="py-6 text-center text-[#b3a893] text-xs">Sin citas hoy. La agenda está libre.</p>
                  ) : overviewRows.map(a => (
                    <div key={a.key} className="flex items-center gap-4 py-3 border-b border-[#403521]/70 last:border-0 hover:bg-[#332a1d]/30 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="text-center w-12 shrink-0">
                        <p className="font-mono text-[#f9e9c8] text-sm font-medium">{a.time}</p>
                      </div>
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="w-9 h-9 rounded-full bg-[#332a1d] border border-[#f2d29b]/25 flex items-center justify-center font-serif text-[#f2d29b] text-sm shrink-0">
                        {a.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#faf7f0] text-sm truncate">{a.title}</p>
                        <p className="text-[#b3a893] text-xs truncate">{a.sub}</p>
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
                    // Sin próxima cita real no se inventa ninguna: estado vacío
                    // honesto. El mock "Ana López" se eliminó (botón muerto).
                    return (
                <div className="rounded-2xl p-5 border border-[#403521] relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a140d 0%, #120e0a 100%)' }}>
                  <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.25em] uppercase mb-2">Próxima cita</p>
                  <p className="font-serif text-xl text-[#faf7f0]">
                    {onlineToday ? 'Sin citas pendientes hoy' : 'Sin conexión al servidor'}
                  </p>
                  <p className="text-[#d8cfbf] text-xs mt-1">
                    {onlineToday
                      ? 'La agenda de hoy está libre o todo está en curso.'
                      : 'Conecta el servidor para ver tu día.'}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => goTab('agenda')}
                      className="flex-1 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">Nueva cita</button>
                    <button onClick={() => goTab('agenda')} className="flex-1 py-2 border border-[#f2d29b]/30 text-[#f2d29b] text-xs rounded-lg hover:bg-[#f2d29b]/10 transition-colors">Ver agenda</button>
                  </div>
                </div>
                    );
                  }
                  const cname = clientNameById.get(upcoming.client_id) ?? `Clienta #${upcoming.client_id}`;
                  const dname = upcoming.design_id ? (designNameById.get(upcoming.design_id) ?? 'Diseño') : 'Servicio general';
                  const meta = STATUS_META[upcoming.status] ?? STATUS_META.pending;
                  return (
                <div className="rounded-2xl p-5 border border-[#f2d29b]/30 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #2a2013 0%, #1a1409 100%)' }}>
                  <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.25em] uppercase mb-2">Próxima · {upcoming.starts_at.slice(11, 16)}</p>
                  <p className="font-serif text-xl text-[#faf7f0]">{cname}</p>
                  <p className="text-[#d8cfbf] text-xs mt-1">{dname} · {meta.label}</p>
                  <div className="flex gap-2 mt-4">
                    {NEXT_STATUS[upcoming.status] && (
                      <Can code="reservas.update">
                        <button onClick={() => advanceAppointment(upcoming.id, upcoming.status)}
                          className="flex-1 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                          {NEXT_STATUS[upcoming.status].label}
                        </button>
                      </Can>
                    )}
                    <button onClick={() => goTab('agenda')} className="flex-1 py-2 border border-[#f2d29b]/30 text-[#f2d29b] text-xs rounded-lg hover:bg-[#f2d29b]/10 transition-colors">Ver agenda</button>
                  </div>
                </div>
                  );
                })()}

                {/* ── Estado de hoy ── */}
                <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5">
                  <p className="text-[#faf7f0] text-sm font-medium mb-4">Estado de hoy</p>
                  <div className="space-y-4">
                    {(() => {
                      const counts = onlineToday
                        ? [
                            { label: 'Pendientes', n: todayAppts.filter(a => a.status === 'pending').length, color: '#d4613a' },
                            { label: 'Confirmadas / en curso', n: todayAppts.filter(a => a.status === 'confirmed' || a.status === 'in_progress').length, color: '#f2d29b' },
                            { label: 'Completadas', n: todayAppts.filter(a => a.status === 'completed').length, color: '#8aab8a' },
                          ]
                        : [
                            { label: 'Pendientes', n: 1, color: '#d4613a' },
                            { label: 'Confirmadas / en curso', n: 3, color: '#f2d29b' },
                            { label: 'Completadas', n: 0, color: '#8aab8a' },
                          ];
                      const max = Math.max(1, ...counts.map(c => c.n));
                      return counts.map(t => (
                      <div key={t.label}>
                        <div className="flex justify-between items-baseline text-xs mb-1.5">
                          <span className="text-[#faf7f0]">{t.label}</span>
                          <span className="font-mono" style={{ color: t.color }}>{t.n}</span>
                        </div>
                        <div className="h-1.5 bg-[#332a1d] rounded-full overflow-hidden">
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
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#faf7f0] text-sm font-medium">Servicios más solicitados</p>
                  <button onClick={() => goTab('catalog')} className="text-xs text-[#b3a893] hover:text-[#f2d29b] transition-colors">Catálogo →</button>
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
                            <span className="text-[#faf7f0]">{s.name} <span className="text-[#6b6355]">· {s.detail}</span></span>
                            <span className="text-[#f2d29b] font-mono">{s.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[#332a1d] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#a37c42] to-[#f2d29b] rounded-full" style={{ width: `${s.pct}%` }} />
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
                      return <p className="py-4 text-center text-[#b3a893] text-xs">Sin citas registradas este mes.</p>;
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
                            <span className="text-[#faf7f0]">{name} <span className="text-[#6b6355]">· {n} citas{income > 0 ? ` · ₡${income.toLocaleString()}` : ''}</span></span>
                            <span className="text-[#f2d29b] font-mono">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[#332a1d] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#a37c42] to-[#f2d29b] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* ── Requieren atención (datos vivos) ── */}
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
                <p className="text-[#faf7f0] text-sm font-medium mb-4">Requieren atención</p>
                <div className="space-y-3">
                  {(() => {
                    if (!onlineToday) {
                      return <p className="text-[#b3a893] text-xs">○ Local — conecta el servidor para ver pendientes reales.</p>;
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
                              <p className="text-[#faf7f0] text-xs font-medium">
                                Confirmar: {clientNameById.get(a.client_id) ?? `Clienta #${a.client_id}`} · {a.starts_at.slice(11, 16)}
                              </p>
                              <p className="text-[#b3a893] text-xs mt-0.5">Cita pendiente de hoy sin confirmar</p>
                            </div>
                          </div>
                        ))}
                        {activeGc > 0 && (
                          <div className="flex gap-3 p-3 rounded-xl bg-[#f2d29b]/6 border border-[#f2d29b]/20">
                            <Gift size={15} className="text-[#f2d29b] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[#faf7f0] text-xs font-medium">{activeGc} gift card(s) por canjear</p>
                              <p className="text-[#b3a893] text-xs mt-0.5">Recuerda ofrecerlas en el cierre del servicio</p>
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
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
                {([
                  { id: 'designs', label: `Diseños (${onlineDesigns ? designTotal : designs.length})` },
                  { id: 'categories', label: `Categorías (${onlineCats ? effCategories.length : categories.length})` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setCatalogSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${catalogSubtab === t.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
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
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-xl hover:bg-[#f7ddab] shadow-[0_4px_20px_rgba(242,210,155,0.25)] transition-all">
                      <Plus size={15} /> Nuevo diseño
                    </button>
                  </Can>
                ) : (
                  <Can code="catalogo.create">
                    <button onClick={() => { setCatDeleteError(''); setAddCategoryModal(true); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-xl hover:bg-[#f7ddab] shadow-[0_4px_20px_rgba(242,210,155,0.25)] transition-all">
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
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Toolbar: search + categorías ── */}
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355]" />
                  <input
                    value={searchDesign}
                    onChange={e => { setSearchDesign(e.target.value); catalogPag.setPage(1); goDesignPage(1); }}
                    placeholder="Buscar por nombre…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b09] border border-[#403521] rounded-xl text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 focus:shadow-[0_0_0_3px_rgba(242,210,155,0.1)] w-full md:w-64 transition-all"
                  />
                </div>
                <p className="text-[#b3a893] text-xs font-mono md:text-right">{onlineDesigns ? designTotal : filteredDesigns.length} resultado(s)</p>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setSelectedCat('all'); catalogPag.setPage(1); goDesignPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${selectedCat === 'all' ? 'bg-[#f2d29b] text-[#0d0b09] border-[#f2d29b] font-semibold' : 'border-[#403521] text-[#b3a893] hover:border-[#f2d29b]/50 hover:text-[#f9e9c8]'}`}>
                  Todas
                </button>
                {effCategories.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCat(c.id); catalogPag.setPage(1); goDesignPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${selectedCat === c.id ? 'text-[#0d0b09] font-semibold' : 'border-[#403521] text-[#b3a893] hover:border-[#f2d29b]/50 hover:text-[#f9e9c8]'}`}
                    style={selectedCat === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                    <CategoryIcon name={c.icon} size={13} /> {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tabla premium ── */}
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#403521] bg-[#0d0b09]/60">
                    {['Diseño', 'Categoría', 'Precio', 'Duración', 'Acciones'].map(h => (
                      <th key={h} className="text-left text-[#b3a893] font-mono text-[11px] uppercase tracking-widest py-3.5 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {designRows.map(d => {
                    const cat = effCategories.find(c => c.id === d.category);
                    return (
                    <tr key={d.id} className="border-b border-[#403521]/60 last:border-0 hover:bg-[#f2d29b]/[0.04] transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <img src={d.image} alt={d.name} loading="lazy"
                            className="w-12 h-12 object-cover rounded-xl border border-[#403521] group-hover:border-[#f2d29b]/40 transition-colors shrink-0" />
                          <div className="min-w-0">
                            <p className="font-serif text-[#faf7f0] leading-tight truncate">{d.name}</p>
                            <p className="text-[#6b6355] text-[11px] font-mono mt-0.5">ID #{d.id} · {d.duration} min</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border"
                          style={{ background: `${cat?.color ?? '#f2d29b'}14`, borderColor: `${cat?.color ?? '#f2d29b'}35`, color: cat?.color ?? '#f2d29b' }}>
                          <span>{cat && <CategoryIcon name={cat.icon} size={11} />}</span> {cat?.name ?? d.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5"><span className="font-serif text-lg text-[#f9e9c8]">₡{d.price.toLocaleString()}</span></td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 text-[#b3a893] text-xs">
                          <Clock size={12} className="text-[#6b6355]" /> {d.duration} min
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Can code="catalogo.update">
                            <button
                              title={d.monthly ? 'Quitar de Diseños del mes' : 'Destacar en Diseños del mes'}
                              onClick={() => toggleDesignMonthly(d.id, !d.monthly)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${d.monthly ? 'text-[#f2d29b] border-[#f2d29b]/40 bg-[#f2d29b]/10' : 'border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/30 hover:bg-[#f2d29b]/10'}`}>
                              <Star size={14} className={d.monthly ? 'fill-[#f2d29b]' : ''} />
                            </button>
                          </Can>
                          <Can code="catalogo.update">
                            <button title="Editar" onClick={() => openEditDesign(d.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/30 hover:bg-[#f2d29b]/10 transition-all"><Edit3 size={14} /></button>
                          </Can>
                          <Can code="catalogo.delete">
                            <button title="Eliminar" onClick={() => setDeleteDesignModal({ open: true, id: d.id })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#b3a893] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 transition-all"><Trash2 size={14} /></button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {designRows.length === 0 && (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <Package size={28} className="mx-auto text-[#403521] mb-3" />
                      <p className="font-serif text-[#b3a893] text-lg">Sin diseños con esos filtros</p>
                      <p className="text-[#6b6355] text-xs mt-1 mb-4">Prueba con otro nombre o categoría</p>
                      <button onClick={() => { setSearchDesign(''); setSelectedCat('all'); catalogPag.setPage(1); goDesignPage(1); }}
                        className="px-4 py-2 border border-[#f2d29b]/40 text-[#f2d29b] text-xs rounded-lg hover:bg-[#f2d29b]/10 transition-colors">
                        Limpiar filtros
                      </button>
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination page={onlineDesigns ? designPage : catalogPag.page} total={onlineDesigns ? designTotalPages : catalogPag.totalPages} onChange={onlineDesigns ? goDesignPage : catalogPag.setPage} count={onlineDesigns ? designTotal : filteredDesigns.length} pageSize={6} showNumbers={false} />
            </>
            )}

            {catalogSubtab === 'categories' && (
              <div className="space-y-4">
                <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355]" />
                    <input
                      value={searchCat}
                      onChange={e => setSearchCat(e.target.value)}
                      placeholder="Buscar categoría…"
                      className="pl-10 pr-4 py-2.5 bg-[#0d0b09] border border-[#403521] rounded-xl text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 w-full md:w-64 transition-all"
                    />
                  </div>
                  <p className="text-[#b3a893] text-xs font-mono">{effCategories.filter(c => {
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
                  <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                    <Package size={28} className="mx-auto text-[#403521] mb-3" />
                    <p className="font-serif text-[#b3a893] text-lg">Sin categorías con ese filtro</p>
                    <button onClick={() => setSearchCat('')}
                      className="mt-4 px-4 py-2 border border-[#f2d29b]/40 text-[#f2d29b] text-xs rounded-lg hover:bg-[#f2d29b]/10 transition-colors">
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {list.map(c => {
                      const n = c.design_count ?? designsInCat(c.id);
                      return (
                        <div key={c.id} className="group relative bg-[#14110c] border border-[#403521] hover:border-[#f2d29b]/35 rounded-2xl p-5 transition-all overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                                style={{ background: `${c.color}14`, borderColor: `${c.color}35`, color: c.color }}>
                                <CategoryIcon name={c.icon} size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-serif text-[#faf7f0] leading-tight truncate">{c.name}</p>
                                <p className="text-[#6b6355] text-[11px] font-mono mt-0.5">/{c.id} · {n} diseño(s)</p>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Can code="catalogo.update">
                                <button title="Editar categoría" onClick={() => openEditCategory(c.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 border border-transparent hover:border-[#f2d29b]/30 transition-all shrink-0">
                                  <Edit3 size={14} />
                                </button>
                              </Can>
                              <Can code="catalogo.delete">
                                <button title="Eliminar categoría"
                                  onClick={() => { setCatDeleteError(''); setDeleteCategoryModal({ open: true, id: c.id }); }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all shrink-0">
                                  <Trash2 size={14} />
                                </button>
                              </Can>
                            </div>
                          </div>
                          <p className="text-[#b3a893] text-xs mt-3 leading-relaxed line-clamp-2 min-h-[2rem]">{c.description}</p>
                          <div className="flex items-center justify-between mt-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border"
                              style={{ background: `${c.color}12`, borderColor: `${c.color}30`, color: c.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} /> {n} diseños
                            </span>
                            <button onClick={() => { setSelectedCat(c.id); catalogPag.setPage(1); setCatalogSubtab('designs'); }}
                              className="text-xs text-[#b3a893] hover:text-[#f2d29b] transition-colors">
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
            DISEÑOS DEL MES
        ════════════════════════════════════ */}
        {tab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.25em] uppercase">Diseños del mes</p>
                <h2 className="font-serif text-xl text-[#faf7f0] mt-0.5">Lo que ve el Home público</h2>
              </div>
              <div className="flex items-center gap-2">
                {onlineMonthly ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Local</span>
                )}
                <Can code="catalogo.update">
                  <button onClick={() => goTab('catalog')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-xl hover:bg-[#f7ddab] shadow-[0_4px_20px_rgba(242,210,155,0.25)] transition-all">
                    <Star size={14} /> Marcar en Catálogo
                  </button>
                </Can>
              </div>
            </div>

            {/* ── Mini KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Diseños destacados', value: String(monthlyDesigns.length), sub: 'visibles en el Home' },
                { label: 'Precio promedio', value: monthlyDesigns.length ? `₡${Math.round(monthlyDesigns.reduce((a, d) => a + d.price, 0) / monthlyDesigns.length).toLocaleString()}` : '₡0', sub: 'por servicio' },
                { label: 'Duración prom.', value: monthlyDesigns.length ? `${Math.round(monthlyDesigns.reduce((a, d) => a + d.duration, 0) / monthlyDesigns.length)} min` : '0 min', sub: 'por cita' },
                { label: 'Categorías', value: String(new Set(monthlyDesigns.map(d => d.category)).size), sub: 'representadas' },
              ].map(k => (
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Grid de diseños del mes ── */}
            {monthlyDesigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {monthlyDesigns.map(d => (
                  <div key={d.id} className="group relative bg-[#14110c] border border-[#f2d29b]/25 rounded-2xl overflow-hidden">
                    <div className="relative h-44 overflow-hidden">
                      <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover" />
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#060505] font-medium"
                        style={{ background: 'linear-gradient(135deg, #f2d29b, #d4613a)' }}>
                        <Star size={10} className="fill-[#060505]" /> Del mes
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-serif text-[#faf7f0] leading-tight truncate">{d.name}</p>
                      <p className="text-[#f2d29b] font-mono text-xs mt-1">desde ₡{d.price.toLocaleString()}</p>
                      <Can code="catalogo.update">
                        <button onClick={() => toggleDesignMonthly(d.id, false)}
                          className="mt-3 w-full py-2 rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#e08a6d] hover:border-[#d4613a]/30 hover:bg-[#d4613a]/10 text-xs transition-all">
                          Quitar destacado
                        </button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center px-6">
                <Star size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#faf7f0] text-lg">Nada destacado este mes</p>
                <p className="text-[#b3a893] text-xs mt-1">Marca diseños con la estrella ★ en el tab Catálogo y aparecerán aquí y en el Home.</p>
                <button onClick={() => goTab('catalog')}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Ir a Catálogo
                </button>
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
                <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.25em] uppercase">Agenda · {agendaMonthLabel}</p>
                <h2 className="font-serif text-xl text-[#faf7f0] mt-0.5 capitalize">
                  {onlineAgenda ? `${dayApptsQuery.data?.total ?? 0} citas · ${agendaDayLabel}` : '4 citas programadas'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onlineAgenda ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Local</span>
                )}
                <input type="date" value={agendaDay} onChange={e => e.target.value && setAgendaDay(e.target.value)}
                  className="bg-[#0d0b09] border border-[#403521] rounded-xl text-xs text-[#faf7f0] px-3 py-2 outline-none focus:border-[#f2d29b]/60 [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-4 items-start">
              {/* ── Mini calendario ── */}
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-serif text-sm text-[#faf7f0] capitalize">{agendaMonthLabel}</p>
                  <div className="flex gap-1">
                    <button onClick={() => shiftMonth(-1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-[#403521] text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 transition-colors"><ChevronLeft size={12} /></button>
                    <button onClick={() => shiftMonth(1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-[#403521] text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 transition-colors"><ChevronRight size={12} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-[#6b6355] mb-1.5">
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
                        ${isSel ? 'bg-[#f2d29b] text-[#0d0b09] font-bold shadow-[0_2px_12px_rgba(242,210,155,0.35)]' :
                          hasAppt ? 'bg-[#f2d29b]/10 border border-[#f2d29b]/30 text-[#f9e9c8] hover:bg-[#f2d29b]/20' :
                          'text-[#b3a893] hover:bg-[#332a1d]'}`}>
                        {day}
                        {!isSel && isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f2d29b]" />}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setAgendaDay(todayStr)}
                  className="mt-3 w-full py-1.5 text-[11px] font-mono text-[#b3a893] hover:text-[#f2d29b] border border-[#403521] hover:border-[#f2d29b]/40 rounded-lg transition-all">
                  Volver a hoy
                </button>
              </div>

              {/* ── Citas del día ── */}
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#faf7f0] text-[13px] font-medium capitalize">{agendaDayLabel}</p>
                  <Can code="reservas.create">
                    <button onClick={() => { setApptError(''); setNewAppt(a => ({ ...a, date: agendaDay })); setAddApptModal(true); }}
                      className="flex items-center gap-1 text-[11px] text-[#f2d29b] hover:gap-2 transition-all">
                      <Plus size={11} /> Nueva cita
                    </button>
                  </Can>
                </div>
                <div className="divide-y divide-[#403521]/60">
                  {agendaRows.length === 0 ? (
                    <p className="py-8 text-center text-[#b3a893] text-xs">Sin citas este día. Crea la primera con Nueva cita.</p>
                  ) : agendaRows.map(a => {
                    const apptId = a.id;
                    const next = apptId !== null ? NEXT_STATUS[a.statusKey] : undefined;
                    return (
                    <div key={a.key} className="flex items-center gap-3 py-2.5 group hover:bg-[#f2d29b]/[0.03] rounded-lg px-1.5 -mx-1.5 transition-colors">
                      <span className="font-mono text-[12px] text-[#f9e9c8] w-10 shrink-0">{a.time}</span>
                      <span className="w-1 h-7 rounded-full shrink-0" style={{ background: a.color }} />
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#332a1d] border border-[#f2d29b]/25 font-serif text-[#f2d29b] text-sm shrink-0">
                        {a.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#faf7f0] text-[13px] leading-tight truncate">{a.title}</p>
                        <p className="text-[#b3a893] text-[11px] truncate">{a.sub}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap">{a.status}</span>
                      {apptId !== null && next && (
                        <button onClick={() => advanceAppointment(apptId, a.statusKey)} title={next.label}
                          className="text-[10px] px-2 py-1 rounded-lg border border-[#f2d29b]/30 text-[#f2d29b] hover:bg-[#f2d29b]/10 transition-all shrink-0">
                          {next.label}
                        </button>
                      )}
                      {apptId !== null && (
                        <button onClick={() => setDeleteApptModal({ open: true, id: apptId })} title="Eliminar"
                          className="text-[#6b6355] hover:text-[#e08a6d] transition-colors shrink-0">
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
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355]" />
                  <input
                    value={searchClient}
                    onChange={e => setSearchClient(e.target.value)}
                    placeholder="Buscar por nombre o teléfono…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b09] border border-[#403521] rounded-xl text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 w-full md:w-72 transition-all"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  {onlineClients ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Local</span>
                  )}
                  {([
                    { id: 'all', label: 'Todas' },
                    { id: 'vip', label: 'VIP' },
                    { id: 'oro', label: 'Oro' },
                    { id: 'nueva', label: 'Nuevas' },
                  ] as const).map(f => (
                    <button key={f.id} onClick={() => setClientTier(f.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs border transition-all ${clientTier === f.id ? 'bg-[#f2d29b] text-[#0d0b09] border-[#f2d29b] font-semibold' : 'border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40'}`}>
                      {f.label}
                    </button>
                  ))}
                  <Can code="clientas.create">
                    <button onClick={() => { setClientError(''); setAddClientModal(true); }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#f2d29b] text-[#0d0b09] hover:bg-[#f7ddab] transition-all whitespace-nowrap">
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
                  const matchQ = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
                  const matchT = clientTier === 'all' || c.tier === clientTier;
                  return matchQ && matchT;
                })
                .map(c => {
                  const tierStyle =
                    c.tier === 'vip'
                      ? { label: 'VIP', bg: '#f2d29b18', bd: '#f2d29b45', tx: '#f9e9c8', bar: 'linear-gradient(90deg,#a37c42,#f9e9c8)' }
                      : c.tier === 'oro'
                        ? { label: 'Oro', bg: '#9b8ea814', bd: '#9b8ea840', tx: '#c3b8d4', bar: 'linear-gradient(90deg,#6b5f7a,#c3b8d4)' }
                        : { label: 'Nueva', bg: '#8aab8a12', bd: '#8aab8a35', tx: '#a8c8a8', bar: 'linear-gradient(90deg,#4a6b4a,#a8c8a8)' };
                  const pct = Math.min(100, Math.round((c.points / 300) * 100));
                  const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('');
                  return (
                    <div key={c.id} className="group relative bg-[#14110c] border border-[#403521] hover:border-[#f2d29b]/35 rounded-2xl p-5 transition-all overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] opacity-70" style={{ background: tierStyle.bar }} />
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg border"
                            style={{ background: 'linear-gradient(135deg,#171310,#201912)', borderColor: tierStyle.bd, color: tierStyle.tx }}>
                            {initials}
                          </div>
                          {c.tier === 'vip' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f2d29b] flex items-center justify-center">
                              <Crown size={10} className="text-[#0d0b09]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-serif text-[#faf7f0] text-[17px] leading-tight truncate">{c.name}</p>
                              <p className="text-[#b3a893] text-xs mt-0.5 flex items-center gap-1.5">
                                <Phone size={10} className="text-[#6b6355]" /> <span className="font-mono">{c.phone}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0"
                              style={{ background: tierStyle.bg, borderColor: tierStyle.bd, color: tierStyle.tx }}>
                              {tierStyle.label} · {c.points} pts
                            </span>
                            <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Can code="clientas.update">
                                <button title="Editar" onClick={() => openEditClient(c.id, c.name, c.phone)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 border border-transparent hover:border-[#f2d29b]/30 transition-all"><Edit3 size={13} /></button>
                              </Can>
                              <Can code="clientas.delete">
                                <button title="Eliminar" onClick={() => { setDeleteClientError(''); setDeleteClientModal({ open: true, id: c.id, name: c.name }); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#b3a893] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all"><Trash2 size={13} /></button>
                              </Can>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                            <div className="rounded-xl bg-[#0d0b09]/70 border border-[#403521]/70 py-2">
                              <p className="font-serif text-base text-[#faf7f0] leading-none">{c.visits}</p>
                              <p className="text-[#6b6355] text-[10px] font-mono uppercase mt-1">visitas</p>
                            </div>
                            <div className="rounded-xl bg-[#0d0b09]/70 border border-[#403521]/70 py-2 px-1">
                              <p className="text-[#f9e9c8] text-[11px] font-medium leading-none truncate">{c.lastVisit}</p>
                              <p className="text-[#6b6355] text-[10px] font-mono uppercase mt-1">última</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#b3a893]">Progreso a recompensa</span>
                              <span className="font-mono" style={{ color: tierStyle.tx }}>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-[#0d0b09] border border-[#403521]/60 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tierStyle.bar }} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => setRewardsFor(c.id)}
                              className="flex-1 py-2 border border-[#f2d29b]/30 text-[#f2d29b] hover:bg-[#f2d29b]/10 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                              <Gift size={12} /> Lealtad
                            </button>
                            <Can code="reservas.read">
                              <button onClick={() => setHistoryFor(c.id)}
                                className="flex-1 py-2 border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                                <ChevronDown size={12} /> Historial
                              </button>
                            </Can>
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
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-12 text-center">
                <Users size={26} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">Sin clientas con esos filtros</p>
                <button onClick={() => { setSearchClient(''); setClientTier('all'); }}
                  className="mt-4 px-4 py-2 border border-[#f2d29b]/40 text-[#f2d29b] text-xs rounded-lg hover:bg-[#f2d29b]/10 transition-colors">
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
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit max-w-full overflow-x-auto">
                {([
                  { id: 'users', label: `Usuarios${onlineUsers ? ` (${serverUserTotal})` : ''}` },
                  { id: 'roles', label: `Roles${onlineRbac ? ` (${serverRolesQuery.data?.length ?? 0})` : ''}` },
                  { id: 'permissions', label: `Permisos${onlineRbac ? ` (${serverPermsQuery.data?.length ?? 0})` : ''}` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setUsersSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${usersSubtab === t.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {usersSubtab === 'users' && onlineUsers && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                  <Can code="usuarios.create">
                    <button onClick={() => setAddUserModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-xl hover:bg-[#f7ddab] shadow-[0_4px_20px_rgba(242,210,155,0.25)] transition-all w-fit">
                      <UserPlus size={14} /> Nuevo usuario
                    </button>
                  </Can>
                </div>
              )}
              {usersSubtab === 'roles' && onlineRbac && (
                <div className="flex items-center gap-2 shrink-0">
                  <Can code="roles.update">
                    <button onClick={() => { setNewRoleError(''); setNewRolePerms([]); setAddRoleOpen(true); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-xl hover:bg-[#f7ddab] shadow-[0_4px_20px_rgba(242,210,155,0.25)] transition-all w-fit">
                      <Plus size={14} /> Nuevo rol
                    </button>
                  </Can>
                </div>
              )}
            </div>
            {userActionError && (
              <div role="alert" className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#d4613a]/10 border border-[#d4613a]/30 text-xs">
                <p className="text-[#e08a6d]">{userActionError}</p>
                <button onClick={() => setUserActionError('')} className="text-[#b3a893] hover:text-[#faf7f0] shrink-0">Cerrar</button>
              </div>
            )}

            {usersSubtab === 'users' && !onlineUsers && !serverUsersQuery.isLoading && (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <Shield size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#faf7f0] text-lg">Usuarios no disponibles sin conexión</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">{(serverUsersQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                <button onClick={() => void serverUsersQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            )}
            {usersSubtab === 'users' && (onlineUsers || serverUsersQuery.isLoading) && (
            <>
            {/* ── Toolbar ── */}
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355]" />
                  <input
                    value={searchUser}
                    onChange={e => { setSearchUser(e.target.value); goUserPage(1); }}
                    placeholder="Buscar por nombre o email…"
                    className="pl-10 pr-4 py-2.5 bg-[#0d0b09] border border-[#403521] rounded-xl text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 w-full md:w-72 transition-all"
                  />
                </div>
                <p className="text-[#b3a893] text-xs font-mono">{serverUserTotal} resultado(s)</p>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setUserRoleFilter('all'); goUserPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${userRoleFilter === 'all' ? 'bg-[#f2d29b] text-[#0d0b09] border-[#f2d29b] font-semibold' : 'border-[#403521] text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                  Todos
                </button>
                {(serverRolesQuery.data ?? []).map((r, i) => {
                  const c = {
                    id: r.name, name: r.name,
                    color: (['#f2d29b', '#9b8ea8', '#8aab8a', '#d4613a', '#8ab0c8'][i % 5] ?? '#f2d29b') as string,
                  };
                  return (
                  <button key={c.id} onClick={() => { setUserRoleFilter(c.id); goUserPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${userRoleFilter === c.id ? 'text-[#0d0b09] font-semibold' : 'border-[#403521] text-[#b3a893] hover:text-[#f9e9c8]'}`}
                    style={userRoleFilter === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: userRoleFilter === c.id ? '#0d0b09' : c.color }} /> {c.name}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* ── Tabla premium ── */}
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#403521] bg-[#0d0b09]/60">
                    {['Usuario', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                      <th key={h} className="text-left text-[#b3a893] font-mono text-[11px] uppercase tracking-widest py-3.5 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userRows.map(u => {
                    const role = roleOf(u.role);
                    const initials = u.name.split(' ').map(w => w[0]).slice(0, 2).join('');
                    return (
                      <tr key={u.id} className="border-b border-[#403521]/60 last:border-0 hover:bg-[#f2d29b]/[0.04] transition-colors group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border"
                              style={{ background: `${role.color}14`, borderColor: `${role.color}40`, color: role.color }}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif text-[#faf7f0] leading-tight truncate">{u.name}</p>
                              <p className="text-[#6b6355] text-[11px] font-mono truncate">{u.email}</p>
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
                        <td className="py-3.5 px-5 text-[#b3a893] text-xs font-mono whitespace-nowrap">{u.lastLogin}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Can code="usuarios.update">
                              <button title="Editar" onClick={() => openEditUser(u)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 border border-transparent hover:border-[#f2d29b]/30 transition-all"><Edit3 size={14} /></button>
                            </Can>
                            <Can code="usuarios.delete">
                              <button title="Eliminar" onClick={() => { setDeleteUserError(''); setDeleteUserModal({ open: true, id: u.id }); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#b3a893] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 border border-transparent hover:border-[#d4613a]/30 transition-all"><Trash2 size={14} /></button>
                            </Can>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {userRows.length === 0 && (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <Shield size={26} className="mx-auto text-[#403521] mb-3" />
                      <p className="font-serif text-[#b3a893] text-lg">Sin usuarios con esos filtros</p>
                      <button onClick={() => { setSearchUser(''); setUserRoleFilter('all'); goUserPage(1); }}
                        className="mt-4 px-4 py-2 border border-[#f2d29b]/40 text-[#f2d29b] text-xs rounded-lg hover:bg-[#f2d29b]/10 transition-colors">
                        Limpiar filtros
                      </button>
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
            <Pagination page={userPage} total={userTotalPages} onChange={goUserPage} count={serverUserTotal} pageSize={6} showNumbers={false} />
            </>
            )}

            {/* Con servidor: panel real (asignar/retirar). Sin servidor: vista local de referencia. Nunca ambos. */}
            {usersSubtab === 'roles' && onlineRbac && (
              <ServerRolesPanel
                roles={serverRolesQuery.data ?? []}
                permissions={serverPermsQuery.data ?? []}
                activeRoleId={fallbackRoleId}
                onSelect={setServerRoleId}
                rolePerms={serverRolePerms.data ?? []}
                permsLoading={serverRolePerms.isLoading}
                onAssign={(r) => openAssignPerms(r)}
                onEdit={(r) => openEditRole(r)}
              />
            )}
            {usersSubtab === 'roles' && onlineRbac && (() => {
              const active = (serverRolesQuery.data ?? []).find(r => r.id === fallbackRoleId);
              if (!active || active.is_system) return null;
              return (
                <Can code="roles.update">
                  <button onClick={() => setDeleteRoleModal({ open: true, id: active.id, name: active.name })}
                    className="flex items-center gap-2 px-4 py-2 border border-[#d4613a]/40 text-[#e08a6d] text-xs rounded-xl hover:bg-[#d4613a]/10 active:scale-[0.98] transition-[transform,background-color] duration-150 w-fit">
                    <Trash2 size={13} /> Eliminar rol {active.name}
                  </button>
                </Can>
              );
            })()}
            {usersSubtab === 'roles' && !onlineRbac && !(serverRolesQuery.isLoading || serverPermsQuery.isLoading) && (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <Shield size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#faf7f0] text-lg">Roles no disponibles sin conexión</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">Los roles y permisos viven en el servidor.</p>
                <button onClick={() => { void serverRolesQuery.refetch(); void serverPermsQuery.refetch(); }}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            )}
            {usersSubtab === 'roles' && !onlineRbac && (serverRolesQuery.isLoading || serverPermsQuery.isLoading) && (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando roles…</p>
              </div>
            )}
          </div>
        )}
        {tab === 'users' && usersSubtab === 'permissions' && !onlineRbac && !(serverPermsQuery.isLoading) && (
          <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
            <Key size={28} className="mx-auto text-[#403521] mb-3" />
            <p className="font-serif text-[#faf7f0] text-lg">Permisos no disponibles sin conexión</p>
            <p className="text-[#b3a893] text-xs mt-1 font-mono">El catálogo vive en el servidor.</p>
            <button onClick={() => void serverPermsQuery.refetch()}
              className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
              Reintentar
            </button>
          </div>
        )}
        {tab === 'users' && usersSubtab === 'permissions' && (onlineRbac || serverPermsQuery.isLoading) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[#b3a893] text-xs leading-relaxed max-w-[60ch]">
                Catálogo completo de permisos del sistema, agrupados por módulo.
                Para asignarlos a un rol usa <span className="text-[#f2d29b]">Roles → Nuevo rol</span> o
                el botón <span className="text-[#f2d29b]">Asignar</span> dentro de cada tarjeta de rol.
              </p>
              <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25 w-fit">● Servidor</span>
            </div>
            {(() => {
              const perms = (serverPermsQuery.data ?? []).map(p => ({ id: String(p.id), code: p.code, label: p.name }))
                .map(p => ({ ...p, mod: p.code.split('.')[0] ?? 'otros' }));
              const totalPages = Math.max(1, Math.ceil(perms.length / PERM_PAGE_SIZE));
              const page = Math.min(permPage, totalPages);
              const start = (page - 1) * PERM_PAGE_SIZE;
              const rows = perms.slice(start, start + PERM_PAGE_SIZE);
              return (
                <>
                  <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
                    {rows.map((p, i) => {
                      const prevMod = start + i > 0 ? perms[start + i - 1].mod : null;
                      return (
                        <div key={p.id}>
                          {p.mod !== prevMod && (
                            <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest mb-2 mt-4 first:mt-0 flex items-center gap-2">
                              <Key size={10} /> {p.mod}
                            </p>
                          )}
                          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#403521]/70 bg-[#0d0b09]/60 text-xs text-[#b3a893] mb-2 last:mb-0">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#332a1d] text-[#f2d29b]">
                              <Key size={10} />
                            </span>
                            <span><span className="font-mono text-[#f9e9c8]">{p.code}</span> · {p.label}</span>
                          </div>
                        </div>
                      );
                    })}
                    {rows.length === 0 && (
                      <p className="text-[#6b6355] text-xs text-center py-6">Sin permisos todavía.</p>
                    )}
                  </div>
                  <Pagination page={page} total={totalPages} onChange={setPermPage} count={perms.length} pageSize={PERM_PAGE_SIZE} showNumbers={false} />
                </>
              );
            })()}
          </div>
        )}
        {tab === 'giftcards' && (
          <div className="space-y-4">
            {/* ── Barra compacta ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
                {([
                  { id: 'all', label: `Todas (${gcTotal})` },
                  { id: 'active', label: `Activas (${gcSource.filter(g => !g.used).length})` },
                  { id: 'used', label: `Canjeadas (${gcSource.filter(g => g.used).length})` },
                ] as const).map(f => (
                  <button key={f.id} onClick={() => setGcFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${gcFilter === f.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineGc ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Local</span>
                )}
                <Can code="giftcards.create">
                  <button onClick={() => setAddGcModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-xl hover:bg-[#f7ddab] shadow-[0_4px_20px_rgba(242,210,155,0.25)] transition-all w-fit">
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
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Buscador ── */}
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355]" />
                <input
                  value={searchGc}
                  onChange={e => setSearchGc(e.target.value)}
                  placeholder="Buscar por código o comprador…"
                  className="pl-10 pr-4 py-2.5 bg-[#0d0b09] border border-[#403521] rounded-xl text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 w-full md:w-72 transition-all"
                />
              </div>
              <p className="text-[#b3a893] text-xs font-mono">{filteredGcs.length} resultado(s)</p>
            </div>

            {serverGcQuery.isLoading ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando gift cards…</p>
              </div>
            ) : filteredGcs.length === 0 ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <Gift size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">Sin gift cards con esos filtros</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button onClick={() => { setSearchGc(''); setGcFilter('all'); }}
                    className="px-4 py-2 border border-[#403521] text-[#b3a893] text-xs rounded-lg hover:border-[#b3a893] transition-colors">
                    Limpiar
                  </button>
                  <button onClick={() => setAddGcModal(true)}
                    className="px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                    Crear la primera
                  </button>
                </div>
              </div>
                        ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGcs.map(g => (                  <div key={g.code} className={`relative rounded-2xl border p-5 overflow-hidden transition-all group ${g.used ? 'bg-[#141110] border-[#403521] opacity-70' : 'bg-[#14110c] border-[#f2d29b]/30 hover:border-[#f2d29b]/55 hover:shadow-[0_8px_36px_rgba(242,210,155,0.12)]'}`}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: g.used ? '#403521' : 'linear-gradient(90deg,#a37c42,#f9e9c8,#a37c42)' }} />
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${g.used ? 'text-[#6b6355] border-[#403521]' : 'text-[#f9e9c8] border-[#f2d29b]/30 bg-[#f2d29b]/10'}`}>
                        <Gift size={16} />
                      </div>
                      <Can code="giftcards.update">
                        <button onClick={() => toggleGcUsed(g.code)} title={g.used ? 'Reactivar' : 'Marcar canjeada'}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${g.used ? 'bg-[#332a1d] text-[#b3a893] border-[#403521] hover:border-[#b3a893]' : 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/30 hover:bg-[#8aab8a]/20'}`}>
                          {g.used ? 'Canjeada' : '● Activa'}
                        </button>
                      </Can>
                    </div>
                    <p className={`font-serif leading-none ${g.used ? 'text-[#b3a893]' : 'text-gradient'}`} style={{ fontSize: '2.1rem' }}>₡{g.amount.toLocaleString()}</p>
                    <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest mt-1">Gift card · Nails Studio</p>
                    <button onClick={() => copyGc(g.code)}
                      className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0d0b09] border border-dashed border-[#403521] hover:border-[#f2d29b]/50 transition-colors group/code">
                      <span className="font-mono text-[#f9e9c8] text-xs tracking-widest">{g.code}</span>
                      <span className="text-[#b3a893] group-hover/code:text-[#f2d29b] transition-colors flex items-center gap-1 text-[11px]">
                        {copiedCode === g.code ? <><Check size={11} /> ¡Copiado!</> : <><Copy size={11} /> Copiar</>}
                      </span>
                    </button>
                    <div className="flex justify-between text-xs mt-3">
                      <span className="text-[#b3a893]">De: <span className="text-[#faf7f0]">{g.buyer}</span></span>
                      {g.recipient ? <span className="text-[#b3a893]">Para: <span className="text-[#f9e9c8]">{g.recipient}</span></span> : <span className="text-[#6b6355]">{g.created}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Can code="giftcards.update">
                        <button onClick={() => toggleGcUsed(g.code)}
                          className="flex-1 py-2 text-xs rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 transition-all">
                          {g.used ? 'Reactivar' : 'Marcar canjeada'}
                        </button>
                      </Can>
                      <Can code="giftcards.update">
                        <button onClick={() => openEditGc(g)} title="Editar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 hover:border-[#f2d29b]/30 transition-all">
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can code="giftcards.delete">
                        <button onClick={() => setDeleteGcModal({ open: true, code: g.code })} title="Eliminar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
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
        {tab === 'referidos' && (
          <div className="space-y-4">
            <Can code="referidos.update">
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg text-[#faf7f0]">Contenido del programa</h3>
                    <p className="text-[#b3a893] text-xs mt-0.5">Lo que ven las clientas en la página pública de Referidos.</p>
                  </div>
                  <button onClick={handleSaveRefInfo} disabled={updateRefMut.isPending || !onlineRef}
                    className="px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] disabled:opacity-60 transition-colors w-fit">
                    {updateRefMut.isPending ? 'Guardando…' : 'Guardar contenido'}
                  </button>
                </div>
                {!onlineRef ? (
                  <p className="text-[#b3a893] text-xs font-mono">Sin conexión: el contenido se edita con servidor.</p>
                ) : (
                  <div className="space-y-3">
                    <input
                      value={refTitle}
                      onChange={e => setRefTitle(e.target.value)}
                      placeholder="Título del programa"
                      maxLength={120}
                      className="w-full bg-[#0d0b09] border border-[#403521] rounded-xl px-4 py-2.5 text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 transition-colors"
                    />
                    <input
                      value={refSubtitle}
                      onChange={e => setRefSubtitle(e.target.value)}
                      placeholder="Subtítulo"
                      maxLength={300}
                      className="w-full bg-[#0d0b09] border border-[#403521] rounded-xl px-4 py-2.5 text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 transition-colors"
                    />
                    {refSteps.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-mono text-[#f2d29b] text-xs w-6 shrink-0 pt-3">{String(i + 1).padStart(2, '0')}</span>
                        <input
                          value={s}
                          onChange={e => setRefSteps(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                          placeholder={`Paso ${i + 1}`}
                          maxLength={300}
                          className="flex-1 bg-[#0d0b09] border border-[#403521] rounded-xl px-4 py-2.5 text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 transition-colors"
                        />
                        {refSteps.length > 1 ? (
                          <button onClick={() => setRefSteps(prev => prev.filter((_, j) => j !== i))} title="Quitar paso"
                            className="w-10 shrink-0 rounded-xl border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 transition-all">×</button>
                        ) : null}
                      </div>
                    ))}
                    {refSteps.length < 8 ? (
                      <button onClick={() => setRefSteps(prev => [...prev, ''])}
                        className="text-xs text-[#f2d29b] hover:underline w-fit">+ Agregar paso</button>
                    ) : null}
                    {refError ? <p role="alert" className="text-[#e08a6d] text-xs">{refError}</p> : null}
                    {updateRefMut.isSuccess ? <p className="text-[#8aab8a] text-xs">Guardado ✓</p> : null}
                  </div>
                )}
              </div>
            </Can>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-[#faf7f0]">Referidos · Lealtad</h2>
                <p className="text-[#b3a893] text-xs mt-0.5">Gift cards generadas por el programa (solo mantenimiento: canjear, editar, eliminar).</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
                  {([
                    { id: 'all', label: `Todas (${refTotal})` },
                    { id: 'active', label: `Activas (${refItems.filter(g => !g.used).length})` },
                    { id: 'used', label: `Canjeadas (${refItems.filter(g => g.used).length})` },
                  ] as const).map(f => (
                    <button key={f.id} onClick={() => setRefFilter(f.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${refFilter === f.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {onlineRef ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Sin conexión</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Emitidas', value: String(refTotal), sub: 'por referidos' },
                { label: 'Valor activo', value: `₡${refActiveValue.toLocaleString()}`, sub: 'por canjear' },
                { label: 'Valor canjeado', value: `₡${refUsedValue.toLocaleString()}`, sub: 'ingreso realizado' },
              ].map(k => (
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355]" />
                <input
                  value={searchRef}
                  onChange={e => setSearchRef(e.target.value)}
                  placeholder="Buscar por código o comprador…"
                  className="pl-10 pr-4 py-2.5 bg-[#0d0b09] border border-[#403521] rounded-xl text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 w-full md:w-72 transition-all"
                />
              </div>
              <p className="text-[#b3a893] text-xs font-mono">{refItems.length} resultado(s)</p>
            </div>
            {serverRefQuery.isLoading ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando referidos…</p>
              </div>
            ) : serverRefQuery.isError || !onlineRef ? (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <p className="font-serif text-[#faf7f0] text-lg">Sin conexión con el servidor</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">Las gift cards de referidos viven en el servidor.</p>
                <button onClick={() => void serverRefQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : refItems.length === 0 ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <Gift size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">Sin gift cards de referidos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {refItems.map(g => (
                  <div key={g.code} className={`relative rounded-2xl border p-5 overflow-hidden transition-all group ${g.used ? 'bg-[#141110] border-[#403521] opacity-70' : 'bg-[#14110c] border-[#f2d29b]/30 hover:border-[#f2d29b]/55 hover:shadow-[0_8px_36px_rgba(242,210,155,0.12)]'}`}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: g.used ? '#403521' : 'linear-gradient(90deg,#a37c42,#f9e9c8,#a37c42)' }} />
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${g.used ? 'text-[#6b6355] border-[#403521]' : 'text-[#f9e9c8] border-[#f2d29b]/30 bg-[#f2d29b]/10'}`}>
                        <Share2 size={16} />
                      </div>
                      <Can code="giftcards.update">
                        <button onClick={() => toggleGcUsed(g.code)} title={g.used ? 'Reactivar' : 'Marcar canjeada'}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${g.used ? 'bg-[#332a1d] text-[#b3a893] border-[#403521] hover:border-[#b3a893]' : 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/30 hover:bg-[#8aab8a]/20'}`}>
                          {g.used ? 'Canjeada' : '● Activa'}
                        </button>
                      </Can>
                    </div>
                    <p className={`font-serif leading-none ${g.used ? 'text-[#b3a893]' : 'text-gradient'}`} style={{ fontSize: '2.1rem' }}>₡{g.amount.toLocaleString()}</p>
                    <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest mt-1">Referido · Lealtad</p>
                    <button onClick={() => copyGc(g.code)}
                      className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0d0b09] border border-dashed border-[#403521] hover:border-[#f2d29b]/50 transition-colors group/code">
                      <span className="font-mono text-[#f9e9c8] text-xs tracking-widest">{g.code}</span>
                      <span className="text-[#b3a893] group-hover/code:text-[#f2d29b] transition-colors flex items-center gap-1 text-[11px]">
                        {copiedCode === g.code ? <><Check size={11} /> ¡Copiado!</> : <><Copy size={11} /> Copiar</>}
                      </span>
                    </button>
                    <div className="flex justify-between text-xs mt-3">
                      <span className="text-[#b3a893]">De: <span className="text-[#faf7f0]">{g.buyer}</span></span>
                      {g.recipient ? <span className="text-[#b3a893]">Para: <span className="text-[#f9e9c8]">{g.recipient}</span></span> : <span className="text-[#6b6355]">Lealtad</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Can code="giftcards.update">
                        <button onClick={() => toggleGcUsed(g.code)}
                          className="flex-1 py-2 text-xs rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 transition-all">
                          {g.used ? 'Reactivar' : 'Marcar canjeada'}
                        </button>
                      </Can>
                      <Can code="giftcards.update">
                        <button onClick={() => openEditGc(g)} title="Editar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 hover:border-[#f2d29b]/30 transition-all">
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can code="giftcards.delete">
                        <button onClick={() => setDeleteGcModal({ open: true, code: g.code })} title="Eliminar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
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
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
                {([
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'published', label: 'Publicadas' },
                ] as const).map(f => (
                  <button key={f.id} onClick={() => switchReviewFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${reviewFilter === f.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineReviews ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Sin conexión</span>
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
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Estados: loading / error ── */}
            {reviewsQuery.isLoading ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando reseñas…</p>
              </div>
            ) : reviewsQuery.isError ? (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <p className="font-serif text-[#faf7f0] text-lg">No se pudieron cargar las reseñas</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">{(reviewsQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                <button onClick={() => void reviewsQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : reviewItems.length === 0 ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center px-6">
                <Star size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">
                  {reviewFilter === 'pending' ? 'Sin reseñas pendientes' : 'Sin reseñas publicadas'}
                </p>
                <p className="text-[#6b6355] text-xs mt-1">
                  {reviewFilter === 'pending'
                    ? 'Las reseñas del formulario público aparecerán aquí para moderar.'
                    : 'Aprueba una reseña pendiente para verla aquí y en el sitio.'}
                </p>
                <button onClick={() => switchReviewFilter(reviewFilter === 'pending' ? 'published' : 'pending')}
                  className="mt-4 px-4 py-2 border border-[#403521] text-[#b3a893] text-xs rounded-lg hover:border-[#b3a893] transition-colors">
                  Ver {reviewFilter === 'pending' ? 'publicadas' : 'pendientes'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {reviewItems.map(p => (
                  <div key={p.id} className="relative rounded-2xl border border-[#403521] bg-[#14110c] p-5 overflow-hidden transition-all hover:border-[#f2d29b]/40">
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #f2d29b, transparent)' }} />
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border border-[#f2d29b]/40 text-[#f9e9c8]"
                        style={{ background: 'linear-gradient(135deg,#2a2013,#120e0a)' }}>
                        {(p.author ?? p.title ?? '?')[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#faf7f0] text-sm font-medium truncate">{p.author ?? p.title ?? 'Anónima'}</p>
                        <div className="flex items-center gap-0.5 mt-1" aria-label={`Calificación ${p.rating ?? 0} de 5`}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={12} className={(p.rating ?? 0) >= n ? 'fill-[#f2d29b] text-[#f2d29b]' : 'text-[#6b6355]'} />
                          ))}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 ${reviewFilter === 'pending' ? 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/30' : 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25'}`}>
                        {reviewFilter === 'pending' ? 'Pendiente' : 'Publicada'}
                      </span>
                    </div>
                    <p className="text-[#b3a893] text-sm leading-relaxed line-clamp-4 min-h-[3.5rem]">{p.excerpt ?? '—'}</p>
                    {p.design_name && (
                      <p className="text-[#f2d29b]/80 text-xs mt-2 font-mono truncate">Diseño: {p.design_name}</p>
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
                            className="flex-1 py-2 text-xs rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 disabled:opacity-50 transition-all">
                            Ocultar
                          </button>
                        )}
                      </Can>
                      <Can code="blog.update">
                        <button onClick={() => openEditReview(p)} title="Editar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 hover:border-[#f2d29b]/30 transition-all">
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can code="blog.delete">
                        <button onClick={() => setDeleteReviewModal({ open: true, id: p.id, name: p.author ?? p.title ?? `Reseña #${p.id}` })} title="Eliminar"
                          className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={reviewPage} total={reviewTotalPages} onChange={goReviewPage} count={reviewTotal} pageSize={REVIEW_PAGE_SIZE} showNumbers={false} />
          </div>
        )}
        {tab === 'blog' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit max-w-full overflow-x-auto">
                {([
                  { id: 'posts', label: `Artículos${blogFilter === 'published' ? ` (${blogTotal})` : ''}` },
                  { id: 'categories', label: `Categorías${blogCats.length ? ` (${blogCats.length})` : ''}` },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setBlogSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${blogSubtab === t.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineBlog ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Sin conexión</span>
                )}
                {blogSubtab === 'posts' && (
                  <Can code="blog.create">
                    <button onClick={() => { setNewBlogError(''); setAddBlogOpen(true); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-xl hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150">
                      <Plus size={13} /> Nuevo artículo
                    </button>
                  </Can>
                )}
              </div>
            </div>

            {blogSubtab === 'posts' && (
            <div className="space-y-4">
            <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
              {([
                { id: 'published', label: 'Publicados' },
                { id: 'draft', label: 'Borradores' },
              ] as const).map(f => (
                <button key={f.id} onClick={() => switchBlogFilter(f.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${blogFilter === f.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: blogFilter === 'published' ? 'Publicados' : 'Borradores', value: String(blogTotal), sub: blogFilter === 'published' ? 'visibles en el blog' : 'pendientes de publicar' },
                { label: 'En esta página', value: String(blogItems.length), sub: `página ${blogPage} de ${blogTotalPages}` },
                { label: 'Lectura prom.', value: blogItems.length ? `${Math.round(blogItems.reduce((a, p) => a + (p.read_minutes ?? 4), 0) / blogItems.length)} min` : '—', sub: 'promedio por artículo' },
              ].map(k => (
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Estados: loading / error ── */}
            {blogQuery.isLoading ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando blog…</p>
              </div>
            ) : blogQuery.isError ? (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <p className="font-serif text-[#faf7f0] text-lg">No se pudieron cargar los artículos</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">{(blogQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                <button onClick={() => void blogQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : blogItems.length === 0 ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center px-6">
                <BookOpen size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">
                  {blogFilter === 'published' ? 'Sin artículos publicados' : 'Sin borradores'}
                </p>
                <p className="text-[#6b6355] text-xs mt-1">
                  {blogFilter === 'published'
                    ? 'Crea tu primer tip de uñas con Nuevo artículo.'
                    : 'Los artículos nuevos se guardan aquí hasta publicarlos.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {blogItems.map(p => (
                  <div key={p.id} className="relative rounded-2xl border border-[#403521] bg-[#14110c] overflow-hidden transition-all hover:border-[#f2d29b]/40">
                    <div className="absolute top-0 left-0 right-0 h-[3px] z-10" style={{ background: 'linear-gradient(90deg, transparent, #f2d29b, transparent)' }} />
                    {resolveImageUrl(p.image_url) ? (
                      <div className="aspect-[16/9] overflow-hidden bg-[#0d0b09]">
                        <img src={resolveImageUrl(p.image_url) ?? ''} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#332a1d] text-[#f2d29b] text-[11px] rounded font-mono">{p.category}</span>
                        <span className="text-[#6b6355] text-[11px] font-mono flex items-center gap-1"><Clock size={10} /> {p.read_minutes} min</span>
                        <span className={`ml-auto text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 ${blogFilter === 'published' ? 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' : 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/30'}`}>
                          {blogFilter === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <p className="font-serif text-[#faf7f0] leading-snug">{p.title}</p>
                      <p className="text-[#b3a893] text-sm leading-relaxed line-clamp-3 mt-1.5 min-h-[3rem]">{p.excerpt ?? p.body ?? '—'}</p>
                      {p.author && (
                        <p className="text-[#6b6355] text-xs mt-2 font-mono truncate">Por {p.author}</p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Can code="blog.update">
                          {blogFilter === 'published' ? (
                            <button onClick={() => publishMut.mutate({ id: p.id, published: false })} disabled={publishMut.isPending}
                              className="flex-1 py-2 text-xs rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 disabled:opacity-50 transition-all">
                              Ocultar
                            </button>
                          ) : (
                            <button onClick={() => publishMut.mutate({ id: p.id, published: true })} disabled={publishMut.isPending}
                              className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#8aab8a]/15 border border-[#8aab8a]/30 text-[#8aab8a] hover:bg-[#8aab8a]/25 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
                              <Check size={13} /> Publicar
                            </button>
                          )}
                        </Can>
                        <Can code="blog.update">
                          <button onClick={() => openEditBlog(p)} title="Editar"
                            className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 hover:border-[#f2d29b]/30 transition-all">
                            <Edit3 size={14} />
                          </button>
                        </Can>
                        <Can code="blog.delete">
                          <button onClick={() => setDeleteBlogModal({ open: true, id: p.id, name: p.title })} title="Eliminar"
                            className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </Can>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={blogPage} total={blogTotalPages} onChange={goBlogPage} count={blogTotal} pageSize={BLOG_PAGE_SIZE} showNumbers={false} />
            </div>
            )}

            {blogSubtab === 'categories' && (
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <p className="font-serif text-lg text-[#faf7f0]">Categorías</p>
                  <p className="text-[#6b6355] text-xs mt-0.5">Se asocian a los artículos al crearlos o editarlos.</p>
                </div>
                <Can code="blog.create">
                  <button onClick={() => { setNewBlogCatError(''); setNewBlogCat(''); setAddBlogCatOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-xl hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150 shrink-0">
                    <Plus size={13} /> Nueva
                  </button>
                </Can>
              </div>
              {blogCatsQuery.isLoading ? (
                <p className="font-mono text-[#b3a893] text-[11px] animate-pulse py-4">Cargando categorías…</p>
              ) : blogCatsQuery.isError ? (
                <p className="text-[#e08a6d] text-xs py-4">No se pudieron cargar: {(blogCatsQuery.error as Error)?.message}</p>
              ) : blogCats.length === 0 ? (
                <p className="text-[#6b6355] text-xs py-4">Sin categorías todavía. Crea la primera (ej. Tips, Tendencias).</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-3">
                  {blogCats.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-[#332a1d] border border-[#403521] text-xs text-[#faf7f0]">
                      {c.name}
                      <Can code="blog.update">
                        <button onClick={() => openEditBlogCat(c)} title={`Renombrar ${c.name}`}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 transition-all">
                          <Edit3 size={12} />
                        </button>
                      </Can>
                      <Can code="blog.delete">
                        <button onClick={() => { setDeleteBlogCatError(''); setDeleteBlogCatModal({ open: true, id: c.id, name: c.name }); }} title={`Eliminar ${c.name}`}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </Can>
                    </span>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        )}
        {tab === 'nosotros' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
                {([
                  { id: 'published', label: 'Publicados' },
                  { id: 'draft', label: 'Borradores' },
                ] as const).map(f => (
                  <button key={f.id} onClick={() => switchNosFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${nosFilter === f.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineNos ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Sin conexión</span>
                )}
                <Can code="blog.create">
                  <button onClick={() => { setNewNosError(''); setAddNosOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-xl hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150">
                    <Plus size={13} /> Nueva sección
                  </button>
                </Can>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: nosFilter === 'published' ? 'Publicadas' : 'Borradores', value: String(nosTotal), sub: 'secciones de Nosotros' },
                { label: 'En esta página', value: String(nosItems.length), sub: `página ${nosPage} de ${nosTotalPages}` },
                { label: 'Categorías', value: String(new Set(nosItems.map(p => p.category)).size), sub: 'historia / valores / equipo' },
              ].map(k => (
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {nosQuery.isLoading ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando nosotros…</p>
              </div>
            ) : nosQuery.isError ? (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <p className="font-serif text-[#faf7f0] text-lg">No se pudieron cargar las secciones</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">{(nosQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                <button onClick={() => void nosQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : nosItems.length === 0 ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center px-6">
                <Heart size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">
                  {nosFilter === 'published' ? 'Sin secciones publicadas' : 'Sin borradores'}
                </p>
                <p className="text-[#6b6355] text-xs mt-1">
                  Crea Historia, Valores o Equipo con Nueva sección. Usa la categoría para ordenarlas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {nosItems.map(p => (
                  <div key={p.id} className="relative rounded-2xl border border-[#403521] bg-[#14110c] overflow-hidden transition-all hover:border-[#f2d29b]/40">
                    <div className="absolute top-0 left-0 right-0 h-[3px] z-10" style={{ background: 'linear-gradient(90deg, transparent, #f2d29b, transparent)' }} />
                    {resolveImageUrl(p.image_url) ? (
                      <div className="aspect-[16/9] overflow-hidden bg-[#0d0b09]">
                        <img src={resolveImageUrl(p.image_url) ?? ''} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#332a1d] text-[#f2d29b] text-[11px] rounded font-mono">{p.category}</span>
                        <span className={`ml-auto text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 ${nosFilter === 'published' ? 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' : 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/30'}`}>
                          {nosFilter === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <p className="font-serif text-[#faf7f0] leading-snug">{p.title}</p>
                      <p className="text-[#b3a893] text-sm leading-relaxed line-clamp-3 mt-1.5 min-h-[3rem]">{p.excerpt ?? p.body ?? '—'}</p>
                      <div className="flex gap-2 mt-4">
                        <Can code="blog.update">
                          {nosFilter === 'published' ? (
                            <button onClick={() => publishMut.mutate({ id: p.id, published: false })} disabled={publishMut.isPending}
                              className="flex-1 py-2 text-xs rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#f2d29b]/40 disabled:opacity-50 transition-all">
                              Ocultar
                            </button>
                          ) : (
                            <button onClick={() => publishMut.mutate({ id: p.id, published: true })} disabled={publishMut.isPending}
                              className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#8aab8a]/15 border border-[#8aab8a]/30 text-[#8aab8a] hover:bg-[#8aab8a]/25 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
                              <Check size={13} /> Publicar
                            </button>
                          )}
                        </Can>
                        <Can code="blog.update">
                          <button onClick={() => openEditNos(p)} title="Editar"
                            className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 hover:border-[#f2d29b]/30 transition-all">
                            <Edit3 size={14} />
                          </button>
                        </Can>
                        <Can code="blog.delete">
                          <button onClick={() => setDeleteNosModal({ open: true, id: p.id, name: p.title })} title="Eliminar"
                            className="w-10 flex items-center justify-center rounded-xl border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </Can>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={nosPage} total={nosTotalPages} onChange={goNosPage} count={nosTotal} pageSize={NOS_PAGE_SIZE} showNumbers={false} />
          </div>
        )}
        {tab === 'contacto' && (
          <div className="space-y-4">
            {/* ── Subtabs: mensajes / redes / datos ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit max-w-full overflow-x-auto">
                {([
                  { id: 'messages', label: `Mensajes${unreadCount ? ` (${unreadCount})` : ''}` },
                  { id: 'socials', label: `Redes sociales${socialItems.length ? ` (${socialItems.length})` : ''}` },
                  { id: 'info', label: 'Datos' },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setContactSubtab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${contactSubtab === t.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {onlineMsgs ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#8aab8a]/10 text-[#8aab8a] border border-[#8aab8a]/25">● Servidor</span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-2 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">○ Sin conexión</span>
                )}
              </div>
            </div>

            {contactSubtab === 'messages' && (
            <div className="space-y-4">
            {/* ── Filtro: todos / no leídos ── */}
            <div className="inline-flex p-1 rounded-xl bg-[#14110c] border border-[#403521] w-fit">
              {([
                { id: 'all', label: 'Todos' },
                { id: 'unread', label: `No leídos${unreadCount ? ` (${unreadCount})` : ''}` },
              ] as const).map(f => (
                <button key={f.id} onClick={() => switchMsgFilter(f.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${msgFilter === f.id ? 'bg-[#f2d29b] text-[#0d0b09]' : 'text-[#b3a893] hover:text-[#f9e9c8]'}`}>
                  {f.label}
                </button>
              ))}
            </div>



            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Mensajes', value: String(msgTotal), sub: msgFilter === 'unread' ? 'sin leer' : 'recibidos del formulario' },
                { label: 'En esta página', value: String(msgItems.length), sub: `página ${msgPage} de ${msgTotalPages}` },
                { label: 'Sin leer (página)', value: String(unreadCount), sub: 'pendientes de responder' },
              ].map(k => (
                <div key={k.label} className="bg-[#14110c] border border-[#403521] rounded-2xl px-5 py-4">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{k.label}</p>
                  <p className="font-serif text-2xl text-[#faf7f0] mt-1">{k.value}</p>
                  <p className="text-[#f2d29b]/80 text-xs mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Buzón ── */}
            {msgsQuery.isLoading ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center">
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando mensajes…</p>
              </div>
            ) : msgsQuery.isError ? (
              <div role="alert" className="bg-[#14110c] border border-[#d4613a]/30 rounded-2xl py-14 text-center px-6">
                <p className="font-serif text-[#faf7f0] text-lg">No se pudieron cargar los mensajes</p>
                <p className="text-[#b3a893] text-xs mt-1 font-mono">{(msgsQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                {(msgsQuery.error as ApiError)?.status === 403 && (
                  <p className="text-[#e08a6d] text-xs mt-3 leading-relaxed max-w-[52ch] mx-auto">
                    Tu rol no tiene permiso <span className="font-mono">contacto.read</span>. Pide a un ADMIN
                    que lo asigne en Roles → Asignar permisos (o que re-corra el seed del backend)
                    y luego cierra sesión y vuelve a entrar.
                  </p>
                )}
                <button onClick={() => void msgsQuery.refetch()}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : msgItems.length === 0 ? (
              <div className="bg-[#14110c] border border-[#403521] rounded-2xl py-14 text-center px-6">
                <Mail size={28} className="mx-auto text-[#403521] mb-3" />
                <p className="font-serif text-[#b3a893] text-lg">
                  {msgFilter === 'unread' ? 'Sin mensajes sin leer' : 'Sin mensajes todavía'}
                </p>
                <p className="text-[#6b6355] text-xs mt-1">
                  Los mensajes del formulario de Contacto llegarán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {msgItems.map(m => (
                  <div key={m.id} className={`rounded-2xl border bg-[#14110c] p-5 transition-all hover:border-[#f2d29b]/40 ${m.is_read ? 'border-[#403521]' : 'border-[#f2d29b]/40'}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm shrink-0 border border-[#f2d29b]/40 text-[#f9e9c8]"
                        style={{ background: 'linear-gradient(135deg,#2a2013,#120e0a)' }}>
                        {(m.name.trim()[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[#faf7f0] text-sm font-medium">{m.name}</p>
                          {!m.is_read && (
                            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#f2d29b]/15 text-[#f2d29b] border border-[#f2d29b]/30">Nuevo</span>
                          )}
                          <span className="text-[#6b6355] text-[11px] font-mono ml-auto">
                            {new Date(m.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#b3a893] text-xs mt-0.5 truncate">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
                        <p className="text-[#d8cfbf] text-sm leading-relaxed mt-2 whitespace-pre-line">{m.message}</p>
                        <div className="flex gap-2 mt-3">
                          <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: Nails Studio')}`}
                            className="px-3 py-1.5 text-xs rounded-lg border border-[#403521] text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 transition-all">
                            Responder
                          </a>
                          <Can code="contacto.update">
                            <button
                              onClick={() => markMsgMut.mutate({ id: m.id, is_read: !m.is_read })}
                              disabled={markMsgMut.isPending}
                              className="px-3 py-1.5 text-xs rounded-lg border border-[#403521] text-[#b3a893] hover:text-[#f9e9c8] hover:border-[#b3a893] disabled:opacity-50 transition-all">
                              {m.is_read ? 'Marcar no leído' : 'Marcar leído'}
                            </button>
                          </Can>
                          <Can code="contacto.delete">
                            <button onClick={() => setDeleteMsgModal({ open: true, id: m.id, name: m.name })}
                              className="ml-auto w-9 flex items-center justify-center rounded-lg border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all"
                              title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </Can>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={msgPage} total={msgTotalPages} onChange={goMsgPage} count={msgTotal} pageSize={MSG_PAGE_SIZE} showNumbers={false} />
            </div>
            )}

            {contactSubtab === 'info' && (
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
              {/* Datos de contacto */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="font-serif text-lg text-[#faf7f0]">Datos de contacto</p>
                  <p className="text-[#6b6355] text-xs mt-0.5">Lo que ve la página pública de Contacto.</p>
                </div>
                {adminInfoQuery.isLoading && (
                  <p className="font-mono text-[#b3a893] text-[11px] animate-pulse">Cargando…</p>
                )}
              </div>
              {adminInfoQuery.isError && !adminInfoQuery.data ? (
                <div role="alert" className="p-4 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded-xl text-xs leading-relaxed">
                  <p className="text-[#e08a6d] font-medium">No se pudieron cargar los datos: {(adminInfoQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                  {(adminInfoQuery.error as ApiError)?.status === 403 && (
                    <p className="text-[#b3a893] mt-2">
                      Tu rol no tiene permiso <span className="font-mono text-[#e08a6d]">contacto.read</span> (y
                      para guardar, <span className="font-mono text-[#e08a6d]">contacto.update</span>). Pide a un ADMIN
                      que lo asigne en Roles → Asignar permisos (o que re-corra el seed del backend)
                      y luego cierra sesión y vuelve a entrar para que tu token traiga los permisos nuevos.
                    </p>
                  )}
                  <button onClick={() => void adminInfoQuery.refetch()}
                    className="mt-3 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                    Reintentar
                  </button>
                </div>
              ) : (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Dirección</label>
                  <textarea value={infoForm.address} onChange={e => setInfoForm(f => ({ ...f, address: e.target.value }))}
                    rows={2} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Horario</label>
                  <textarea value={infoForm.schedule} onChange={e => setInfoForm(f => ({ ...f, schedule: e.target.value }))}
                    rows={2} className={inputCls} />
                </div>
              </div>
              {infoError && (
                <p role="alert" className="mt-3 p-3 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#e08a6d] text-xs">{infoError}</p>
              )}
              {infoSaved && (
                <p role="status" className="mt-3 p-3 bg-[#8aab8a]/10 border border-[#8aab8a]/30 rounded text-[#8aab8a] text-xs">Datos actualizados en el sitio.</p>
              )}
              <Can code="contacto.update">
                <button onClick={handleSaveInfo} disabled={updateInfoMut.isPending}
                  className="mt-4 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded-xl hover:bg-[#f7ddab] disabled:opacity-50 transition-all">
                  {updateInfoMut.isPending ? 'Guardando…' : 'Guardar datos'}
                </button>
              </Can>
              </>
              )}
            </div>
            )}
            {contactSubtab === 'socials' && (
            <div className="bg-[#14110c] border border-[#403521] rounded-2xl p-5 sm:p-6">
              {/* Redes sociales */}
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <p className="font-serif text-lg text-[#faf7f0]">Redes sociales</p>
                  <p className="text-[#6b6355] text-xs mt-0.5">Aparecen en la página pública de Contacto, debajo de Instagram.</p>
                </div>
                <Can code="contacto.update">
                  <button onClick={() => { setNewSocialError(''); setAddSocialOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-xl hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150 shrink-0">
                    <Plus size={13} /> Agregar
                  </button>
                </Can>
              </div>
              {socialsQuery.isLoading ? (
                <p className="font-mono text-[#b3a893] text-[11px] animate-pulse py-4">Cargando redes…</p>
              ) : socialsQuery.isError ? (
                <p className="text-[#e08a6d] text-xs py-4">No se pudieron cargar: {(socialsQuery.error as Error)?.message}</p>
              ) : socialItems.length === 0 ? (
                <p className="text-[#6b6355] text-xs py-4">Sin redes todavía. Agrega Facebook, TikTok, YouTube…</p>
              ) : (
                <div className="divide-y divide-[#403521]/60">
                  {socialItems.map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-full bg-[#332a1d] border border-[#f2d29b]/20 flex items-center justify-center shrink-0">
                        <SocialIcon icon={s.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#faf7f0] text-sm font-medium">{s.label}</p>
                        <p className="text-[#6b6355] text-xs font-mono truncate">{s.url}</p>
                      </div>
                      <Can code="contacto.update">
                        <button onClick={() => openEditSocial(s)} title="Editar"
                          className="w-9 flex items-center justify-center rounded-lg border border-transparent text-[#b3a893] hover:text-[#f2d29b] hover:bg-[#f2d29b]/10 hover:border-[#f2d29b]/30 transition-all">
                          <Edit3 size={14} />
                        </button>
                      </Can>
                      <Can code="contacto.delete">
                        <button onClick={() => setDeleteSocialModal({ open: true, id: s.id, name: s.label })} title="Eliminar"
                          className="w-9 flex items-center justify-center rounded-lg border border-transparent text-[#6b6355] hover:text-[#e08a6d] hover:bg-[#d4613a]/10 hover:border-[#d4613a]/30 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </Can>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={editDesign.name} onChange={e => setEditDesign(d => ({ ...d, name: e.target.value }))}
              placeholder="Ej. Botanical Nude" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Precio (₡) *</label>
              <input type="number" value={editDesign.price} onChange={e => setEditDesign(d => ({ ...d, price: e.target.value }))}
                placeholder="3500" className={inputCls} />
            </div>
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Duración (min)</label>
              <input type="number" value={editDesign.duration} onChange={e => setEditDesign(d => ({ ...d, duration: e.target.value }))}
                placeholder="90" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Imagen (URL)</label>
            <input value={editDesign.image} onChange={e => setEditDesign(d => ({ ...d, image: e.target.value }))}
              placeholder="https://…" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
            <input value={editDesign.description} onChange={e => setEditDesign(d => ({ ...d, description: e.target.value }))}
              placeholder="Detalle del diseño…" className={inputCls} />
          </div>
          {editDesignQuery.isLoading && (
            <p className="text-[#b3a893] text-xs font-mono animate-pulse">Cargando datos…</p>
          )}
      </EditModalShell>

      {/* Delete user */}
      <ConfirmDeleteModal
        open={deleteUserModal.open}
        onClose={() => { setDeleteUserModal({ open: false, id: null }); setDeleteUserError(''); }}
        title="Eliminar usuario"
        description="¿Eliminar este usuario? Perderá acceso inmediatamente."
        consequence="Solo ADMIN puede eliminar usuarios."
        error={deleteUserError || null}
        onConfirm={confirmDeleteUser}
        pending={deleteUserMut.isPending}
      />

      {/* Add user */}
      <EditModalShell
        open={addUserModal}
        onClose={() => setAddUserModal(false)}
        title="Nuevo usuario"
        eyebrow="Equipo · Nuevo"
        error={createUserMut.isError ? (createUserMut.error as Error).message : null}
        onSave={handleAddUser}
        saveLabel={createUserMut.isPending ? 'Creando…' : 'Crear usuario'}
        pending={createUserMut.isPending}
      >
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre completo</label>
            <input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
              placeholder="Ej. Gabriela Morales" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
              placeholder="usuario@nailsstudio.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Rol</label>
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
              className={inputCls}>
              {(serverRolesQuery.data ?? []).map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Contraseña inicial</label>
            <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres (requerida por el servidor)" className={inputCls} />
          </div>
      </EditModalShell>

      {/* Edit user */}
      <EditModalShell
        open={editUserId !== null}
        onClose={() => { setEditUserId(null); setEditUserError(''); setEditUserSaving(false); }}
        title="Editar usuario"
        eyebrow="Equipo · Editar"
        error={editUserError || null}
        onSave={handleSaveUser}
        saveLabel={editUserSaving ? 'Guardando…' : 'Guardar cambios'}
        pending={editUserSaving}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre completo *</label>
          <input value={editUser.name} onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))}
            placeholder="Ej. Gabriela Morales" maxLength={200} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Email *</label>
          <input type="email" value={editUser.email} onChange={e => setEditUser(u => ({ ...u, email: e.target.value }))}
            placeholder="usuario@nailsstudio.com" maxLength={255} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Rol</label>
            <select value={editUser.role} onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}
              className={inputCls}>
              {(serverRolesQuery.data ?? []).some(r => r.name.toLowerCase() === editUser.role.toLowerCase()) ? null : (
                <option value={editUser.role} disabled>Sin rol — elige uno</option>
              )}
              {(serverRolesQuery.data ?? []).map(r => <option key={r.id} value={r.name.toLowerCase()}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Estado</label>
            <button type="button" onClick={() => setEditUser(u => ({ ...u, active: !u.active }))}
              className={`w-full px-3 py-2.5 text-sm rounded border transition-all ${editUser.active ? 'bg-[#8aab8a]/10 text-[#8aab8a] border-[#8aab8a]/25' : 'bg-[#d4613a]/10 text-[#e08a6d] border-[#d4613a]/25'}`}>
              {editUser.active ? '● Activo' : '○ Inactivo'}
            </button>
          </div>
        </div>
      </EditModalShell>

      {/* Add role with permissions */}
      <EditModalShell
        open={addRoleOpen}
        onClose={() => { setAddRoleOpen(false); setNewRoleError(''); setNewRoleSaving(false); }}
        title="Nuevo rol"
        eyebrow="Equipo · Rol + permisos"
        error={newRoleError || null}
        onSave={handleCreateRole}
        saveLabel={newRoleSaving ? `Guardando… (${newRolePerms.length} permisos)` : `Guardar rol (${newRolePerms.length})`}
        pending={newRoleSaving}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
          <input value={newRole.name} onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))}
            placeholder="Ej. Cajera" maxLength={60} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
          <input value={newRole.description} onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))}
            placeholder="Ej. Cobra y agenda, sin catálogo" maxLength={200} className={inputCls} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest">Permisos ({newRolePerms.length}/{serverPermsQuery.data?.length ?? 0})</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setNewRolePerms((serverPermsQuery.data ?? []).map(p => p.id))}
                className="text-[11px] font-mono text-[#f2d29b] hover:underline">Asignar todos</button>
              <button type="button" onClick={() => setNewRolePerms([])}
                className="text-[11px] font-mono text-[#6b6355] hover:text-[#b3a893] hover:underline">Ninguno</button>
            </div>
          </div>
          {serverPermsQuery.isLoading ? (
            <p className="text-[#b3a893] text-xs font-mono animate-pulse">Cargando permisos…</p>
          ) : (() => {
            const groups = new Map<string, { id: number; code: string; name: string }[]>();
            for (const p of serverPermsQuery.data ?? []) {
              const mod = p.code.split('.')[0] ?? 'otros';
              if (!groups.has(mod)) groups.set(mod, []);
              groups.get(mod)?.push({ id: p.id, code: p.code, name: p.name });
            }
            return [...groups.entries()].map(([mod, list]) => {
              const ids = list.map(p => p.id);
              const allOn = ids.every(id => newRolePerms.includes(id));
              return (
                <div key={mod} className="mb-3 last:mb-0 rounded-xl border border-[#403521]/70 bg-[#0d0b09]/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">{mod} ({list.length})</p>
                    <button type="button"
                      onClick={() => setNewRolePerms(ps => allOn ? ps.filter(id => !ids.includes(id)) : [...new Set([...ps, ...ids])])}
                      className="text-[11px] font-mono text-[#f2d29b]/80 hover:text-[#f2d29b] hover:underline">
                      {allOn ? 'Quitar grupo' : 'Todo el grupo'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {list.map(p => {
                      const on = newRolePerms.includes(p.id);
                      return (
                        <button key={p.id} type="button" onClick={() => toggleNewRolePerm(p.id)} aria-pressed={on}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs text-left transition-all ${on ? 'bg-[#8aab8a]/[0.07] border-[#8aab8a]/25 text-[#c8d8c8]' : 'border-[#403521]/70 text-[#b3a893] hover:border-[#f2d29b]/40'}`}>
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${on ? 'bg-[#f2d29b] border-[#f2d29b] text-[#0d0b09]' : 'border-[#403521] text-transparent'}`}>
                            <Check size={12} />
                          </span>
                          <span><span className="font-mono">{p.code}</span> · {p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </EditModalShell>

      {/* Delete role */}
      <ConfirmDeleteModal
        open={deleteRoleModal.open}
        onClose={() => setDeleteRoleModal({ open: false, id: null, name: '' })}
        title="Eliminar rol"
        itemName={deleteRoleModal.name || undefined}
        description="¿Eliminar este rol? Los usuarios que lo tengan perderán esos permisos."
        consequence="No se pueden eliminar roles del sistema. Esta acción no se puede deshacer."
        onConfirm={confirmDeleteRole}
        pending={deleteRoleMut.isPending}
      />

      {/* Edit role */}
      <EditModalShell
        open={editRoleId !== null}
        onClose={() => { setEditRoleId(null); setEditRoleError(''); }}
        title="Editar rol"
        eyebrow="Equipo · Rol"
        error={editRoleError || null}
        onSave={handleSaveRole}
        pending={updateRoleMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
          <input value={editRole.name} onChange={e => setEditRole(r => ({ ...r, name: e.target.value }))}
            placeholder="Ej. Cajera" maxLength={100} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
          <input value={editRole.description} onChange={e => setEditRole(r => ({ ...r, description: e.target.value }))}
            placeholder="Ej. Cobra y agenda, sin catálogo" maxLength={500} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Assign permissions (modal aparte) */}
      <EditModalShell
        open={assignRole !== null}
        onClose={() => { setAssignRole(null); setAssignError(''); setAssignSaving(false); }}
        title={assignRole ? `Permisos · ${assignRole.name}` : 'Permisos'}
        eyebrow="Equipo · Asignar"
        error={assignError || null}
        onSave={handleSaveAssign}
        saveLabel={assignSaving ? `Guardando… (${assignChecked.length})` : `Guardar (${assignChecked.length})`}
        pending={assignSaving}
      >
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => setAssignChecked((serverPermsQuery.data ?? []).map(p => p.id))}
            className="text-[11px] font-mono text-[#f2d29b] hover:underline">Asignar todos</button>
          <button type="button" onClick={() => setAssignChecked([])}
            className="text-[11px] font-mono text-[#6b6355] hover:text-[#b3a893] hover:underline">Ninguno</button>
        </div>
        {serverPermsQuery.isLoading ? (
          <p className="text-[#b3a893] text-xs font-mono animate-pulse">Cargando permisos…</p>
        ) : (() => {
          const groups = new Map<string, { id: number; code: string; name: string }[]>();
          for (const p of serverPermsQuery.data ?? []) {
            const mod = p.code.split('.')[0] ?? 'otros';
            if (!groups.has(mod)) groups.set(mod, []);
            groups.get(mod)?.push({ id: p.id, code: p.code, name: p.name });
          }
          return [...groups.entries()].map(([mod, list]) => {
            const ids = list.map(p => p.id);
            const allOn = ids.every(id => assignChecked.includes(id));
            return (
              <div key={mod} className="mb-3 last:mb-0 rounded-xl border border-[#403521]/70 bg-[#0d0b09]/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">
                    {mod} ({ids.filter(id => assignChecked.includes(id)).length}/{list.length})
                  </p>
                  <button type="button"
                    onClick={() => setAssignChecked(ps => allOn ? ps.filter(id => !ids.includes(id)) : [...new Set([...ps, ...ids])])}
                    className="text-[11px] font-mono text-[#f2d29b]/80 hover:text-[#f2d29b] hover:underline">
                    {allOn ? 'Quitar grupo' : 'Todo el grupo'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {list.map(p => {
                    const on = assignChecked.includes(p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => toggleAssignPerm(p.id)} aria-pressed={on}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs text-left transition-all ${on ? 'bg-[#8aab8a]/[0.07] border-[#8aab8a]/25 text-[#c8d8c8]' : 'border-[#403521]/70 text-[#b3a893] hover:border-[#f2d29b]/40'}`}>
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${on ? 'bg-[#f2d29b] border-[#f2d29b] text-[#0d0b09]' : 'border-[#403521] text-transparent'}`}>
                          <Check size={12} />
                        </span>
                        <span><span className="font-mono">{p.code}</span> · {p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre del diseño</label>
            <input value={newDesign.name} onChange={e => setNewDesign(d => ({ ...d, name: e.target.value }))}
              placeholder="Ej. Botanical Nude" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría</label>
            <select value={newDesign.category} onChange={e => setNewDesign(d => ({ ...d, category: e.target.value }))}
              className={inputCls}>
              {effCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Precio (₡)</label>
              <input type="number" value={newDesign.price} onChange={e => setNewDesign(d => ({ ...d, price: e.target.value }))}
                placeholder="15000" className={inputCls} />
            </div>
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Duración (min)</label>
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre</label>
            <input value={newCategory.name} onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Pedicure Spa" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(Object.keys(CATEGORY_ICONS) as Array<keyof typeof CATEGORY_ICONS>).map(key => (
                  <button key={key} type="button" title={key} onClick={() => setNewCategory(c => ({ ...c, icon: key }))}
                    className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${newCategory.icon === key ? 'border-[#f2d29b] bg-[#f2d29b]/15 text-[#f9e9c8]' : 'border-[#403521] text-[#b3a893] hover:border-[#f2d29b]/50 hover:text-[#f9e9c8]'}`}>
                    <CategoryIcon name={key} size={15} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={newCategory.color} onChange={e => setNewCategory(c => ({ ...c, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#403521]" />
                <input value={newCategory.color} onChange={e => setNewCategory(c => ({ ...c, color: e.target.value }))}
                  placeholder="#f2d29b" className={inputCls} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={editCat.name} onChange={e => setEditCat(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Pedicure Spa" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(Object.keys(CATEGORY_ICONS) as Array<keyof typeof CATEGORY_ICONS>).map(key => (
                  <button key={key} type="button" title={key} onClick={() => setEditCat(c => ({ ...c, icon: key }))}
                    className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${editCat.icon === key ? 'border-[#f2d29b] bg-[#f2d29b]/15 text-[#f9e9c8]' : 'border-[#403521] text-[#b3a893] hover:border-[#f2d29b]/50 hover:text-[#f9e9c8]'}`}>
                    <CategoryIcon name={key} size={15} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={editCat.color} onChange={e => setEditCat(c => ({ ...c, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#403521]" />
                <input value={editCat.color} onChange={e => setEditCat(c => ({ ...c, color: e.target.value }))}
                  placeholder="#f2d29b" className={inputCls} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Descripción</label>
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-2">Monto en colones (₡) *</label>
            <input type="number" min={1} value={newGc.amount} onChange={e => setNewGc(g => ({ ...g, amount: e.target.value }))}
              placeholder="Ej. 5000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Comprador *</label>
            <input value={newGc.buyer} onChange={e => setNewGc(g => ({ ...g, buyer: e.target.value }))}
              placeholder="Ej. Ana R." className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Para (destinataria)</label>
            <input value={newGc.recipient} onChange={e => setNewGc(g => ({ ...g, recipient: e.target.value }))}
              placeholder="Ej. Mamá (opcional)" className={inputCls} />
          </div>
          <div className="rounded-xl border border-[#f2d29b]/25 bg-[#f2d29b]/[0.06] p-3.5 flex items-center gap-3">
            <Gift size={18} className="text-[#f2d29b] shrink-0" />
            <p className="text-xs text-[#b3a893]">Se generará un código único <span className="font-mono text-[#f9e9c8]">NS-GC-XXXX</span> listo para copiar y compartir por WhatsApp.</p>
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-2">Monto en colones (₡) *</label>
            <input type="number" min={1} value={editGc.amount} onChange={e => setEditGc(g => ({ ...g, amount: e.target.value }))}
              placeholder="Ej. 5000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Comprador *</label>
            <input value={editGc.buyer} onChange={e => setEditGc(g => ({ ...g, buyer: e.target.value }))}
              placeholder="Ej. Ana R." className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Para (destinataria)</label>
            <input value={editGc.recipient} onChange={e => setEditGc(g => ({ ...g, recipient: e.target.value }))}
              placeholder="Ej. Mamá (opcional)" className={inputCls} />
          </div>
          <p className="text-[#6b6355] text-xs">El código nunca cambia; el estado (activa/canjeada) se alterna desde la tarjeta.</p>
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Clienta *</label>
            <select value={newAppt.client_id} onChange={e => setNewAppt(a => ({ ...a, client_id: e.target.value }))}
              className={inputCls}>
              <option value="">Seleccionar…</option>
              {(allClientsQuery.data?.items ?? []).map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Diseño</label>
            <select value={newAppt.design_id} onChange={e => setNewAppt(a => ({ ...a, design_id: e.target.value }))}
              className={inputCls}>
              <option value="">Servicio general</option>
              {(allDesignsQuery.data?.items ?? []).map(d => <option key={d.id} value={d.id}>{d.name} · ₡{d.price.toLocaleString()}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Fecha *</label>
              <input type="date" value={newAppt.date} onChange={e => setNewAppt(a => ({ ...a, date: e.target.value }))}
                className={`${inputCls} [color-scheme:dark]`} />
            </div>
            <div>
              <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Hora *</label>
              <input type="time" value={newAppt.time} onChange={e => setNewAppt(a => ({ ...a, time: e.target.value }))}
                className={`${inputCls} [color-scheme:dark]`} />
            </div>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Notas</label>
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={newClient.name} onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Ana López" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Teléfono *</label>
            <input value={newClient.phone} onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))}
              placeholder="+52 55 0000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={newClient.email} onChange={e => setNewClient(c => ({ ...c, email: e.target.value }))}
              placeholder="ana@ejemplo.com (opcional)" className={inputCls} />
          </div>
      </EditModalShell>

      {/* Rewards (lealtad cada 10 visitas) */}
      <Modal open={rewardsFor !== null} onClose={() => { setRewardsFor(null); setPointsFor(null); }} size="sm">
        <div className="relative overflow-hidden rounded-xl -m-6 p-6">
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, transparent, #f2d29b, transparent)' }} />
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-[#f2d29b]/40"
              style={{ background: 'linear-gradient(135deg, #2a2013, #120e0a)', boxShadow: '0 0 20px rgba(242,210,155,0.22)' }}>
              <Crown size={17} className="text-[#f9e9c8]" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.28em] uppercase">Clientas · Lealtad</p>
              <h3 className="font-serif text-xl text-[#faf7f0] mt-1 leading-tight truncate">
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

      {/* Historial de citas por clienta */}
      <Modal open={historyFor !== null} onClose={() => setHistoryFor(null)} title="Historial de citas" size="sm">
        <ClientHistoryBody
          clientId={historyFor}
          clientName={effClientsBase.find(c => c.id === historyFor)?.name ?? ''}
          fallbackLastVisit={effClientsBase.find(c => c.id === historyFor)?.lastVisit ?? '—'}
          designNameById={designNameById}
          statusMeta={STATUS_META}
          online={onlineClients}
        />
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input value={editClient.name} onChange={e => setEditClient(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej. Ana López" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Teléfono *</label>
            <input value={editClient.phone} onChange={e => setEditClient(c => ({ ...c, phone: e.target.value }))}
              placeholder="+52 55 0000" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={editClient.email} onChange={e => setEditClient(c => ({ ...c, email: e.target.value }))}
              placeholder="ana@ejemplo.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Notas</label>
            <input value={editClient.notes} onChange={e => setEditClient(c => ({ ...c, notes: e.target.value }))}
              placeholder="Alergias, preferencias…" className={inputCls} />
          </div>
          {editDetailQuery.isLoading && (
            <p className="text-[#b3a893] text-xs font-mono animate-pulse">Cargando datos…</p>
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
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Texto * (mín. 10)</label>
          <textarea value={editReview.text} onChange={e => setEditReview(r => ({ ...r, text: e.target.value }))}
            rows={4} maxLength={2000} placeholder="Texto de la reseña…" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Calificación *</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setEditReview(r => ({ ...r, rating: n }))} aria-label={`${n} estrellas`}>
                <Star size={26} className={n <= editReview.rating ? 'fill-[#f2d29b] text-[#f2d29b]' : 'text-[#6b6355] hover:text-[#b3a893]'} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Diseño (opcional)</label>
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

      {/* Add blog article */}
      <EditModalShell
        open={addBlogOpen}
        onClose={() => { setAddBlogOpen(false); setNewBlogError(''); }}
        title="Nuevo artículo"
        eyebrow="Blog · Tips propios"
        error={newBlogError || null}
        onSave={handleCreateBlog}
        saveLabel={createBlogMut.isPending ? 'Publicando…' : blogFilter === 'published' ? 'Publicar' : 'Guardar borrador'}
        pending={createBlogMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Título *</label>
          <input value={newBlog.title} onChange={e => setNewBlog(b => ({ ...b, title: e.target.value }))}
            placeholder="Ej. 5 tips para que tu semipermanente dure 3 semanas" maxLength={200} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría</label>
            <select value={blogCats.some(c => c.name === newBlog.category) ? newBlog.category : ''}
              onChange={e => setNewBlog(b => ({ ...b, category: e.target.value || 'General' }))}
              className={inputCls}>
              <option value="">General (sin categoría)</option>
              {blogCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              {!blogCats.some(c => c.name === newBlog.category) && newBlog.category !== 'General' && (
                <option value={newBlog.category}>{newBlog.category}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Lectura (min)</label>
            <input type="number" min={1} max={120} value={newBlog.read_minutes} onChange={e => setNewBlog(b => ({ ...b, read_minutes: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Resumen</label>
          <textarea value={newBlog.excerpt} onChange={e => setNewBlog(b => ({ ...b, excerpt: e.target.value }))}
            rows={2} placeholder="Resumen corto para la tarjeta del blog…" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Contenido</label>
          <textarea value={newBlog.body} onChange={e => setNewBlog(b => ({ ...b, body: e.target.value }))}
            rows={5} placeholder="Escribe tus tips paso a paso…" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Imagen (URL)</label>
          <input value={newBlog.image_url} onChange={e => setNewBlog(b => ({ ...b, image_url: e.target.value }))}
            placeholder="https://…" maxLength={500} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Autora (opcional)</label>
          <input value={newBlog.author} onChange={e => setNewBlog(b => ({ ...b, author: e.target.value }))}
            placeholder="Ej. Fernanda Torres" maxLength={200} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Edit blog article */}
      <EditModalShell
        open={editBlogId !== null}
        onClose={() => { setEditBlogId(null); setEditBlogError(''); }}
        title="Editar artículo"
        eyebrow="Blog · Artículo"
        error={editBlogError || null}
        onSave={handleSaveBlog}
        pending={updatePostMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Título *</label>
          <input value={editBlog.title} onChange={e => setEditBlog(b => ({ ...b, title: e.target.value }))}
            maxLength={200} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría</label>
            <select value={editBlog.category} onChange={e => setEditBlog(b => ({ ...b, category: e.target.value }))}
              className={inputCls}>
              {blogCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              {!blogCats.some(c => c.name === editBlog.category) && (
                <option value={editBlog.category}>{editBlog.category || 'General'}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Lectura (min)</label>
            <input type="number" min={1} max={120} value={editBlog.read_minutes} onChange={e => setEditBlog(b => ({ ...b, read_minutes: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Resumen</label>
          <textarea value={editBlog.excerpt} onChange={e => setEditBlog(b => ({ ...b, excerpt: e.target.value }))}
            rows={2} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Contenido</label>
          <textarea value={editBlog.body} onChange={e => setEditBlog(b => ({ ...b, body: e.target.value }))}
            rows={5} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Imagen (URL)</label>
          <input value={editBlog.image_url} onChange={e => setEditBlog(b => ({ ...b, image_url: e.target.value }))}
            maxLength={500} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Autora</label>
          <input value={editBlog.author} onChange={e => setEditBlog(b => ({ ...b, author: e.target.value }))}
            maxLength={200} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Delete blog article */}
      <ConfirmDeleteModal
        open={deleteBlogModal.open}
        onClose={() => setDeleteBlogModal({ open: false, id: null, name: '' })}
        title="Eliminar artículo"
        itemName={deleteBlogModal.name || undefined}
        description="¿Eliminar este artículo del blog? Desaparecerá del sitio."
        consequence="Esta acción no se puede deshacer."
        onConfirm={confirmDeleteBlog}
        pending={deletePostMut.isPending}
      />

      {/* Add blog category */}
      <EditModalShell
        open={addBlogCatOpen}
        onClose={() => { setAddBlogCatOpen(false); setNewBlogCatError(''); }}
        title="Nueva categoría"
        eyebrow="Blog · Categoría"
        error={newBlogCatError || null}
        onSave={handleCreateBlogCat}
        saveLabel={createBlogCatMut.isPending ? 'Creando…' : 'Crear'}
        pending={createBlogCatMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
          <input value={newBlogCat} onChange={e => setNewBlogCat(e.target.value)}
            placeholder="Ej. Tendencias" maxLength={60} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Edit blog category (renombra y migra los artículos) */}
      <EditModalShell
        open={editBlogCatId !== null}
        onClose={() => { setEditBlogCatId(null); setEditBlogCatError(''); }}
        title="Renombrar categoría"
        eyebrow="Blog · Categoría"
        error={editBlogCatError || null}
        onSave={handleSaveBlogCat}
        pending={updateBlogCatMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
          <input value={editBlogCat} onChange={e => setEditBlogCat(e.target.value)}
            maxLength={60} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Delete blog category */}
      <ConfirmDeleteModal
        open={deleteBlogCatModal.open}
        onClose={() => { setDeleteBlogCatModal({ open: false, id: null, name: '' }); setDeleteBlogCatError(''); }}
        title="Eliminar categoría"
        itemName={deleteBlogCatModal.name || undefined}
        description="¿Eliminar esta categoría? Solo se puede si ningún artículo la usa."
        consequence="Esta acción no se puede deshacer."
        error={deleteBlogCatError || null}
        onConfirm={confirmDeleteBlogCat}
        pending={deleteBlogCatMut.isPending}
      />

      {/* Add nosotros section */}
      <EditModalShell
        open={addNosOpen}
        onClose={() => { setAddNosOpen(false); setNewNosError(''); }}
        title="Nueva sección"
        eyebrow="Nosotros · Contenido"
        error={newNosError || null}
        onSave={handleCreateNos}
        saveLabel={createBlogMut.isPending ? 'Guardando…' : nosFilter === 'published' ? 'Publicar' : 'Guardar borrador'}
        pending={createBlogMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Título *</label>
          <input value={newNos.title} onChange={e => setNewNos(b => ({ ...b, title: e.target.value }))}
            placeholder="Ej. Nuestra historia" maxLength={200} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría (Historia / Valores / Equipo)</label>
          <input value={newNos.category} onChange={e => setNewNos(b => ({ ...b, category: e.target.value }))}
            placeholder="Historia" maxLength={60} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Resumen</label>
          <textarea value={newNos.excerpt} onChange={e => setNewNos(b => ({ ...b, excerpt: e.target.value }))}
            rows={2} placeholder="Texto corto…" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Contenido</label>
          <textarea value={newNos.body} onChange={e => setNewNos(b => ({ ...b, body: e.target.value }))}
            rows={5} placeholder="Texto completo de la sección…" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Imagen (URL)</label>
          <input value={newNos.image_url} onChange={e => setNewNos(b => ({ ...b, image_url: e.target.value }))}
            placeholder="https://…" maxLength={500} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Autora (opcional)</label>
          <input value={newNos.author} onChange={e => setNewNos(b => ({ ...b, author: e.target.value }))}
            placeholder="Ej. Fernanda Torres" maxLength={200} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Edit nosotros section */}
      <EditModalShell
        open={editNosId !== null}
        onClose={() => { setEditNosId(null); setEditNosError(''); }}
        title="Editar sección"
        eyebrow="Nosotros · Contenido"
        error={editNosError || null}
        onSave={handleSaveNos}
        pending={updatePostMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Título *</label>
          <input value={editNos.title} onChange={e => setEditNos(b => ({ ...b, title: e.target.value }))}
            maxLength={200} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Categoría</label>
          <input value={editNos.category} onChange={e => setEditNos(b => ({ ...b, category: e.target.value }))}
            maxLength={60} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Resumen</label>
          <textarea value={editNos.excerpt} onChange={e => setEditNos(b => ({ ...b, excerpt: e.target.value }))}
            rows={2} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Contenido</label>
          <textarea value={editNos.body} onChange={e => setEditNos(b => ({ ...b, body: e.target.value }))}
            rows={5} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Imagen (URL)</label>
          <input value={editNos.image_url} onChange={e => setEditNos(b => ({ ...b, image_url: e.target.value }))}
            maxLength={500} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Autora</label>
          <input value={editNos.author} onChange={e => setEditNos(b => ({ ...b, author: e.target.value }))}
            maxLength={200} className={inputCls} />
        </div>
      </EditModalShell>

      {/* Delete nosotros section */}
      <ConfirmDeleteModal
        open={deleteNosModal.open}
        onClose={() => setDeleteNosModal({ open: false, id: null, name: '' })}
        title="Eliminar sección"
        itemName={deleteNosModal.name || undefined}
        description="¿Eliminar esta sección de Nosotros? Desaparecerá del sitio."
        consequence="Esta acción no se puede deshacer."
        onConfirm={confirmDeleteNos}
        pending={deletePostMut.isPending}
      />

      {/* Delete contact message */}
      <ConfirmDeleteModal
        open={deleteMsgModal.open}
        onClose={() => setDeleteMsgModal({ open: false, id: null, name: '' })}
        title="Eliminar mensaje"
        itemName={deleteMsgModal.name || undefined}
        description="¿Eliminar este mensaje del buzón?"
        consequence="Esta acción no se puede deshacer."
        onConfirm={confirmDeleteMsg}
        pending={deleteMsgMut.isPending}
      />

      {/* Add social */}
      <EditModalShell
        open={addSocialOpen}
        onClose={() => { setAddSocialOpen(false); setNewSocialError(''); }}
        title="Agregar red social"
        eyebrow="Contacto · Red nueva"
        error={newSocialError || null}
        onSave={handleCreateSocial}
        saveLabel={createSocialMut.isPending ? 'Agregando…' : 'Agregar'}
        pending={createSocialMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
          <input value={newSocial.label} onChange={e => setNewSocial(s => ({ ...s, label: e.target.value }))}
            placeholder="Ej. Facebook" maxLength={60} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Enlace *</label>
          <input value={newSocial.url} onChange={e => setNewSocial(s => ({ ...s, url: e.target.value }))}
            placeholder="https://facebook.com/tu-pagina" maxLength={500} inputMode="url" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono</label>
          <div className="flex gap-2 flex-wrap">
            {SOCIAL_ICONS.map(icon => (
              <button key={icon} type="button" onClick={() => setNewSocial(s => ({ ...s, icon }))} title={icon}
                aria-pressed={newSocial.icon === icon}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${newSocial.icon === icon ? 'border-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] hover:border-[#b3a893]'}`}>
                <SocialIcon icon={icon} />
              </button>
            ))}
          </div>
        </div>
      </EditModalShell>

      {/* Edit social */}
      <EditModalShell
        open={editSocialId !== null}
        onClose={() => { setEditSocialId(null); setEditSocialError(''); }}
        title="Editar red social"
        eyebrow="Contacto · Red"
        error={editSocialError || null}
        onSave={handleSaveSocial}
        pending={updateSocialMut.isPending}
      >
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Nombre *</label>
          <input value={editSocial.label} onChange={e => setEditSocial(s => ({ ...s, label: e.target.value }))}
            maxLength={60} className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Enlace *</label>
          <input value={editSocial.url} onChange={e => setEditSocial(s => ({ ...s, url: e.target.value }))}
            maxLength={500} inputMode="url" className={inputCls} />
        </div>
        <div>
          <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Icono</label>
          <div className="flex gap-2 flex-wrap">
            {SOCIAL_ICONS.map(icon => (
              <button key={icon} type="button" onClick={() => setEditSocial(s => ({ ...s, icon }))} title={icon}
                aria-pressed={editSocial.icon === icon}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${editSocial.icon === icon ? 'border-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] hover:border-[#b3a893]'}`}>
                <SocialIcon icon={icon} />
              </button>
            ))}
          </div>
        </div>
      </EditModalShell>

      {/* Delete social */}
      <ConfirmDeleteModal
        open={deleteSocialModal.open}
        onClose={() => setDeleteSocialModal({ open: false, id: null, name: '' })}
        title="Eliminar red social"
        itemName={deleteSocialModal.name || undefined}
        description="¿Quitar esta red de la página de Contacto?"
        consequence="Esta acción no se puede deshacer."
        onConfirm={confirmDeleteSocial}
        pending={deleteSocialMut.isPending}
      />
    </div>
  );
}
import type { BackendPermission, BackendRole } from '../../features/admin/rbac-api';

const ROLE_PALETTE = ['#f2d29b', '#9b8ea8', '#8aab8a', '#d4613a', '#8ab0c8'];

function ServerRolesPanel({ roles, permissions, activeRoleId, onSelect, rolePerms, permsLoading, onAssign, onEdit }: {
  roles: BackendRole[];
  permissions: BackendPermission[];
  activeRoleId: number | null;
  onSelect: (id: number) => void;
  rolePerms: BackendPermission[];
  permsLoading: boolean;
  onAssign: (role: BackendRole) => void;
  onEdit: (role: BackendRole) => void;
}) {
  const active = roles.find(r => r.id === activeRoleId) ?? roles[0];
  const granted = new Set(rolePerms.map(p => p.code.toLowerCase()));
  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest px-1 text-[#8aab8a]">● Servidor · {permissions.length} permisos en catálogo</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((r, i) => {
          const color = ROLE_PALETTE[i % ROLE_PALETTE.length] ?? '#f2d29b';
          const isActive = active?.id === r.id;
          return (
            <div key={r.id}
              className={`relative text-left rounded-2xl border p-5 overflow-hidden transition-all ${isActive ? 'border-[#f2d29b]/50 shadow-[0_0_28px_rgba(242,210,155,0.10)]' : 'border-[#403521] bg-[#14110c] hover:border-[#f2d29b]/30'}`}
              style={isActive ? { background: 'linear-gradient(140deg,#1c150c 0%,#120e0a 70%)' } : undefined}>
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <button onClick={() => onSelect(r.id)} className="block w-full text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{ background: `${color}14`, borderColor: `${color}35`, color }}>
                    <Shield size={15} />
                  </div>
                  {r.is_system && <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#332a1d] text-[#b3a893] border border-[#403521]">sistema</span>}
                </div>
                <p className="font-serif text-lg text-[#faf7f0] leading-tight">{r.name}</p>
                <p className="text-[#b3a893] text-xs mt-1">{r.description ?? 'Sin descripción'}</p>
                <p className="text-[#6b6355] text-[11px] font-mono mt-1.5">
                  {isActive
                    ? (permsLoading ? 'Cargando permisos…' : `${granted.size} de ${permissions.length} asignados`)
                    : 'Toca para ver'}
                </p>
              </button>
              <div className="flex gap-2 mt-4">
                <Can code="roles.update">
                  <button onClick={() => onEdit(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-[#403521] text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 transition-all">
                    <Edit3 size={12} /> Editar
                  </button>
                </Can>
                <Can code="roles.update">
                  <button onClick={() => { onSelect(r.id); onAssign(r); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#f2d29b] text-[#0d0b09] hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150">
                    <Key size={12} /> Asignar
                  </button>
                </Can>
              </div>
            </div>
          );
        })}
      </div>
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
    <div className="rounded-xl border border-[#403521] bg-[#0d0b09]/60 p-3.5">
      <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest mb-2.5">Historial de cambios</p>
      {query.isLoading ? (
        <p className="text-[#b3a893] text-xs font-mono animate-pulse">Cargando historial…</p>
      ) : items.length === 0 ? (
        <p className="text-[#6b6355] text-xs">Sin cambios registrados todavía.</p>
      ) : (
        <ol className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
          {items.map(h => (
            <li key={h.id} className="flex gap-2.5 text-xs">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f2d29b]/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-[#faf7f0]">
                  {FIELD_LABEL[h.field] ?? h.field}:{' '}
                  <span className="text-[#b3a893] line-through">{h.old_value ?? '—'}</span>{' '}
                  <span className="text-[#f2d29b]">→</span>{' '}
                  <span className="font-mono">{h.new_value ?? '—'}</span>
                </p>
                <p className="text-[#6b6355] text-[11px] font-mono mt-0.5">
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
    return <p className="text-[#b3a893] text-sm">Conecta el servidor para ver el progreso de lealtad de {clientName}.</p>;
  }
  const r = rewards.data;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#b3a893]">{r ? `${r.visits} visitas · faltan ${r.visits_to_reward}` : 'Cargando progreso…'}</span>
          <span className="font-mono text-[#f2d29b]">{r ? `${r.progress_pct}%` : '—'}</span>
        </div>
        <div className="h-2 bg-[#0d0b09] border border-[#403521]/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#a37c42] to-[#f9e9c8] rounded-full transition-all"
            style={{ width: `${r?.progress_pct ?? 0}%` }} />
        </div>
        <p className="text-[#6b6355] text-[11px] mt-1.5">Las gift cards se crean manualmente desde el tab Gift Cards.</p>
      </div>
      {(r?.loyalty_cards.length ?? 0) > 0 && (
        <div>
          <p className="text-[#b3a893] text-xs font-mono uppercase tracking-widest mb-2">Tarjetas ganadas</p>
          <div className="flex flex-wrap gap-2">
            {r?.loyalty_cards.map(code => (
              <span key={code} className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[#f2d29b]/10 border border-[#f2d29b]/30 text-[#f9e9c8]">{code}</span>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-xl border border-[#403521] bg-[#0d0b09]/60 p-3.5">
        <p className="text-[#b3a893] text-xs mb-2">Puntos actuales: <span className="font-mono text-[#f9e9c8]">{points}</span></p>
        {pointsFor?.id === clientId ? (
          <div className="flex gap-2">
            <input type="number" value={pointsFor.delta} onChange={e => setPointsFor({ id: clientId, delta: e.target.value })}
              placeholder="+50 / -20" className="flex-1 bg-[#0d0b09] border border-[#403521] rounded-lg px-3 py-2 text-sm text-[#faf7f0] outline-none focus:border-[#f2d29b]/60" />
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
              className="px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] disabled:opacity-50 transition-colors">
              Aplicar
            </button>
          </div>
        ) : (
          <Can code="clientas.update">
            <button onClick={() => setPointsFor({ id: clientId, delta: '' })}
              className="text-xs text-[#f2d29b] hover:underline">Ajustar puntos manualmente</button>
          </Can>
        )}
      </div>
    </div>
  );
}

// ─── Historial de citas de una clienta (última cita destacada + lista) ───────
function ClientHistoryBody({ clientId, clientName, fallbackLastVisit, designNameById, statusMeta, online }: {
  clientId: number | null;
  clientName: string;
  fallbackLastVisit: string;
  designNameById: Map<number, string>;
  statusMeta: Record<string, { label: string; cls: string }>;
  online: boolean;
}) {
  const query = useClientAppointments(online && clientId !== null ? clientId : null);
  const items = [...(query.data?.items ?? [])].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const nowIso = new Date().toISOString().slice(0, 16);
  const lastPast = items.find(a => a.starts_at.slice(0, 16) <= nowIso);
  const lastLabel = lastPast
    ? new Date(lastPast.starts_at).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : fallbackLastVisit;
  if (clientId === null) return null;
  return (
    <div>
      <div className="rounded-xl border border-[#f2d29b]/25 bg-[#f2d29b]/[0.06] px-4 py-3 mb-4">
        <p className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest">Última cita · {clientName || 'Clienta'}</p>
        <p className="font-serif text-[#faf7f0] text-lg mt-0.5 capitalize">{lastLabel}</p>
        <p className="text-[#6b6355] text-[11px] font-mono mt-0.5">{items.length} cita(s) en total</p>
      </div>
      {query.isLoading ? (
        <p className="text-[#b3a893] text-xs font-mono animate-pulse py-6 text-center">Cargando historial…</p>
      ) : query.isError ? (
        <div role="alert" className="text-center py-6">
          <p className="text-[#e08a6d] text-xs">{(query.error as Error)?.message ?? 'Error de conexión'}</p>
          <button onClick={() => void query.refetch()}
            className="mt-3 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-[#b3a893] text-xs text-center py-6">Sin citas registradas para esta clienta.</p>
      ) : (
        <ol className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {items.map(a => {
            const meta = statusMeta[a.status] ?? statusMeta.pending;
            return (
              <li key={a.id} className="rounded-xl border border-[#403521]/70 bg-[#0d0b09]/60 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-[#faf7f0] text-[13px] font-medium">
                    {new Date(a.starts_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[#b3a893] text-xs font-mono">
                    {a.starts_at.slice(11, 16)}–{a.ends_at.slice(11, 16)}
                  </p>
                  <span className={`ml-auto text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-[#b3a893] text-xs mt-1 truncate">
                  {a.design_id ? (designNameById.get(a.design_id) ?? `Diseño #${a.design_id}`) : 'Servicio general'}
                  {a.artist_name ? ` · ${a.artist_name}` : ''}
                </p>
                {a.notes && <p className="text-[#6b6355] text-xs mt-1 line-clamp-2">{a.notes}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

