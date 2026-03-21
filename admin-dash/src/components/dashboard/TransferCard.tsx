import React from 'react';
import { 
  Ambulance, 
  Clock, 
  User, 
  MapPin, 
  Navigation, 
  Shield, 
  Users, 
  ArrowRightLeft, 
  AlertCircle,
  Car
} from "lucide-react";
import { decryptData } from '../../utils/encryption';

interface TransferCardProps {
  type: 'active' | 'pending' | 'incoming';
  data: any;
  onTrackLive?: (data: any) => void;
  onViewDriverDetails?: (driverId: string) => void;
  onCancelRequest?: (id: string) => void;
  onAccept?: (data: any) => void;
  onDecline?: (data: any) => void;
  onViewDetails?: (data: any) => void;
}

export const TransferCard: React.FC<TransferCardProps> = ({
  type,
  data,
  onTrackLive,
  onViewDriverDetails,
  onCancelRequest,
  onAccept,
  onDecline,
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-emerald-500";
      case "accepted":
        return "bg-blue-400 text-white";
      case "in_progress":
        return "bg-blue-600 text-white";
      case "on_way":
        return "bg-blue-500";
      case "busy":
        return "bg-orange-500";
      case "standby":
        return "bg-slate-500";
      case "offline":
        return "bg-red-600";
      case "in_transit":
        return "bg-blue-100 text-blue-700";
      case "patient_loaded":
        return "bg-green-100 text-green-700";
      case "dispatched":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      default:
        return "bg-emerald-600 text-white";
    }
  };

  // Standardize patient name, age, gender access
  const rawName = type === 'incoming' ? data.patientName : (typeof data.patient === 'object' ? data.patient.name : data.patient);
  const patientName = decryptData(rawName);
  const patientAge = decryptData(type === 'incoming' ? data.age : (data.patient?.age || data.age || 'N/A'));
  const patientGender = decryptData(type === 'incoming' ? data.gender : (data.patient?.gender || data.gender || 'N/A'));
  const symptoms = decryptData(data.symptoms);
  const pickup = data.pickup?.hospitalName || data.from || 'N/A';
  const destination = data.destination?.hospitalName || data.to || 'N/A';
  const eta = data.eta || 'Evaluating...';
  const distance = data.distance || '--';
  const priority = data.priority || 'standard';
  const status = data.status || (type === 'incoming' ? 'incoming' : 'pending');
  const timestamp = data.timestamp || (data.createdAt ? new Date(data.createdAt).toLocaleTimeString() : 'Just now');

  const cardStyles = {
    active: "hover:bg-accent/30 border-blue-500/20",
    pending: "hover:bg-orange-50/30 dark:hover:bg-orange-950/10 border-orange-500/20",
    incoming: "hover:border-red-400 border-red-500/20"
  };

  return (
    <div 
      className={`p-6 bg-card border rounded-xl transition-all duration-300 ${cardStyles[type]} ${type === 'incoming' ? 'cursor-pointer border-2' : ''}`}
      onClick={() => type === 'incoming' && onViewDetails?.(data)}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-bold text-foreground">
              {patientName}
            </h3>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(priority)}`}>
              {priority}
            </span>
            {type !== 'incoming' && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                {status.replace("_", " ").toUpperCase()}
              </span>
            )}
            {type === 'incoming' && (
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock size={14} /> {timestamp}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            ID: <span className="text-foreground/70 font-mono">{data.id}</span> • {patientAge}y • {patientGender}
            {type === 'incoming' && ` • ${data.incidentType || 'Emergency'}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {type === 'active' && (
            <button
              onClick={(e) => { e.stopPropagation(); onTrackLive?.(data); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-semibold text-sm cursor-pointer whitespace-nowrap"
            >
              <Navigation size={18} fill="currentColor" />
              Track Live
            </button>
          )}
          {type === 'incoming' && (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onAccept?.(data); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all active:scale-95 text-sm font-semibold"
              >
                Accept
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDecline?.(data); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95 text-sm font-semibold"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-accent/30 rounded-xl border border-border/50">
        <div className="relative pl-6 border-l-2 border-emerald-500">
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">
            {type === 'pending' ? 'Pickup Point' : 'Pickup'}
          </p>
          <p className="text-foreground font-semibold text-sm truncate">{pickup}</p>
        </div>
        <div className="relative pl-6 border-l-2 border-red-500">
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">
            {type === 'pending' ? 'Requested Destination' : 'Destination'}
          </p>
          <p className="text-foreground font-semibold text-sm truncate">{destination}</p>
        </div>
        <div className="relative pl-6 border-l-2 border-blue-500">
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">ETA Status</p>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <p className="text-blue-600 dark:text-blue-400 font-bold">{eta}</p>
          </div>
        </div>
      </div>

      {type === 'incoming' && symptoms && (
        <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/50">
          <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Symptoms & Condition</p>
          <p className="text-foreground text-sm line-clamp-2">{symptoms}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-4 border-t border-border/40">
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <Ambulance size={16} className="text-muted-foreground" />
          <span className="font-medium text-xs">{data.ambulance || data.ambulanceNumber || data.ambulanceId || 'Unit Assigned'}</span>
        </div>
        
        {(data.driverName || data.driverId || data.driver) ? (
          <div
            className={`flex items-center gap-2 text-sm ${onViewDriverDetails ? 'text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-md transition-colors' : 'text-foreground/80'}`}
            onClick={() => onViewDriverDetails && onViewDriverDetails(data.driverId || data.driver)}
          >
            <Users size={16} />
            <span className={`font-bold ${onViewDriverDetails ? 'underline underline-offset-4' : 'text-xs'}`}>
              {data.driverName || data.driver || 'Unit Assigned'}
            </span>
          </div>
        ) : (
          type === 'pending' && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <User size={12} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Requested By</p>
                <p className="text-foreground text-xs font-semibold">{data.requestedBy || 'Staff'}</p>
              </div>
            </div>
          )
        )}

        {type === 'active' && (
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Shield size={16} className="text-muted-foreground" />
            <span className="font-medium text-xs">Attendant: {data.attendant || 'Assigned'}</span>
          </div>
        )}

        {type === 'incoming' && (
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <User size={16} className="text-muted-foreground" />
            <span className="font-medium text-xs capitalize">{data.consciousness || 'Conscious'}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-foreground/80 ml-auto">
          <MapPin size={16} className="text-muted-foreground" />
          <span className="text-xs font-bold">{distance} km</span>
        </div>

        {(type === 'pending' || type === 'incoming') && (
          <div className='flex items-center gap-3 ml-auto md:ml-0'>
            {type === 'pending' && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewDriverDetails?.(data.driverId || data.driver); }}
                className="px-3 py-1.5 border border-border text-foreground rounded-lg hover:bg-accent active:scale-95 transition-all text-xs font-bold"
              >
                Details
              </button>
            )}
            {type === 'incoming' && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails?.(data); }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 text-xs font-bold"
              >
                View Details
              </button>
            )}
            {type === 'pending' && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancelRequest?.(data.id); }}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-foreground rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-all active:scale-95 text-xs font-bold whitespace-nowrap"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
