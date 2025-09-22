/**
 * Enhanced KDS Notification System
 * Provides comprehensive audio/visual notifications optimized for Albanian restaurants
 * Supports escalation, multiple alert types, and accessibility features
 */

import { useCallback, useRef, useState, useEffect } from 'react';

export interface NotificationSound {
  id: string;
  name: string;
  nameAlbanian: string;
  description: string;
  descriptionAlbanian: string;
  audioData: string; // Base64 encoded audio
  duration: number; // milliseconds
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationSettings {
  audioEnabled: boolean;
  visualEnabled: boolean;
  browserEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number; // 0-1
  selectedSounds: {
    newOrder: string;
    urgent: string;
    ready: string;
    error: string;
  };
  escalation: {
    enabled: boolean;
    timeThreshold: number; // minutes before escalation
    escalationSound: string;
    escalationVolume: number;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
}

export interface NotificationEvent {
  id: string;
  type: 'new-order' | 'urgent-order' | 'ready-order' | 'error' | 'escalation';
  title: string;
  titleAlbanian: string;
  message: string;
  messageAlbanian: string;
  orderId?: string;
  priority: NotificationSound['priority'];
  timestamp: string;
  acknowledged: boolean;
}

interface UseKDSNotificationsOptions {
  settings?: Partial<NotificationSettings>;
  onSettingsChange?: (settings: NotificationSettings) => void;
}

interface UseKDSNotificationsReturn {
  settings: NotificationSettings;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  playNotification: (type: NotificationEvent['type'], event?: Partial<NotificationEvent>) => Promise<void>;
  showVisualAlert: (event: NotificationEvent) => void;
  requestPermissions: () => Promise<boolean>;
  availableSounds: NotificationSound[];
  testSound: (soundId: string) => Promise<void>;
  isPlaying: boolean;
  activeAlerts: NotificationEvent[];
  acknowledgeAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
}

// Pre-defined notification sounds optimized for kitchen environments
const NOTIFICATION_SOUNDS: NotificationSound[] = [
  {
    id: 'bell-soft',
    name: 'Soft Bell',
    nameAlbanian: 'Zile e Butë',
    description: 'Gentle bell sound for new orders',
    descriptionAlbanian: 'Tingull i butë zile për porosite e reja',
    audioData: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuY3e/AcCwCKHfN7tqROgcTU6Pe5qlXFAhJot3vs2AeBzOj0e7ItS4AH27Z7t2UOgYNVKzt56VZFgVFp9/xs2EcCjKX3O7JtW0ABSaA3fjPcywD',
    duration: 800,
    priority: 'medium'
  },
  {
    id: 'chime-urgent',
    name: 'Urgent Chime',
    nameAlbanian: 'Tingull Urgjent',
    description: 'Attention-grabbing chime for urgent orders',
    descriptionAlbanian: 'Tingull që tërheq vëmendjen për porosite urgjente',
    audioData: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuY3e/AcCwCKHfN7tqROgcTU6Pe5qlXFAhJot3vs2AeBzOj0e7ItS4AH27Z7t2UOgYNVKzt56VZFgVFp9/xs2EcCjKX3O7JtW0ABSaA3fjPcywD',
    duration: 1200,
    priority: 'high'
  },
  {
    id: 'success-tone',
    name: 'Success Tone',
    nameAlbanian: 'Tingull Suksesi',
    description: 'Pleasant tone for completed orders',
    descriptionAlbanian: 'Tingull i këndshëm për porosite e kompletuar',
    audioData: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuY3e/AcCwCKHfN7tqROgcTU6Pe5qlXFAhJot3vs2AeBzOj0e7ItS4AH27Z7t2UOgYNVKzt56VZFgVFp9/xs2EcCjKX3O7JtW0ABSaA3fjPcywD',
    duration: 600,
    priority: 'low'
  },
  {
    id: 'alert-critical',
    name: 'Critical Alert',
    nameAlbanian: 'Alarm Kritik',
    description: 'Loud alert for critical situations',
    descriptionAlbanian: 'Alarm i fortë për situata kritike',
    audioData: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuY3e/AcCwCKHfN7tqROgcTU6Pe5qlXFAhJot3vs2AeBzOj0e7ItS4AH27Z7t2UOgYNVKzt56VZFgVFp9/xs2EcCjKX3O7JtW0ABSaA3fjPcywD',
    duration: 2000,
    priority: 'critical'
  }
];

const DEFAULT_SETTINGS: NotificationSettings = {
  audioEnabled: true,
  visualEnabled: true,
  browserEnabled: false,
  vibrationEnabled: true,
  volume: 0.7,
  selectedSounds: {
    newOrder: 'bell-soft',
    urgent: 'chime-urgent',
    ready: 'success-tone',
    error: 'alert-critical'
  },
  escalation: {
    enabled: true,
    timeThreshold: 5, // 5 minutes
    escalationSound: 'chime-urgent',
    escalationVolume: 0.9
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false
  }
};

export const useKDSNotifications = (options: UseKDSNotificationsOptions = {}): UseKDSNotificationsReturn => {
  const { settings: initialSettings, onSettingsChange } = options;

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('skan-kds-notifications');
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...DEFAULT_SETTINGS, ...parsed, ...initialSettings };
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<NotificationEvent[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const escalationTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('skan-kds-notifications', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  // Initialize audio context
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = settings.volume;
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('[KDS Notifications] Audio error:', e);
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [settings.volume]);

  // Update audio volume when settings change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
    }
  }, [settings.volume]);

  // Clear escalation timers on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timers = escalationTimersRef.current;
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Get sound by ID
  const getSound = useCallback((soundId: string): NotificationSound | null => {
    return NOTIFICATION_SOUNDS.find(sound => sound.id === soundId) || null;
  }, []);

  // Test sound playback
  const testSound = useCallback(async (soundId: string): Promise<void> => {
    const sound = getSound(soundId);
    if (!sound || !audioRef.current) return;

    try {
      setIsPlaying(true);
      audioRef.current.src = sound.audioData;
      await audioRef.current.play();
    } catch (error) {
      console.error('[KDS Notifications] Test sound failed:', error);
      setIsPlaying(false);
    }
  }, [getSound]);

  // Play audio notification
  const playAudio = useCallback(async (soundId: string, volume?: number): Promise<void> => {
    if (!settings.audioEnabled || !audioRef.current) return;

    const sound = getSound(soundId);
    if (!sound) return;

    try {
      setIsPlaying(true);
      audioRef.current.volume = volume || settings.volume;
      audioRef.current.src = sound.audioData;
      await audioRef.current.play();
    } catch (error) {
      console.error('[KDS Notifications] Audio playback failed:', error);
      setIsPlaying(false);
    }
  }, [settings.audioEnabled, settings.volume, getSound]);

  // Show browser notification
  const showBrowserNotification = useCallback((event: NotificationEvent): void => {
    if (!settings.browserEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(event.titleAlbanian || event.title, {
      body: event.messageAlbanian || event.message,
      icon: '/favicon-192x192.png',
      badge: '/favicon-192x192.png',
      tag: `kds-${event.type}-${event.id}`,
      requireInteraction: event.priority === 'critical',
      silent: !settings.audioEnabled
    });

    // Auto-close after 5 seconds for non-critical notifications
    if (event.priority !== 'critical') {
      setTimeout(() => notification.close(), 5000);
    }
  }, [settings.browserEnabled, settings.audioEnabled]);

  // Trigger device vibration
  const triggerVibration = useCallback((pattern: number[]): void => {
    if (!settings.vibrationEnabled || !('vibrate' in navigator)) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('[KDS Notifications] Vibration failed:', error);
    }
  }, [settings.vibrationEnabled]);

  // Show visual alert
  const showVisualAlert = useCallback((event: NotificationEvent): void => {
    if (!settings.visualEnabled) return;

    // Add to active alerts
    setActiveAlerts(prev => [event, ...prev.slice(0, 4)]); // Keep max 5 alerts

    // Visual flash effect based on priority
    const flashColor = {
      'low': '#28a745',
      'medium': '#ffc107', 
      'high': '#fd7e14',
      'critical': '#dc3545'
    }[event.priority];

    if (flashColor) {
      const originalBg = document.body.style.backgroundColor;
      document.body.style.backgroundColor = flashColor;
      document.body.style.transition = 'background-color 0.2s';
      
      setTimeout(() => {
        document.body.style.backgroundColor = originalBg;
      }, 300);
    }

    // Auto-acknowledge non-critical alerts after 10 seconds
    if (event.priority !== 'critical') {
      setTimeout(() => {
        acknowledgeAlert(event.id);
      }, 10000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.visualEnabled]); // acknowledgeAlert creates circular dependency

  // Setup escalation timer
  const setupEscalation = useCallback((event: NotificationEvent): void => {
    if (!settings.escalation.enabled || event.type !== 'new-order') return;

    const timerId = setTimeout(() => {
      // Escalate to urgent
      const escalatedEvent: NotificationEvent = {
        ...event,
        type: 'urgent-order',
        title: 'Urgent Order Alert',
        titleAlbanian: 'Alarm Porosie Urgjente',
        message: `Order ${event.orderId} needs immediate attention!`,
        messageAlbanian: `Porosia ${event.orderId} ka nevojë për vëmendje të menjëhershme!`,
        priority: 'critical'
      };

      playNotification('escalation', escalatedEvent);
    }, settings.escalation.timeThreshold * 60 * 1000);

    if (event.orderId) {
      escalationTimersRef.current.set(event.orderId, timerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.escalation]); // playNotification creates circular dependency

  // Main notification function
  const playNotification = useCallback(async (
    type: NotificationEvent['type'],
    event?: Partial<NotificationEvent>
  ): Promise<void> => {
    // Create notification event
    const notificationEvent: NotificationEvent = {
      id: `${type}-${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      priority: 'medium',
      title: 'KDS Notification',
      titleAlbanian: 'Njoftim KDS',
      message: 'New kitchen notification',
      messageAlbanian: 'Njoftim i ri nga kuzhina',
      ...event
    };

    // Determine sound based on type
    const soundId = {
      'new-order': settings.selectedSounds.newOrder,
      'urgent-order': settings.selectedSounds.urgent,
      'ready-order': settings.selectedSounds.ready,
      'error': settings.selectedSounds.error,
      'escalation': settings.escalation.escalationSound
    }[type];

    // Determine vibration pattern
    const vibrationPattern = {
      'new-order': [200],
      'urgent-order': [100, 100, 100, 100, 200],
      'ready-order': [200, 100, 200],
      'error': [500],
      'escalation': [200, 100, 200, 100, 200, 100, 500]
    }[type];

    console.log('[KDS Notifications] Playing notification:', notificationEvent);

    // Execute notifications concurrently
    await Promise.allSettled([
      // Audio notification
      soundId ? playAudio(soundId, type === 'escalation' ? settings.escalation.escalationVolume : undefined) : Promise.resolve(),
      
      // Browser notification
      Promise.resolve(showBrowserNotification(notificationEvent)),
      
      // Vibration
      vibrationPattern ? Promise.resolve(triggerVibration(vibrationPattern)) : Promise.resolve()
    ]);

    // Visual alert
    showVisualAlert(notificationEvent);

    // Setup escalation for new orders
    if (type === 'new-order') {
      setupEscalation(notificationEvent);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, playAudio, showBrowserNotification, triggerVibration, showVisualAlert]); // setupEscalation creates circular dependency

  // Request browser permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const permissions: boolean[] = [];

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      permissions.push(permission === 'granted');
    } else {
      permissions.push(Notification.permission === 'granted');
    }

    return permissions.every(Boolean);
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string): void => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    // Clear escalation timer if this was a new order
    const alert = activeAlerts.find(a => a.id === alertId);
    if (alert?.orderId && escalationTimersRef.current.has(alert.orderId)) {
      clearTimeout(escalationTimersRef.current.get(alert.orderId));
      escalationTimersRef.current.delete(alert.orderId);
    }
  }, [activeAlerts]);

  // Clear all alerts
  const clearAllAlerts = useCallback((): void => {
    setActiveAlerts([]);
    escalationTimersRef.current.forEach(timer => clearTimeout(timer));
    escalationTimersRef.current.clear();
  }, []);

  return {
    settings,
    updateSettings,
    playNotification,
    showVisualAlert,
    requestPermissions,
    availableSounds: NOTIFICATION_SOUNDS,
    testSound,
    isPlaying,
    activeAlerts,
    acknowledgeAlert,
    clearAllAlerts
  };
};

export default useKDSNotifications;