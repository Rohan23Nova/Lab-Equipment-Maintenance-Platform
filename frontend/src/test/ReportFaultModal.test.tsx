import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportFaultModal } from '@/components/maintenance/ReportFaultModal';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { FaultReport } from '@/types/maintenance';

vi.mock('@/lib/maintenanceApi', () => ({
  maintenanceApi: {
    reportFault: vi.fn(),
  },
}));

describe('ReportFaultModal', () => {
  const sampleFaultReport: FaultReport = {
    id: 'fault-1',
    faultNumber: 'FLT-2026-0001',
    equipmentId: 'eq-100',
    equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
    equipmentAssetTag: 'EQ-PHYS-001',
    laboratoryName: 'Advanced Materials Facility',
    reportedById: 'user-1',
    reportedByName: 'Alice Student',
    reportedByEmail: 'alice@university.edu',
    title: 'Goniometer rotation axis motor jammed',
    description: 'During 2-theta scan, stage motor emitted high pitch squeal and halted.',
    severity: 'HIGH',
    status: 'OPEN',
    reportedAt: '2026-10-28T14:00:00Z',
    createdAt: '2026-10-28T14:00:00Z',
    updatedAt: '2026-10-28T14:00:00Z',
  };

  it('renders modal with instrument details and input fields', () => {
    render(
      <ReportFaultModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        equipmentId="eq-100"
        equipmentName="Rigaku SmartLab X-Ray Diffractometer"
        equipmentAssetTag="EQ-PHYS-001"
      />
    );

    expect(screen.getByText(/Report Equipment Fault/i)).toBeInTheDocument();
    expect(screen.getByText(/Rigaku SmartLab X-Ray Diffractometer/i)).toBeInTheDocument();
    expect(screen.getByText('EQ-PHYS-001')).toBeInTheDocument();
    expect(screen.getByLabelText(/Fault Summary Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Detailed Description/i)).toBeInTheDocument();
    expect(screen.getByText(/Incident Severity Level/i)).toBeInTheDocument();
  });

  it('displays critical safety alert banner when CRITICAL severity is chosen', async () => {
    const user = userEvent.setup();
    render(
      <ReportFaultModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        equipmentId="eq-100"
        equipmentName="Rigaku SmartLab X-Ray Diffractometer"
        equipmentAssetTag="EQ-PHYS-001"
      />
    );

    // Default severity is MEDIUM - critical warning should not be visible
    expect(screen.queryByText(/CRITICAL SEVERITY LOCKDOWN POLICY/i)).not.toBeInTheDocument();

    // Click CRITICAL severity button
    const criticalButton = screen.getByRole('button', { name: 'CRITICAL' });
    await user.click(criticalButton);

    // Critical banner should now be visible
    expect(screen.getByText(/CRITICAL SEVERITY LOCKDOWN POLICY/i)).toBeInTheDocument();
    expect(
      screen.getByText(/immediately place this instrument under maintenance lockdown/i)
    ).toBeInTheDocument();
  });

  it('submits defect report successfully and calls onSuccess', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(maintenanceApi.reportFault).mockResolvedValueOnce(sampleFaultReport);

    render(
      <ReportFaultModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={onSuccess}
        equipmentId="eq-100"
        equipmentName="Rigaku SmartLab X-Ray Diffractometer"
        equipmentAssetTag="EQ-PHYS-001"
      />
    );

    await user.type(screen.getByLabelText(/Fault Summary Title/i), 'Goniometer rotation axis motor jammed');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'During 2-theta scan, stage motor emitted high pitch squeal and halted.'
    );

    // Click HIGH severity button
    const highBtn = screen.getByRole('button', { name: 'HIGH' });
    await user.click(highBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit Fault Report/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(maintenanceApi.reportFault).toHaveBeenCalledWith({
        equipmentId: 'eq-100',
        title: 'Goniometer rotation axis motor jammed',
        description: 'During 2-theta scan, stage motor emitted high pitch squeal and halted.',
        severity: 'HIGH',
      });
      expect(onSuccess).toHaveBeenCalledWith(sampleFaultReport);
    });
  });
});
