# SKAN.AL Kitchen Display System (KDS) Implementation Plan

## Executive Summary

Transform SKAN.AL admin portal into a production-ready Kitchen Display System running on iPads, Android tablets, and kitchen TVs. This approach provides immediate deployment capability without specialized hardware, targeting Albanian restaurants with a bulletproof "never sleep, never miss, never duplicate" system.

## Strategic Overview

### **Dashboard-as-KDS Approach**
- Leverage existing React admin portal infrastructure
- Deploy on consumer tablets (iPad 9th gen, Android 10+ inch)
- Web-based solution = instant updates, zero hardware lock-in
- Cost advantage: €200 iPad vs €2000 specialized KDS

### **Market Fit: Albanian Restaurants**
- Staff comfortable with iOS/Android interfaces
- Reliable WiFi infrastructure in tourist areas
- Cost-sensitive market requiring flexible solutions
- Immediate deployment without specialized hardware installation

## Core Requirements: Never Sleep, Never Miss, Never Duplicate

### **1. "Never Sleep" Implementation**

**Problem**: Current system allows screens to sleep, missing critical orders
**Solution**: Multi-layered wake prevention

```typescript
// Primary: Screen Wake Lock API
const useWakeLock = () => {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  
  const requestWakeLock = async () => {
    try {
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      showIndicator("📌 Ekrani nuk do të fiket");
    } catch (err) {
      // Fallback: muted video loop trick
      enableVideoFallback();
    }
  };
};

// Secondary: PWA Full-Screen Mode
const manifest = {
  "name": "SKAN.AL Kitchen Display",
  "short_name": "SKAN KDS",
  "display": "fullscreen",
  "orientation": "landscape-primary"
};
```

**Implementation Details**:
- Screen Wake Lock API for supported browsers
- Muted video loop fallback for unsupported devices
- PWA manifest for full-screen kiosk mode
- iOS Guided Access / Android App Pinning support documentation

### **2. "Never Miss" Real-Time Architecture**

**Problem**: 10-second polling = potential missed orders during rush
**Solution**: WebSocket real-time with resilient fallback

