import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { EquipmentStatusBadge, EquipmentConditionBadge } from '@/components/inventory/EquipmentBadges';
import { EquipmentFormModal } from '@/components/inventory/EquipmentFormModal';
import {
  EquipmentCondition,
  EquipmentStatus,
  EquipmentSummary,
  Laboratory,
  EquipmentCategory,
  PageResponse,
} from '@/types/inventory';
import { inventoryApi } from '@/lib/inventoryApi';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  FlaskConical,
  AlertCircle,
} from 'lucide-react';

export const EquipmentListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const initialQuery = searchParams.get('query') || '';
  const initialLab = searchParams.get('laboratoryId') || '';
  const initialCat = searchParams.get('categoryId') || '';
  const initialStatus = (searchParams.get('status') as EquipmentStatus) || '';
  const initialCond = (searchParams.get('condition') as EquipmentCondition) || '';

  // Filter States
  const [query, setQuery] = useState(initialQuery);
  const [selectedLab, setSelectedLab] = useState(initialLab);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | ''>(initialStatus);
  const [selectedCondition, setSelectedCondition] = useState<EquipmentCondition | ''>(initialCond);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Data States
  const [pageData, setPageData] = useState<PageResponse<EquipmentSummary> | null>(null);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Role check: can register equipment?
  const canManageEquipment =
    user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT') ?? false;

  // Load dropdown options once
  useEffect(() => {
    let active = true;
    Promise.all([inventoryApi.getLaboratories(false), inventoryApi.getCategories()])
      .then(([labs, cats]) => {
        if (!active) return;
        setLaboratories(labs);
        setCategories(cats);
      })
      .catch((err) => {
        console.error('Failed to load filter metadata:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch instruments
  const loadEquipment = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await inventoryApi.getEquipment({
        query: query.trim() || undefined,
        laboratoryId: selectedLab || undefined,
        categoryId: selectedCategory || undefined,
        status: (selectedStatus as EquipmentStatus) || undefined,
        condition: (selectedCondition as EquipmentCondition) || undefined,
        page,
        size: pageSize,
        sort: 'name,asc',
      });
      setPageData(data);
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
      setErrorMessage('Could not load equipment inventory from the university server.');
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedLab, selectedCategory, selectedStatus, selectedCondition, page]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  // Sync state changes with URL params
  const handleFilterApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);
    const params: Record<string, string> = {};
    if (query.trim()) params.query = query.trim();
    if (selectedLab) params.laboratoryId = selectedLab;
    if (selectedCategory) params.categoryId = selectedCategory;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedCondition) params.condition = selectedCondition;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedLab('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedCondition('');
    setPage(0);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Equipment Inventory
              </h1>
              <span className="text-xs font-mono font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                {pageData ? `${pageData.totalElements} instruments` : 'Loading...'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Browse, monitor, and inspect institutional laboratory hardware, calibration health, and availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/laboratories">
              <Button variant="outline" size="sm">
                <FlaskConical className="w-4 h-4 mr-1.5" />
                Laboratory Facilities
              </Button>
            </Link>

            {canManageEquipment && (
              <Button variant="lime" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Register Instrument
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-subtle">
          <form onSubmit={handleFilterApply} className="flex flex-col gap-3">
            {/* Top search row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by instrument name, asset tag, manufacturer, or model..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="secondary" size="md">
                  <Filter className="w-4 h-4 mr-1.5" />
                  Filter
                </Button>
                <Button type="button" variant="ghost" size="md" onClick={handleResetFilters} title="Reset filters">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter selectors row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Laboratory Facility</label>
                <select
                  value={selectedLab}
                  onChange={(e) => {
                    setSelectedLab(e.target.value);
                    setPage(0);
                  }}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Facilities</option>
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Taxonomy Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(0);
                  }}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Operational Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value as EquipmentStatus | '');
                    setPage(0);
                  }}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In Use</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Physical Condition</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => {
                    setSelectedCondition(e.target.value as EquipmentCondition | '');
                    setPage(0);
                  }}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Conditions</option>
                  <option value="NEW">New</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Data Table */}
        <div className="mt-6 rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Instrument / Model</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-normal">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-accent-lime" />
                        <span>Querying equipment registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : !pageData || pageData.content.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <SlidersHorizontal className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                      <p className="font-medium text-foreground">No matching laboratory instruments found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try modifying search parameters or clearing filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageData.content.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-xs text-foreground">
                        <Link
                          to={`/app/equipment/${item.id}`}
                          className="hover:text-primary transition-colors underline decoration-border/60 hover:decoration-primary"
                        >
                          {item.assetTag}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground leading-snug">
                          <Link
                            to={`/app/equipment/${item.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {item.name}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.manufacturer} • {item.model}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="text-foreground font-medium">{item.laboratoryName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground/80">
                          {item.laboratoryCode}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <EquipmentConditionBadge condition={item.condition} />
                      </td>
                      <td className="py-3.5 px-4">
                        <EquipmentStatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/app/equipment/${item.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            Inspect
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pageData && pageData.totalPages > 1 && (
            <div className="p-4 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
              <div>
                Showing{' '}
                <span className="font-medium text-foreground">
                  {page * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-foreground">
                  {Math.min((page + 1) * pageSize, pageData.totalElements)}
                </span>{' '}
                of <span className="font-medium text-foreground">{pageData.totalElements}</span>{' '}
                instruments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={pageData.first}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="font-mono px-2">
                  Page {page + 1} of {pageData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pageData.last}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Register Instrument Modal */}
      {isCreateModalOpen && (
        <EquipmentFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            loadEquipment();
          }}
        />
      )}
    </div>
  );
};
