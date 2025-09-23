/**
 * Order Locking Hook
 * Prevents multiple staff members from working on the same order simultaneously
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface OrderLock {
  orderId: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
}

interface UseOrderLockingOptions {
  lockDurationMinutes?: number;
  heartbeatIntervalSeconds?: number;
  onLockConflict?: (orderId: string, lockedBy: string) => void;
  onLockExpired?: (orderId: string) => void;
}

interface UseOrderLockingReturn {
  lockedOrders: { [orderId: string]: string }; // orderId -> lockedBy
  lockOrder: (orderId: string) => Promise<boolean>;
  unlockOrder: (orderId: string) => void;
  isOrderLocked: (orderId: string) => boolean;
  getOrderLock: (orderId: string) => OrderLock | null;
  clearExpiredLocks: () => void;
}

const useOrderLocking = (options: UseOrderLockingOptions = {}): UseOrderLockingReturn => {
  const {
    lockDurationMinutes = 5,
    heartbeatIntervalSeconds = 30,
    onLockConflict,
    onLockExpired
  } = options;

  const { auth } = useAuth();
  const [locks, setLocks] = useState<{ [orderId: string]: OrderLock }>({});
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef<{ [orderId: string]: Date }>({});

  // Clean up expired locks
  const clearExpiredLocks = useCallback(() => {
    const now = new Date();
    
    setLocks(prevLocks => {
      const updatedLocks = { ...prevLocks };
      let hasExpiredLocks = false;

      Object.entries(updatedLocks).forEach(([orderId, lock]) => {
        if (now > lock.expiresAt) {
          delete updatedLocks[orderId];
          hasExpiredLocks = true;
          
          if (onLockExpired) {
            onLockExpired(orderId);
          }
        }
      });

      return hasExpiredLocks ? updatedLocks : prevLocks;
    });
  }, [onLockExpired]);

  // Lock an order
  const lockOrder = useCallback(async (orderId: string): Promise<boolean> => {
    if (!auth.user?.email) return false;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);

    // Check if order is already locked by someone else
    const existingLock = locks[orderId];
    if (existingLock && existingLock.lockedBy !== auth.user.email && now < existingLock.expiresAt) {
      if (onLockConflict) {
        onLockConflict(orderId, existingLock.lockedBy);
      }
      return false;
    }

    // Create or extend the lock
    const newLock: OrderLock = {
      orderId,
      lockedBy: auth.user.email,
      lockedAt: now,
      expiresAt
    };

    setLocks(prevLocks => ({
      ...prevLocks,
      [orderId]: newLock
    }));

    lastActivity.current[orderId] = now;

    // In a real implementation, this would sync with the server
    try {
      // TODO: Call API to register lock on server
      // await restaurantApiService.lockOrder(orderId, {
      //   lockedBy: auth.user.email,
      //   expiresAt
      // });
      console.log(`Order ${orderId} locked by ${auth.user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to lock order on server:', error);
      // Remove local lock if server lock fails
      setLocks(prevLocks => {
        const updated = { ...prevLocks };
        delete updated[orderId];
        return updated;
      });
      return false;
    }
  }, [auth.user?.email, lockDurationMinutes, locks, onLockConflict]);

  // Unlock an order
  const unlockOrder = useCallback((orderId: string) => {
    if (!auth.user?.email) return;

    const lock = locks[orderId];
    if (!lock || lock.lockedBy !== auth.user.email) return;

    setLocks(prevLocks => {
      const updated = { ...prevLocks };
      delete updated[orderId];
      return updated;
    });

    delete lastActivity.current[orderId];

    // In a real implementation, this would sync with the server
    try {
      // TODO: Call API to release lock on server
      // await restaurantApiService.unlockOrder(orderId);
      console.log(`Order ${orderId} unlocked by ${auth.user.email}`);
    } catch (error) {
      console.error('Failed to unlock order on server:', error);
    }
  }, [auth.user?.email, locks]);

  // Check if an order is locked
  const isOrderLocked = useCallback((orderId: string): boolean => {
    const lock = locks[orderId];
    if (!lock) return false;

    const now = new Date();
    if (now > lock.expiresAt) {
      // Lock has expired, remove it
      setLocks(prevLocks => {
        const updated = { ...prevLocks };
        delete updated[orderId];
        return updated;
      });
      return false;
    }

    return lock.lockedBy !== auth.user?.email;
  }, [locks, auth.user?.email]);

  // Get order lock information
  const getOrderLock = useCallback((orderId: string): OrderLock | null => {
    const lock = locks[orderId];
    if (!lock) return null;

    const now = new Date();
    if (now > lock.expiresAt) {
      return null;
    }

    return lock;
  }, [locks]);

  // Send heartbeat to extend locks for active orders
  const sendHeartbeat = useCallback(() => {
    if (!auth.user?.email) return;

    const now = new Date();
    const updatedLocks: { [orderId: string]: OrderLock } = {};
    let hasUpdates = false;

    Object.entries(locks).forEach(([orderId, lock]) => {
      if (lock.lockedBy === auth.user?.email) {
        const lastActivityTime = lastActivity.current[orderId];
        const timeSinceActivity = lastActivityTime ? now.getTime() - lastActivityTime.getTime() : 0;
        
        // Only extend locks for orders with recent activity (last 2 minutes)
        if (timeSinceActivity < 2 * 60 * 1000) {
          const newExpiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);
          updatedLocks[orderId] = {
            ...lock,
            expiresAt: newExpiresAt
          };
          hasUpdates = true;
          
          // TODO: Send heartbeat to server
          // restaurantApiService.heartbeatOrderLock(orderId, newExpiresAt);
        }
      } else {
        updatedLocks[orderId] = lock;
      }
    });

    if (hasUpdates) {
      setLocks(updatedLocks);
    }
  }, [auth.user?.email, locks, lockDurationMinutes]);

  // Track user activity on orders
  const trackActivity = useCallback((orderId: string) => {
    lastActivity.current[orderId] = new Date();
  }, []);

  // Set up heartbeat interval
  useEffect(() => {
    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat();
      clearExpiredLocks();
    }, heartbeatIntervalSeconds * 1000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [sendHeartbeat, clearExpiredLocks, heartbeatIntervalSeconds]);

  // Clean up locks when component unmounts
  useEffect(() => {
    return () => {
      // Unlock all orders locked by this user
      Object.entries(locks).forEach(([orderId, lock]) => {
        if (lock.lockedBy === auth.user?.email) {
          unlockOrder(orderId);
        }
      });
    };
  }, []); // Only run on unmount

  // Create lockedOrders map for easy consumption
  const lockedOrders = Object.entries(locks).reduce((acc, [orderId, lock]) => {
    const now = new Date();
    if (now <= lock.expiresAt && lock.lockedBy !== auth.user?.email) {
      acc[orderId] = lock.lockedBy;
    }
    return acc;
  }, {} as { [orderId: string]: string });

  return {
    lockedOrders,
    lockOrder,
    unlockOrder,
    isOrderLocked,
    getOrderLock,
    clearExpiredLocks
  };
};

export default useOrderLocking;