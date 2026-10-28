import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem, NotificationType } from '@/types/notification';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  ShieldCheck,
  XCircle,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
  onNavigate?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onNavigate,
}) => {
  const navigate = useNavigate();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'RESERVATION_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'RESERVATION_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'RESERVATION_CANCELLED':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'RESERVATION_REMINDER':
        return <Clock className="w-4 h-4 text-accent-lime shrink-0" />;
      case 'CRITICAL_FAULT_LOCKDOWN':
        return <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'FAULT_REPORTED':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'WORK_ORDER_ASSIGNED':
      case 'WORK_ORDER_COMPLETED':
        return <Wrench className="w-4 h-4 text-accent-lime shrink-0" />;
      case 'EQUIPMENT_RETURNED_TO_SERVICE':
        return <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'ADMIN_USER_UPDATED':
        return <UserCheck className="w-4 h-4 text-accent-lime shrink-0" />;
      default:
        return <Calendar className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (onNavigate) {
      onNavigate();
    }
    if (notification.navigationTarget) {
      navigate(notification.navigationTarget);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
        notification.isRead
          ? 'bg-card border-border/70 hover:border-border text-muted-foreground'
          : 'bg-card border-accent-lime/40 hover:border-accent-lime text-foreground shadow-subtle'
      }`}
    >
      {!notification.isRead && (
        <span
          className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-lime"
          title="Unread alert"
        />
      )}

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted/40 border border-border/60 mt-0.5">
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-semibold truncate ${
                notification.isRead ? 'text-foreground/80' : 'text-foreground'
              }`}
            >
              {notification.title}
            </h4>
          </div>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
            <span className="font-mono">{formatDate(notification.createdAt)}</span>
            {notification.navigationTarget && (
              <span className="inline-flex items-center gap-1 text-accent-lime hover:underline font-medium">
                <span>View target</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
