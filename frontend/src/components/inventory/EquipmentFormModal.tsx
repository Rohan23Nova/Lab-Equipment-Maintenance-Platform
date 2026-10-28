import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  EquipmentCondition,
  EquipmentDetail,
  EquipmentStatus,
  Laboratory,
  EquipmentCategory,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
} from '@/types/inventory';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { inventoryApi } from '@/lib/inventoryApi';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (equipment: EquipmentDetail) => void;
  initialData?: EquipmentDetail | null; // If provided, modal is in Edit mode
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEdit = !!initialData;

  // Form State
  const [assetTag, setAssetTag] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [laboratoryId, setLaboratoryId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState<EquipmentCondition>('GOOD');
  const [status, setStatus] = useState<EquipmentStatus>('AVAILABLE');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [warrantyExpiration, setWarrantyExpiration] = useState('');
  const [description, setDescription] = useState('');
  const [specificationsJson, setSpecificationsJson] = useState('');

  // Dropdown options
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  // Load dropdown categories and laboratories
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsLoadingOptions(true);

    Promise.all([inventoryApi.getLaboratories(false), inventoryApi.getCategories()])
      .then(([labs, cats]) => {
        if (!active) return;
        setLaboratories(labs);
        setCategories(cats);

        if (!isEdit) {
          if (labs.length > 0) setLaboratoryId(labs[0].id);
          if (cats.length > 0) setCategoryId(cats[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories/laboratories:', err);
      })
      .finally(() => {
        if (active) setIsLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, isEdit]);

  // Populate data when editing
  useEffect(() => {
    if (initialData) {
      setAssetTag(initialData.assetTag);
      setName(initialData.name);
      setCategoryId(initialData.category.id);
      setLaboratoryId(initialData.laboratory.id);
      setManufacturer(initialData.manufacturer);
      setModel(initialData.model);
      setSerialNumber(initialData.serialNumber || '');
      setCondition(initialData.condition);
      setStatus(initialData.status);
      setPurchaseDate(initialData.purchaseDate || '');
      setPurchaseCost(initialData.purchaseCost ? String(initialData.purchaseCost) : '');
      setWarrantyExpiration(initialData.warrantyExpiration || '');
      setDescription(initialData.description || '');
      setSpecificationsJson(initialData.specificationsJson || '');
    } else {
      setAssetTag('');
      setName('');
      setManufacturer('');
      setModel('');
      setSerialNumber('');
      setCondition('GOOD');
      setStatus('AVAILABLE');
      setPurchaseDate('');
      setPurchaseCost('');
      setWarrantyExpiration('');
      setDescription('');
      setSpecificationsJson('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Verify specifications is valid JSON if provided
    if (specificationsJson.trim()) {
      try {
        JSON.parse(specificationsJson.trim());
      } catch {
        setError({
          title: 'Invalid Technical Specifications',
          status: 400,
          detail: 'Specifications must be valid JSON format (e.g. {"magnification": "100x"}).',
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isEdit && initialData) {
        const payload: UpdateEquipmentPayload = {
          name: name.trim(),
          categoryId,
          laboratoryId,
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          serialNumber: serialNumber.trim() || undefined,
          condition,
          purchaseDate: purchaseDate || undefined,
          purchaseCost: purchaseCost ? parseFloat(purchaseCost) : undefined,
          warrantyExpiration: warrantyExpiration || undefined,
          description: description.trim() || undefined,
          specificationsJson: specificationsJson.trim() || undefined,
        };
        const updated = await inventoryApi.updateEquipment(initialData.id, payload);
        onSuccess(updated);
      } else {
        const payload: CreateEquipmentPayload = {
          assetTag: assetTag.trim(),
          name: name.trim(),
          categoryId,
          laboratoryId,
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          serialNumber: serialNumber.trim() || undefined,
          condition,
          status,
          purchaseDate: purchaseDate || undefined,
          purchaseCost: purchaseCost ? parseFloat(purchaseCost) : undefined,
          warrantyExpiration: warrantyExpiration || undefined,
          description: description.trim() || undefined,
          specificationsJson: specificationsJson.trim() || undefined,
        };
        const created = await inventoryApi.createEquipment(payload);
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: isEdit ? 'Update Failed' : 'Commissioning Failed',
          status: 500,
          detail: 'An error occurred while communicating with the equipment registry service.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-form-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80 shrink-0">
          <div>
            <h2 id="equipment-form-title" className="text-lg font-semibold text-foreground">
              {isEdit ? 'Update Instrument Specifications' : 'Commission New Laboratory Instrument'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? `Asset Tag: ${initialData?.assetTag} • Modify assigned lab facility or physical condition`
                : 'Register a new institutional asset into the university ledger'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs shrink-0 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{error.title}</p>
              <p>{error.detail}</p>
              {error.invalidParams && error.invalidParams.length > 0 && (
                <ul className="list-disc pl-4 mt-1.5 space-y-0.5">
                  {error.invalidParams.map((param, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{param.field}:</span> {param.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Top Row: Asset Tag & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="asset-tag" className="block text-xs font-medium text-foreground mb-1.5">
                Asset Tag * {isEdit && <span className="text-muted-foreground font-normal">(Immutable)</span>}
              </label>
              <input
                id="asset-tag"
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="e.g. EQ-MIC-001 or CH-SPEC-102"
                required
                disabled={isEdit}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="instrument-name" className="block text-xs font-medium text-foreground mb-1.5">
                Instrument Name *
              </label>
              <input
                id="instrument-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zeiss Axio Observer 7 Inverted"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Row 2: Category & Laboratory Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-foreground mb-1.5">
                Taxonomy Category *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={isLoadingOptions}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="laboratory" className="block text-xs font-medium text-foreground mb-1.5">
                Assigned Laboratory Facility *
              </label>
              <select
                id="laboratory"
                value={laboratoryId}
                onChange={(e) => setLaboratoryId(e.target.value)}
                required
                disabled={isLoadingOptions}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {laboratories.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} [{lab.code}] — {lab.building} ({lab.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Manufacturer, Model, Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="manufacturer" className="block text-xs font-medium text-foreground mb-1.5">
                Manufacturer *
              </label>
              <input
                id="manufacturer"
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Carl Zeiss AG"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-xs font-medium text-foreground mb-1.5">
                Model *
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Axio Observer 7"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="serialNumber" className="block text-xs font-medium text-foreground mb-1.5">
                Serial Number
              </label>
              <input
                id="serialNumber"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-892410-01"
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Row 4: Physical Condition & Lifecycle Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="condition" className="block text-xs font-medium text-foreground mb-1.5">
                Physical Condition *
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="NEW">NEW — Factory fresh, zero wear</option>
                <option value="EXCELLENT">EXCELLENT — Flawless calibration, minor cosmetic wear</option>
                <option value="GOOD">GOOD — Normal operational wear, fully calibrated</option>
                <option value="FAIR">FAIR — Operational with minor limitations</option>
                <option value="POOR">POOR — Sub-optimal performance, requires service</option>
                <option value="DAMAGED">DAMAGED — Inoperable, safety concern</option>
              </select>
            </div>
            {!isEdit && (
              <div>
                <label htmlFor="initial-status" className="block text-xs font-medium text-foreground mb-1.5">
                  Initial Operational Status
                </label>
                <select
                  id="initial-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="AVAILABLE">AVAILABLE (Ready for reservations)</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE (Initial calibration)</option>
                </select>
              </div>
            )}
          </div>

          {/* Row 5: Purchase Metadata & Warranty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="purchaseDate" className="block text-xs font-medium text-foreground mb-1.5">
                Commission Date
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="purchaseCost" className="block text-xs font-medium text-foreground mb-1.5">
                Capital Cost ($ USD)
              </label>
              <input
                id="purchaseCost"
                type="number"
                step="0.01"
                min="0"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                placeholder="e.g. 75000.00"
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="warrantyExpiration" className="block text-xs font-medium text-foreground mb-1.5">
                Warranty Expiration
              </label>
              <input
                id="warrantyExpiration"
                type="date"
                value={warrantyExpiration}
                onChange={(e) => setWarrantyExpiration(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-medium text-foreground mb-1.5">
              Instrument Overview & Usage Guidelines
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary research applications, lens configuration, user safety requirements..."
              rows={2}
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Specifications JSON */}
          <div>
            <label htmlFor="specs" className="block text-xs font-medium text-foreground mb-1.5">
              Technical Specifications (JSON format)
            </label>
            <textarea
              id="specs"
              value={specificationsJson}
              onChange={(e) => setSpecificationsJson(e.target.value)}
              placeholder={`{\n  "laser_lines": ["405nm", "488nm", "561nm", "640nm"],\n  "objective_lenses": ["10x", "20x", "63x Oil"],\n  "cooling": "Peltier -20C"\n}`}
              rows={3}
              className="w-full p-3 rounded-md border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" size="sm" isLoading={isSubmitting}>
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {isEdit ? 'Save Changes' : 'Register Instrument'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