```typescript
// WebSocket Event Architecture
interface OrderEvent {
  type: 'order.created' | 'order.updated' | 'order.cancelled';
  payload: Order;
  version: number;
  timestamp: string;
  venueId: string;
}

// Resilient Connection Management
const useResilientWebSocket = (venueId: string) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  
  const connect = useCallback(() => {
    socketRef.current = io(`wss://api.skan.al/venues/${venueId}/orders`, {
      transports: ['websocket'],
      timeout: 5000
    });
    
    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    });
    
    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      setTimeout(() => {
        reconnectAttempts.current++;
        setConnectionStatus('reconnecting');
        connect();
      }, delay);
    });
  }, [venueId]);
};
```

**Enhanced Notification System**:
```typescript
const useKitchenNotifications = () => {
  const audioRef = useRef<HTMLAudioElement>();
  
  const playNewOrderSound = () => {
    // Audio notification
    audioRef.current?.play().catch(console.error);
    
    // Mobile vibration
    navigator.vibrate?.(200);
    
    // Visual flash with proper timing
    document.body.classList.add('flash-new-order');
    setTimeout(() => document.body.classList.remove('flash-new-order'), 300);
    
    // Browser notification (if permitted)
    if (Notification.permission === 'granted') {
      new Notification('🔔 Porosinë e re!', {
        body: 'Keni marrë një porosi të re që duhet përpunuar.',
        icon: '/favicon.ico',
        tag: 'new-orders'
      });
    }
  };
};
```

### **3. "Never Duplicate" Idempotency System**

**Problem**: Network issues can cause duplicate order processing
**Solution**: Version-based idempotency with client-side deduplication

```json
{
  "order_id": "SKN-20250922-008",
  "version": 3,
  "venueId": "beach-bar-durres",
  "status": "NEW",
  "items": [
    {
      "sku": "SAL-GRK",
      "name": "Greek Salad", 
      "quantity": 2,
      "price": 900,
      "notes": "No onions",
      "stations": ["COLD"]
    }
  ],
  "audit": {
    "created_at": "2025-09-22T11:29:31Z",
    "updated_at": "2025-09-22T11:32:15Z"
  }
}
```

```typescript
// Client-side deduplication
const handleOrderUpdate = (orderData: Order) => {
  setOrders(prev => {
    const existing = prev.find(o => o.id === orderData.id);
    if (existing && existing.version >= orderData.version) {
      return prev; // Ignore older/duplicate versions
    }
    return prev.map(o => o.id === orderData.id ? orderData : o);
  });
};
```

## Device-Responsive Kitchen Layouts

### **Phone Mode** (< 768px)
- Vertical list with swipe actions
- Large touch targets for gloves
- Single-column order cards
- Pull-to-refresh gesture

### **Tablet Mode** (768px - 1200px) 
- 2-3 column card layout (current design)
- Touch-optimized buttons
- Drag-and-drop order management
- Split-view for order details

### **Kitchen TV Mode** (> 1200px)
- Horizontal lane view by cooking stations
- Large text for distance viewing
- Color-coded status indicators
- Auto-scroll for long order lists

```typescript
const useDeviceLayout = () => {
  const [layout, setLayout] = useState<'phone' | 'tablet' | 'tv'>('tablet');
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      if (width < 768) setLayout('phone');
      else if (width < 1200) setLayout('tablet');
      else setLayout('tv');
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  
  return layout;
};
```

## Offline Resilience Architecture

### **IndexedDB Local Cache**
```typescript
const useOfflineOrders = () => {
  const [cachedOrders, setCachedOrders] = useState<Order[]>([]);
  
  const cacheOrders = async (orders: Order[]) => {
    const db = await openDB('skan-orders', 1, {
      upgrade(db) {
        db.createObjectStore('orders', { keyPath: 'id' });
      },
    });
    
    const tx = db.transaction('orders', 'readwrite');
    await Promise.all(orders.map(order => tx.store.put(order)));
    await tx.done;
  };
  
  const loadCachedOrders = async () => {
    const db = await openDB('skan-orders', 1);
    return await db.getAll('orders');
  };
};
```

### **Connection Status UI**
```tsx
const ConnectionStatus = ({ status }: { status: ConnectionStatus }) => {
  if (status === 'disconnected') {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              ⚠️ Offline – po ruajmë porositë lokalisht
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (status === 'reconnecting') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">
          🔄 Duke u rikonektuar...
        </p>
      </div>
    );
  }
  
  return null;
};
```

## Time-Based Order Escalation

### **Visual Escalation System**
```typescript
const useOrderAging = (order: Order) => {
  const [ageMinutes, setAgeMinutes] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const age = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      setAgeMinutes(age);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [order.createdAt]);
  
  const getEscalationLevel = () => {
    if (ageMinutes < 5) return { level: 'normal', color: 'green', bgColor: 'bg-green-50' };
    if (ageMinutes < 10) return { level: 'warning', color: 'amber', bgColor: 'bg-amber-50' };
    return { level: 'critical', color: 'red', bgColor: 'bg-red-50' };
  };
  
  return { ageMinutes, escalation: getEscalationLevel() };
};
```

### **Escalation UI Components**
```tsx
const OrderCard = ({ order }: { order: Order }) => {
  const { ageMinutes, escalation } = useOrderAging(order);
  
  return (
    <div className={`border-l-4 border-${escalation.color}-400 ${escalation.bgColor} p-4`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{order.orderNumber}</h3>
          <p className="text-sm text-gray-600">Tavolina {order.tableNumber}</p>
        </div>
        <div className={`text-${escalation.color}-600 font-semibold`}>
          {ageMinutes}m
        </div>
      </div>
      
      {/* Order items */}
      <div className="mt-3 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{item.quantity}x {item.name}</span>
            <span>{item.notes && `(${item.notes})`}</span>
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="mt-4 flex space-x-2">
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          Pranoje
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Duke u përgatitur
        </button>
      </div>
    </div>
  );
};
```

## Albanian Kitchen Operations

### **Multi-Language Support**
```typescript
// Enhanced language context for kitchen operations
const kitchenTranslations = {
  sq: {
    'new_order': 'Porosinë e re',
    'accept_order': 'Pranoje porosinë',
    'preparing': 'Duke u përgatitur', 
    'ready_for_pickup': 'Gati për marrje',
    'served': 'E shërbyer',
    'order_age': 'Koha: {minutes} minuta',
    'station_hot': 'Stacioni i nxehtë',
    'station_cold': 'Stacioni i ftohtë',
    'station_bar': 'Bar',
    'station_grill': 'Skarë'
  },
  en: {
    'new_order': 'New Order',
    'accept_order': 'Accept Order', 
    'preparing': 'Preparing',
    'ready_for_pickup': 'Ready for Pickup',
    'served': 'Served',
    'order_age': 'Age: {minutes} minutes',
    'station_hot': 'Hot Station',
    'station_cold': 'Cold Station', 
    'station_bar': 'Bar',
    'station_grill': 'Grill'
  }
};
```

### **Currency Formatting**
```typescript
const formatAlbanianLek = (amount: number) => {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: 'ALL',
    minimumFractionDigits: 0
  }).format(amount);
};

