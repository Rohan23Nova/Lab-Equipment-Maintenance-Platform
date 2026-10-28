import React from 'react';
import { AuditEntityType } from '@/types/audit';
import { Cpu, Calendar, AlertTriangle, Wrench, User, Database } from 'lucide-react';

interface AuditEntityTypeBadgeProps {
  entityType: AuditEntityType;
}

export const AuditEntityTypeBadge: React.FC<AuditEntityTypeBadgeProps> = ({ entityType }) => {
  const getIcon = (type: AuditEntityType) => {
    switch (type) {
      case 'EQUIPMENT':
        return <Cpu className="w-3 h-3 text-cyan-500" />;
      case 'RESERVATION':
        return <Calendar className="w-3 h-3 text-accent-lime" />;
      case 'FAULT_REPORT':
        return <AlertTriangle className="w-3 h-3 text-amber-500" />;
      case 'WORK_ORDER':
        return <Wrench className="w-3 h-3 text-purple-400" />;
      case 'USER':
        return <User className="w-3 h-3 text-blue-400" />;
      case 'SYSTEM':
      default:
        return <Database className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/70 text-xs font-mono font-medium text-foreground">
      {getIcon(entityType)}
      <span>{entityType.replace('_', ' ')}</span>
    </span>
  );
};
