import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LaboratoryFormModal } from '@/components/inventory/LaboratoryFormModal';
import { Laboratory } from '@/types/inventory';
import { inventoryApi } from '@/lib/inventoryApi';
import { useAuth } from '@/context/AuthContext';
import {
  FlaskConical,
  Plus,
  RefreshCw,
  MapPin,
  Pencil,
  ArrowRight,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export const LaboratoryListPage: React.FC = () => {
  const { user } = useAuth();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLabForEdit, setSelectedLabForEdit] = useState<Laboratory | null>(null);

  const canManageLabs =
    user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT') ?? false;

  const loadLaboratories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await inventoryApi.getLaboratories(activeOnly);
      setLaboratories(data);
    } catch (err) {
      console.error('Failed to load laboratory facilities:', err);
      setErrorMessage('Could not load laboratory facilities from the university server.');
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    loadLaboratories();
  }, [loadLaboratories]);

  const handleEditClick = (lab: Laboratory) => {
    setSelectedLabForEdit(lab);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedLabForEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Laboratory Facilities & Research Bays
              </h1>
              <span className="text-xs font-mono font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                {laboratories.length} facilities
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Campus research hubs, experimental suites, and cleanrooms hosting monitored scientific instruments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/equipment">
              <Button variant="outline" size="sm">
                View All Equipment
              </Button>
            </Link>

            {canManageLabs && (
              <Button variant="lime" size="sm" onClick={handleCreateClick}>
                <Plus className="w-4 h-4 mr-1.5" />
                Register Facility
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveOnly(false)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                !activeOnly
                  ? 'bg-foreground text-background border-foreground font-semibold'
                  : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              All Facilities
            </button>
            <button
              onClick={() => setActiveOnly(true)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                activeOnly
                  ? 'bg-foreground text-background border-foreground font-semibold'
                  : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Active Only
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => loadLaboratories()} title="Refresh list">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Facilities Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent-lime" />
              <p className="text-sm font-medium">Retrieving laboratory facilities...</p>
            </div>
          ) : laboratories.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <FlaskConical className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">No laboratory facilities registered</p>
              <p className="text-xs text-muted-foreground mt-1">
                Register a new laboratory bay to begin commissioning instruments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {laboratories.map((lab) => (
                <div
                  key={lab.id}
                  className="rounded-xl border border-border/80 bg-card p-5 shadow-subtle flex flex-col justify-between hover:border-border transition-all group"
                >
                  <div>
                    {/* Top row: Code + Active Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {lab.code}
                      </span>
                      {lab.active ? (
                        <Badge variant="available" withDot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" withDot>
                          Inactive
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {lab.name}
                    </h2>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                      <MapPin className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                      <span>
                        {lab.building} — <strong className="text-foreground">{lab.roomNumber}</strong>
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                      {lab.description || 'No specific facility description provided.'}
                    </p>

                    {/* Manager if assigned */}
                    {lab.managerName && (
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>Facility Manager: <strong className="text-foreground">{lab.managerName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-3 border-t border-border/80 flex items-center justify-between">
                    <Link
                      to={`/app/equipment?laboratoryId=${lab.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Assigned Instruments</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {canManageLabs && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(lab)}
                        className="h-7 px-2 text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal */}
      {isModalOpen && (
        <LaboratoryFormModal
          isOpen={isModalOpen}
          initialData={selectedLabForEdit}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            loadLaboratories();
          }}
        />
      )}
    </div>
  );
};