// Example output: "16.100 Lek"
```

### **Kitchen Role Management**
```typescript
interface KitchenRole {
  role: 'kuzhina' | 'salla' | 'menaxher';
  permissions: {
    canAcceptOrders: boolean;
    canMarkReady: boolean;
    canMarkServed: boolean;
    canVoidOrders: boolean;
    canManageStations: boolean;
  };
}

const rolePermissions: Record<string, KitchenRole['permissions']> = {
  kuzhina: {
    canAcceptOrders: true,
    canMarkReady: true,
    canMarkServed: false,
    canVoidOrders: false,
    canManageStations: false
  },
  salla: {
    canAcceptOrders: true,
    canMarkReady: false,
    canMarkServed: true,
    canVoidOrders: false,
    canManageStations: false
  },
  menaxher: {
    canAcceptOrders: true,
    canMarkReady: true,
    canMarkServed: true,
    canVoidOrders: true,
    canManageStations: true
  }
};
```

## Station-Based Order Routing

### **Kitchen Station Architecture**
```typescript
interface KitchenStation {
  id: string;
  name: string;
  nameAlbanian: string;
  color: string;
  emoji: string;
}

const kitchenStations: KitchenStation[] = [
  { id: 'hot', name: 'Hot Kitchen', nameAlbanian: 'Kuzhina e Nxehtë', color: 'red', emoji: '🔥' },
  { id: 'cold', name: 'Cold Station', nameAlbanian: 'Stacioni i Ftohtë', color: 'blue', emoji: '🥗' },
  { id: 'bar', name: 'Bar', nameAlbanian: 'Bar', color: 'purple', emoji: '🍹' },
  { id: 'grill', name: 'Grill', nameAlbanian: 'Skarë', color: 'orange', emoji: '🔥' }
];

