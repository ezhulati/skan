import React from 'react';
import * as Icons from 'react-icons/md';
import * as FeatherIcons from 'react-icons/fi';
import { IconType } from 'react-icons';

// Icon mapping for consistent icons across the app
export const iconMap: Record<string, IconType> = {
  // Navigation
  'arrow-left': Icons.MdArrowBack,
  'arrow-right': Icons.MdArrowForward,
  'chevron-left': Icons.MdChevronLeft,
  'chevron-right': Icons.MdChevronRight,
  'chevron-down': Icons.MdKeyboardArrowDown,
  'chevron-up': Icons.MdKeyboardArrowUp,
  
  // Actions
  'plus': Icons.MdAdd,
  'minus': Icons.MdRemove,
  'close': Icons.MdClose,
  'check': Icons.MdCheck,
  'edit': Icons.MdEdit,
  'delete': Icons.MdDelete,
  'search': Icons.MdSearch,
  'filter': Icons.MdFilterList,
  
  // UI Elements
  'menu': Icons.MdMenu,
  'home': Icons.MdHome,
  'user': Icons.MdPerson,
  'settings': Icons.MdSettings,
  'info': Icons.MdInfo,
  'warning': Icons.MdWarning,
  'error': Icons.MdError,
  'success': Icons.MdCheckCircle,
  
  // Restaurant Specific
  'restaurant': Icons.MdRestaurant,
  'food': Icons.MdFastfood,
  'cart': Icons.MdShoppingCart,
  'receipt': Icons.MdReceipt,
  'qr-code': Icons.MdQrCode,
  'table': Icons.MdTableRestaurant,
  
  // Time & Status
  'clock': Icons.MdAccessTime,
  'calendar': Icons.MdCalendarToday,
  'refresh': Icons.MdRefresh,
  'loading': Icons.MdRotateRight,
  
  // Communication
  'phone': Icons.MdPhone,
  'email': Icons.MdEmail,
  'message': Icons.MdMessage,
  
  // Social
  'instagram': Icons.MdOutlineCamera,
  'facebook': FeatherIcons.FiFacebook,
  
  // Other
  'star': Icons.MdStar,
  'favorite': Icons.MdFavorite,
  'share': Icons.MdShare,
  'download': Icons.MdDownload,
  'upload': Icons.MdUpload,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  className = '', 
  color,
  onClick 
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  return (
    <IconComponent 
      size={size}
      className={className}
      color={color}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    />
  );
};

export default Icon;