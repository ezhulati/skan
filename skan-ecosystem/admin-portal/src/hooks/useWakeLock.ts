import { useEffect, useRef, useState, useCallback } from 'react';

// TypeScript declarations for Screen Wake Lock API
declare global {
  interface WakeLockSentinel extends EventTarget {
    readonly released: boolean;
    readonly type: 'screen';
    release(): Promise<void>;
  }

  interface WakeLock {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  }

  interface Navigator {
    readonly wakeLock?: WakeLock;
  }
}

interface WakeLockOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
  onStatusChange?: (isActive: boolean) => void;
}

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  isEnabled: boolean;
  error: Error | null;
  acquire: () => Promise<void>;
  release: () => Promise<void>;
  toggle: () => Promise<void>;
}

/**
 * Custom hook for managing screen wake lock to prevent KDS displays from sleeping
 * Implements fallback strategy with muted video for unsupported browsers
 */
export const useWakeLock = (options: WakeLockOptions = {}): WakeLockState => {
  const { enabled = true, onError, onStatusChange } = options;
  
  const [isSupported] = useState(() => 'wakeLock' in navigator);
  const [isActive, setIsActive] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create fallback video element for unsupported browsers
  const createFallbackVideo = useCallback(() => {
    if (videoRef.current) return videoRef.current;

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.style.position = 'fixed';
    video.style.top = '-1px';
    video.style.left = '-1px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';
    
    // Create a minimal video data URL (1-second black frame)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    video.src = canvas.toDataURL();
    document.body.appendChild(video);
    videoRef.current = video;
    
    return video;
  }, []);

  // Acquire wake lock using native API
  const acquireNativeWakeLock = useCallback(async (): Promise<void> => {
    try {
      if (!isSupported || !navigator.wakeLock) {
        throw new Error('Wake Lock API not supported');
      }

      if (wakeLockRef.current) {
        return; // Already active
      }

      const wakeLock = await navigator.wakeLock.request('screen');
      wakeLockRef.current = wakeLock;

      wakeLock.addEventListener('release', () => {
        wakeLockRef.current = null;
        setIsActive(false);
        onStatusChange?.(false);
      });

      setIsActive(true);
      setError(null);
      onStatusChange?.(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to acquire wake lock');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [isSupported, onError, onStatusChange]);

  // Acquire wake lock using video fallback
  const acquireFallbackWakeLock = useCallback(async (): Promise<void> => {
    try {
      const video = createFallbackVideo();
      
      await video.play();
      
      // Keep video alive with periodic play calls
      fallbackIntervalRef.current = setInterval(() => {
        if (video.paused) {
          video.play().catch(() => {
            // Ignore errors - video might be removed
          });
        }
      }, 30000); // Every 30 seconds

      setIsActive(true);
      setError(null);
      onStatusChange?.(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to acquire fallback wake lock');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [createFallbackVideo, onError, onStatusChange]);

  // Main acquire function
  const acquire = useCallback(async (): Promise<void> => {
    if (!isEnabled) return;

    try {
      if (isSupported) {
        await acquireNativeWakeLock();
      } else {
        await acquireFallbackWakeLock();
      }
    } catch (err) {
      // If native fails, try fallback
      if (isSupported) {
        try {
          await acquireFallbackWakeLock();
        } catch (fallbackErr) {
          // Both methods failed
          console.warn('Both wake lock methods failed:', err, fallbackErr);
        }
      }
    }
  }, [isEnabled, isSupported, acquireNativeWakeLock, acquireFallbackWakeLock]);

  // Release wake lock
  const release = useCallback(async (): Promise<void> => {
    try {
      // Release native wake lock
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }

      // Clean up fallback
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.remove();
        videoRef.current = null;
      }

      setIsActive(false);
      setError(null);
      onStatusChange?.(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to release wake lock');
      setError(error);
      onError?.(error);
    }
  }, [onError, onStatusChange]);

  // Toggle wake lock
  const toggle = useCallback(async (): Promise<void> => {
    if (isActive) {
      await release();
    } else {
      await acquire();
    }
  }, [isActive, acquire, release]);

  // Auto-acquire on mount if enabled
  useEffect(() => {
    if (isEnabled) {
      acquire();
    }

    return () => {
      release();
    };
  }, [isEnabled]); // Only depend on isEnabled

  // Handle visibility change to re-acquire wake lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isEnabled && !isActive) {
        acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, isActive, acquire]);

  // Update enabled state
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  return {
    isSupported,
    isActive,
    isEnabled,
    error,
    acquire,
    release,
    toggle
  };
};

export default useWakeLock;