// Enhanced order item with station routing
interface OrderItem {
  sku: string;
  name: string;
  nameAlbanian?: string;
  quantity: number;
  price: number;
  stations: string[]; // Multiple stations possible
  notes?: string;
  allergens?: string[];
}
```

### **Station View Component**
```tsx
const StationView = ({ station }: { station: KitchenStation }) => {
  const { orders } = useOrders();
  
  const stationOrders = orders.filter(order =>
    order.items.some(item => item.stations.includes(station.id))
  );
  
  return (
    <div className="station-lane flex-1 min-w-80">
      <div className={`bg-${station.color}-600 text-white p-4 rounded-t-lg`}>
        <h2 className="text-xl font-bold">
          {station.emoji} {station.nameAlbanian}
        </h2>
        <span className="text-sm opacity-90">
          {stationOrders.length} porosi aktive
        </span>
      </div>
      
      <div className="space-y-4 p-4 bg-gray-50 rounded-b-lg min-h-96">
        {stationOrders.map(order => (
          <StationOrderCard 
            key={order.id} 
            order={order} 
            station={station} 
          />
        ))}
      </div>
    </div>
  );
};
```

## Thermal Printing Integration

### **QZ Tray Integration**
```typescript
const usePrinting = () => {
  const [printerReady, setPrinterReady] = useState(false);
  
  useEffect(() => {
    // Check if QZ Tray is available
    if (window.qz) {
      window.qz.websocket.connect().then(() => {
        setPrinterReady(true);
      });
    }
  }, []);
  
  const printOrderTicket = async (order: Order) => {
    if (!window.qz?.websocket?.isActive()) {
      // Fallback to browser print
      return printBrowserFallback(order);
    }
    
    try {
      const config = qz.configs.create('Kitchen Printer');
      const data = generateESCPOSTicket(order);
      await qz.print(config, data);
    } catch (error) {
      console.error('Print failed:', error);
      // Fallback to browser print
      printBrowserFallback(order);
    }
  };
  
  const generateESCPOSTicket = (order: Order) => {
    return [
      '\x1B\x40', // Initialize printer
      '\x1B\x61\x01', // Center align
      '\x1D\x21\x11', // Double height and width
      `POROSIA ${order.orderNumber}\n`,
      '\x1D\x21\x00', // Normal size
      '\x1B\x61\x00', // Left align
      `Tavolina: ${order.tableNumber}\n`,
      `Koha: ${new Date().toLocaleTimeString('sq-AL')}\n`,
      '================================\n',
      ...order.items.map(item => 
        `${item.quantity}x ${item.nameAlbanian || item.name}\n` +
        (item.notes ? `   Shënim: ${item.notes}\n` : '')
      ),
      '================================\n',
      `Totali: ${formatAlbanianLek(order.totalAmount)}\n`,
      '\x1B\x64\x05' // Feed 5 lines and cut
    ];
  };
};
```

## Implementation Timeline

### **Phase 1: Foundation (Weeks 1-2)**

**Week 1: PWA & Wake Lock**
- [ ] Create PWA manifest.json with fullscreen mode
- [ ] Implement Screen Wake Lock API with fallback
- [ ] Add service worker for offline capabilities
- [ ] Test on iPad Safari and Android Chrome

**Week 2: WebSocket Real-Time**
- [ ] Replace polling with WebSocket connections
- [ ] Implement order event streaming
- [ ] Add exponential backoff reconnection
- [ ] Test connection resilience with network interruption

**Deliverables**:
- ✅ Never-sleep display functionality
- ✅ Real-time order notifications
- ✅ PWA installation capability
- ✅ Basic offline support

### **Phase 2: UX Hardening (Weeks 3-4)**

**Week 3: Enhanced Notifications**
- [ ] Implement audio alert system
- [ ] Add mobile vibration support
- [ ] Create visual flash effects
- [ ] Browser notification permissions

**Week 4: Responsive Layouts**
- [ ] Phone mode (vertical list, swipe actions)
- [ ] Tablet mode (current card layout enhanced)
- [ ] TV mode (horizontal lanes)
- [ ] Touch target optimization for gloves

**Deliverables**:
- ✅ Multi-device responsive layouts
- ✅ Enhanced notification system
- ✅ Touch-optimized interface
- ✅ Accessibility improvements

### **Phase 3: Kitchen Operations (Weeks 5-6)**

**Week 5: Station Routing**
- [ ] Implement kitchen station architecture
- [ ] Add station-based order filtering
- [ ] Create station-specific views
- [ ] Multi-station order handling

**Week 6: Time Escalation**
- [ ] Order aging calculation
- [ ] Visual escalation indicators
- [ ] Audio escalation alerts
- [ ] Performance optimization

**Deliverables**:
- ✅ Station-based order routing
- ✅ Time-based escalation system
- ✅ Bulk action capabilities
- ✅ Performance optimization

### **Phase 4: Production Hardening (Weeks 7-8)**

**Week 7: Albanian Localization**
- [ ] Complete Albanian kitchen terminology
- [ ] Currency formatting for ALL (Lek)
- [ ] Kitchen role permissions
- [ ] Cultural UX adaptations

**Week 8: Beta Testing**
- [ ] Deploy to Beach Bar Durrës
- [ ] Real kitchen workflow testing
- [ ] Staff training and feedback
- [ ] Performance monitoring

**Deliverables**:
- ✅ Production-ready KDS system
- ✅ Albanian market optimization
- ✅ Real-world validation
- ✅ Performance benchmarks

## Technical Specifications

### **Performance Targets**
- **Order notification latency**: <1 second from kitchen to display
- **WebSocket reconnection**: <5 seconds with exponential backoff
- **PWA load time**: <3 seconds on 3G networks
- **Battery efficiency**: Optimized for 8+ hour shifts
- **Memory usage**: <200MB for 100+ active orders

### **Browser Support Matrix**
| Browser | Version | Status | Notes |
|---------|---------|---------|-------|
| iOS Safari | 14+ | ✅ Primary | iPad deployment target |
| Chrome Android | 90+ | ✅ Primary | Android tablet support |
| Chrome Desktop | 90+ | ✅ Secondary | Kitchen PC fallback |
| Edge | 90+ | ✅ Secondary | Windows integration |
| Firefox | 90+ | ⚠️ Fallback | Limited wake lock support |

### **Hardware Compatibility**

**Primary Deployment**:
- iPad (9th generation or newer)
- iPad Air (4th generation or newer)
- Android tablets (10+ inch, Android 10+)

**Secondary Options**:
- Kitchen TV with Chrome stick
- Windows PC with Chrome/Edge
- Large Android phones (emergency backup)

**Recommended Accessories**:
- Waterproof tablet case
- Kitchen-grade stand with adjustable angle
- Screen protector for heavy use
- External speakers for audio alerts

### **Network Requirements**
- **Minimum**: 2 Mbps stable WiFi
- **Recommended**: 5+ Mbps with WiFi 6
- **Latency**: <100ms to server
- **Reliability**: 99%+ uptime during service hours

## Deployment Strategy

### **Phase 1: Beach Bar Durrës Beta (Week 8)**
- Single venue deployment
- Manager and kitchen staff training
- Real-world stress testing during peak hours
- Feedback collection and rapid iteration

### **Phase 2: Albanian Restaurant Rollout (Weeks 9-12)**
- 5-10 venue deployment
- Different restaurant types (casual, fine dining, fast-casual)
- Multi-language testing (Albanian, English, Italian)
- Performance monitoring across venues

### **Phase 3: Full Market Launch (Weeks 13-16)**
- Marketing campaign launch
- Self-service venue onboarding
- Partner channel development
- Continuous improvement based on usage data

## Success Metrics

### **Operational KPIs**
- **Order Processing Speed**: Target <2 minutes from receipt to kitchen acknowledgment
- **Order Accuracy**: 99%+ correct order preparation
- **System Uptime**: 99.9% availability during service hours
- **Staff Adoption**: 90%+ daily active usage

### **Business KPIs**
- **Venue Retention**: 95%+ monthly retention rate
- **Table Turnover**: 25%+ improvement in table turnover speed
- **Customer Satisfaction**: 4.5+ stars on order experience
- **Staff Efficiency**: 40%+ reduction in order-related staff time

### **Technical KPIs**
- **Real-Time Performance**: <1s average notification latency
- **Offline Resilience**: 100% order preservation during network outages
- **Battery Life**: 8+ hours continuous operation on tablets
- **Error Rate**: <0.1% order processing errors

## Risk Mitigation

### **Technical Risks**
- **Network Outages**: IndexedDB caching + automatic reconnection
- **Device Failures**: Multi-device redundancy + phone backup capability  
- **Browser Crashes**: Service worker recovery + automatic reload
- **Performance Degradation**: Memory management + periodic cleanup

### **Operational Risks**
- **Staff Resistance**: Comprehensive training + gradual rollout
- **Peak Hour Stress**: Load testing + auto-scaling infrastructure
- **Hardware Damage**: Ruggedized cases + device insurance
- **Power Outages**: UPS backup power + mobile hotspot fallback

### **Business Risks**
- **Competitor Response**: Faster deployment + unique Albanian focus
- **Market Saturation**: International expansion capability
- **Regulatory Changes**: Compliant architecture + adaptable design
- **Economic Downturn**: Flexible pricing + core value focus

## Conclusion

This implementation plan transforms SKAN.AL from a standard admin portal into a bulletproof Kitchen Display System specifically designed for Albanian restaurants. The 8-week timeline provides a realistic path to deployment while the "never sleep, never miss, never duplicate" architecture ensures production reliability.

The strategic advantage lies in leveraging existing infrastructure and consumer hardware to provide enterprise-grade functionality at a fraction of traditional KDS costs. Albanian restaurants can deploy immediately with iPads they already own, gaining competitive advantage through faster service and improved operations.

**Ready to execute**: All technical requirements are feasible with current web technologies, the market need is validated, and the implementation path is clear.

---

*Last Updated: September 22, 2025*  
*Version: 1.0*  
*Status: Ready for Implementation*