import {
  CalendarCheck,
  Car as CarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type {
  AvailabilityStatus,
  BookingRecord,
  Car,
  DashboardStats,
  InquiryRecord,
  SiteSettings,
} from '../../types/rental.ts';
import { AdminDashboardView } from './AdminDashboardView.tsx';
import { AdminLogin } from './AdminLogin.tsx';
import { AvailabilityManagementView } from './AvailabilityManagementView.tsx';
import { CarFormModal } from './CarFormModal.tsx';
import { CarListingView } from './CarListingView.tsx';
import { PriceManagementView } from './PriceManagementView.tsx';
import { SettingsView } from './SettingsView.tsx';

type AdminTab = 'dashboard' | 'cars' | 'pricing' | 'availability' | 'settings';

interface AdminAppProps {
  onNavigatePublic: () => void;
}

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cars', label: 'Car Management', icon: CarIcon },
  { id: 'pricing', label: 'Price Management', icon: IndianRupee },
  { id: 'availability', label: 'Availability', icon: CalendarCheck },
  { id: 'settings', label: 'Site Settings', icon: Settings },
];

export function AdminApp({ onNavigatePublic }: AdminAppProps) {
  const [token, setToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Admin Data State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [recentCars, setRecentCars] = useState<Car[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<InquiryRecord[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [databaseEngine, setDatabaseEngine] = useState('MongoDB');

  // Modals & Feedback
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }

  const fetchAllAdminData = useCallback(async (authToken: string) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [dashRes, carsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers }),
        fetch('/api/admin/cars', { headers }),
        fetch('/api/admin/settings', { headers }),
      ]);

      if (dashRes.status === 401 || dashRes.status === 403) {
        setToken(null);
        return;
      }

      if (dashRes.ok) {
        const dashData = (await dashRes.json()) as {
          stats: DashboardStats;
          recentCars: Car[];
          recentBookings: BookingRecord[];
          allBookings?: BookingRecord[];
          recentInquiries: InquiryRecord[];
          databaseEngine: string;
        };
        setStats(dashData.stats);
        setRecentCars(dashData.recentCars);
        setRecentBookings(dashData.recentBookings);
        setAllBookings(dashData.allBookings ?? dashData.recentBookings);
        setRecentInquiries(dashData.recentInquiries);
        setDatabaseEngine(dashData.databaseEngine);
      }

      if (carsRes.ok) {
        const carsData = (await carsRes.json()) as { cars: Car[] };
        setCars(carsData.cars);
      }

      if (settingsRes.ok) {
        const settingsData = (await settingsRes.json()) as { settings: SiteSettings };
        setSettings(settingsData.settings);
      }
    } catch {
      showToast('error', 'Failed to refresh admin console data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchAllAdminData(token);
    }
  }, [token, fetchAllAdminData]);

  if (!token) {
    return (
      <AdminLogin
        onAuthenticated={(newToken, email) => {
          setToken(newToken);
          setAdminEmail(email);
        }}
        onNavigatePublic={onNavigatePublic}
      />
    );
  }

  async function handleArchiveCar(car: Car) {
    if (!token) return;
    const res = await fetch(`/api/admin/cars/${car.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { message?: string; error?: string };
    if (!res.ok) {
      showToast('error', data.error ?? 'Unable to archive car.');
      return;
    }
    showToast('success', data.message ?? `${car.name} archived.`);
    await fetchAllAdminData(token);
  }

  async function handleQuickStatusChange(carId: string, status: AvailabilityStatus) {
    if (!token) return;
    const res = await fetch(`/api/admin/cars/${carId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = (await res.json()) as { car?: Car; error?: string };
    if (!res.ok) {
      showToast('error', data.error ?? 'Failed to update availability.');
      return;
    }
    showToast('success', `Availability updated to ${status}.`);
    await fetchAllAdminData(token);
  }

  async function handleSavePrice(
    carId: string,
    payload: {
      dailyRateInr: number;
      weeklyRateInr?: number;
      monthlyRateInr?: number;
      securityDepositInr: number;
      extraHourRateInr: number;
      extraKmRateInr?: number;
    },
  ) {
    if (!token) return;
    const res = await fetch(`/api/admin/cars/${carId}/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { car?: Car; error?: string };
    if (!res.ok) {
      showToast('error', data.error ?? 'Failed to save pricing.');
      return;
    }
    showToast('success', `Updated pricing for ${data.car?.name ?? 'vehicle'}.`);
    await fetchAllAdminData(token);
  }

  async function handleAddBlockedRange(
    carId: string,
    payload: { startDate: string; endDate: string; reason: string },
  ) {
    if (!token) return;
    const res = await fetch(`/api/admin/cars/${carId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ addBlockedRange: payload }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      showToast('error', data.error ?? 'Unable to block dates.');
      return;
    }
    showToast('success', 'Blocked date range added.');
    await fetchAllAdminData(token);
  }

  async function handleRemoveBlockedRange(carId: string, rangeId: string) {
    if (!token) return;
    const res = await fetch(`/api/admin/cars/${carId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ removeBlockedRangeId: rangeId }),
    });
    if (!res.ok) {
      showToast('error', 'Unable to remove blocked range.');
      return;
    }
    showToast('success', 'Blocked date range removed.');
    await fetchAllAdminData(token);
  }

  async function handleSaveSettings(payload: Partial<SiteSettings>) {
    if (!token) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { settings?: SiteSettings; error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? 'Failed to save settings.');
    }
    showToast('success', 'Website settings updated across public pages.');
    await fetchAllAdminData(token);
  }

  const activeNavLabel = NAV_ITEMS.find((i) => i.id === activeTab)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#09090B] text-neutral-100 flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#111114] border-r border-neutral-800 transition-all duration-150 shrink-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 border-b border-neutral-800 flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <span className="font-display text-base font-bold text-white whitespace-nowrap truncate">
              24 <span className="text-orange-500">Self Drive</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((p) => !p)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav aria-label="Admin Navigation" className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-800 space-y-1">
          <button
            type="button"
            onClick={onNavigatePublic}
            title="View Public Website"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 whitespace-nowrap cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-orange-500" />
            {!sidebarCollapsed && <span>View Public Site</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setToken(null);
              setAdminEmail('');
            }}
            title="Sign Out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-neutral-900 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-[#111114] border-r border-neutral-800 flex flex-col">
            <div className="h-16 px-4 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-display text-base font-bold text-white">
                24 <span className="text-orange-500">Self Drive</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close sidebar"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                      active
                        ? 'bg-orange-500 text-white'
                        : 'text-neutral-300 hover:bg-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-neutral-800 space-y-1">
              <button
                type="button"
                onClick={onNavigatePublic}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-900 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-orange-500" />
                <span>View Public Site</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setToken(null);
                  setMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-neutral-900 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header (Breadcrumb left, Account / Primary action right) */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-[#111114] border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-neutral-500 hidden sm:inline">Admin Console</span>
              <span className="text-neutral-600 hidden sm:inline">/</span>
              <span className="font-semibold text-white truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-neutral-400 font-mono truncate max-w-[200px]">
              {adminEmail}
            </span>
            <button
              type="button"
              onClick={onNavigatePublic}
              className="px-3.5 py-2 text-xs font-medium text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Public Site
            </button>
          </div>
        </header>

        {/* Toast Feedback Banner */}
        {toast && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div
              role="status"
              className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
                toast.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/50 border-red-800 text-red-300'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-current opacity-75 hover:opacity-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Active View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboardView
              stats={stats}
              recentCars={recentCars}
              recentBookings={recentBookings}
              recentInquiries={recentInquiries}
              databaseEngine={databaseEngine}
              loading={loading}
              onAddCar={() => {
                setEditingCar(null);
                setCarModalOpen(true);
              }}
              onEditCar={(car) => {
                setEditingCar(car);
                setCarModalOpen(true);
              }}
            />
          )}

          {activeTab === 'cars' && (
            <CarListingView
              cars={cars}
              loading={loading}
              onAddCar={() => {
                setEditingCar(null);
                setCarModalOpen(true);
              }}
              onEditCar={(car) => {
                setEditingCar(car);
                setCarModalOpen(true);
              }}
              onArchiveCar={handleArchiveCar}
              onQuickStatusChange={handleQuickStatusChange}
            />
          )}

          {activeTab === 'pricing' && (
            <PriceManagementView cars={cars} onSavePrice={handleSavePrice} />
          )}

          {activeTab === 'availability' && (
            <AvailabilityManagementView
              cars={cars}
              bookings={allBookings}
              onQuickStatusChange={handleQuickStatusChange}
              onAddBlockedRange={handleAddBlockedRange}
              onRemoveBlockedRange={handleRemoveBlockedRange}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              cars={cars}
              token={token}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Car Modal */}
      <CarFormModal
        open={carModalOpen}
        editingCar={editingCar}
        token={token}
        onClose={() => {
          setCarModalOpen(false);
          setEditingCar(null);
        }}
        onSaved={(savedCar, isNew) => {
          setCarModalOpen(false);
          setEditingCar(null);
          showToast(
            'success',
            isNew ? `${savedCar.name} added to fleet.` : `${savedCar.name} updated.`,
          );
          void fetchAllAdminData(token);
        }}
      />
    </div>
  );
}
