import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  name: string;
};

export function Icon({ name, className = '', ...props }: IconProps) {
  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    className,
    'aria-hidden': 'true' as const,
    ...props,
  };

  switch (name) {
    case 'verified_user':
      return (
        <svg {...baseProps}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 12l1.8 1.8 3.2-3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'favorite':
      return (
        <svg {...baseProps}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'arrow_forward':
      return (
        <svg {...baseProps}>
          <path d="M5 12h14" strokeLinecap="round" />
          <path d="M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'medical_services':
      return (
        <svg {...baseProps}>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M12 9v8M8 13h8" strokeLinecap="round" />
          <path d="M9 6V4h6v2" />
        </svg>
      );
    case 'medication':
      return (
        <svg {...baseProps}>
          <rect x="5" y="7" width="14" height="10" rx="3" />
          <path d="M12 7v10M9 12h6" strokeLinecap="round" />
        </svg>
      );
    case 'qr_code_scanner':
      return (
        <svg {...baseProps}>
          <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="8" y="8" width="3" height="3" />
          <rect x="13" y="13" width="3" height="3" />
        </svg>
      );
    case 'monitoring':
      return (
        <svg {...baseProps}>
          <path d="M4 18h16M7 18V8m5 10V5m5 13v-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'health_and_safety':
      return (
        <svg {...baseProps}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8v6M9 11h6" strokeLinecap="round" />
        </svg>
      );
    case 'upload_file':
      return (
        <svg {...baseProps}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M12 16V10m0 0-2 2m2-2 2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'diagnosis':
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4-4M11 8v6M8 11h6" strokeLinecap="round" />
        </svg>
      );
    case 'pill':
      return (
        <svg {...baseProps}>
          <rect x="4" y="9" width="16" height="6" rx="3" />
          <path d="M12 9v6" />
        </svg>
      );
    case 'save':
      return (
        <svg {...baseProps}>
          <path d="M5 4h12l2 2v14H5z" />
          <path d="M8 4v5h8V4M9 20v-5h6v5" />
        </svg>
      );
    case 'share':
      return (
        <svg {...baseProps}>
          <circle cx="18" cy="5" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="M8 12l8-6M8 12l8 6" strokeLinecap="round" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg {...baseProps}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'search':
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4-4" strokeLinecap="round" />
        </svg>
      );
    case 'close':
      return (
        <svg {...baseProps}>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      );
    case 'schedule':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sync':
      return (
        <svg {...baseProps}>
          <path d="M4 12a8 8 0 0 1 13-5M20 12a8 8 0 0 1-13 5M17 5v4h-4M7 19v-4h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'priority_high':
      return (
        <svg {...baseProps}>
          <path d="M12 5v9M12 18h.01" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'history':
      return (
        <svg {...baseProps}>
          <path d="M3 12a9 9 0 1 0 3-6.7M3 5v4h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8v5l3 2" strokeLinecap="round" />
        </svg>
      );
    case 'download':
      return (
        <svg {...baseProps}>
          <path d="M12 4v10m0 0-4-4m4 4 4-4M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'check_circle':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.2 2.2L15.5 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'restaurant':
      return (
        <svg {...baseProps}>
          <path d="M8 4v8M6 4v8M10 4v8M7 12v8M15 4v18M18 4v7a3 3 0 0 1-3 3" strokeLinecap="round" />
        </svg>
      );
    case 'info':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6M12 7h.01" strokeLinecap="round" />
        </svg>
      );
    case 'no_meals':
      return (
        <svg {...baseProps}>
          <path d="M4 4l16 16M7 4v8M11 4v8M9 12v8M15 4v8M17 4v16" strokeLinecap="round" />
        </svg>
      );
    case 'warning_amber':
      return (
        <svg {...baseProps}>
          <path d="M12 4l9 16H3z" strokeLinejoin="round" />
          <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
        </svg>
      );
    case 'error':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
        </svg>
      );
    case 'block':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 17l10-10" strokeLinecap="round" />
        </svg>
      );
    case 'edit':
    case 'edit_square':
      return (
        <svg {...baseProps}>
          <path d="M4 20h4l10-10-4-4L4 16zM13 7l4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'person':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" strokeLinecap="round" />
        </svg>
      );
    case 'update':
      return (
        <svg {...baseProps}>
          <path d="M4 12a8 8 0 1 0 3-6.7M4 5v4h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'pending':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l2 2" strokeLinecap="round" />
        </svg>
      );
    case 'history_edu':
      return (
        <svg {...baseProps}>
          <path d="M4 19V7l8-3 8 3v12l-8 3z" />
          <path d="M9 12h6M9 15h4" strokeLinecap="round" />
        </svg>
      );
    case 'add':
      return (
        <svg {...baseProps}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      );
    case 'medication_liquid':
      return (
        <svg {...baseProps}>
          <path d="M9 3h6v4l3 4v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8l3-4z" />
          <path d="M9 14h6" />
        </svg>
      );
    case 'vaccines':
      return (
        <svg {...baseProps}>
          <path d="M7 17l10-10M14 4l6 6M6 15l3 3M4 20l3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'more_vert':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.4.7z" />
        </svg>
      );
    case 'security':
      return (
        <svg {...baseProps}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
          <path d="M12 9v6M9 12h6" strokeLinecap="round" />
        </svg>
      );
    case 'notifications':
    case 'notifications_active':
      return (
        <svg {...baseProps}>
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'description':
      return (
        <svg {...baseProps}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v4h4M10 12h6M10 16h6" strokeLinecap="round" />
        </svg>
      );
    case 'language':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" strokeLinecap="round" />
        </svg>
      );
    case 'visibility':
      return (
        <svg {...baseProps}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'visibility_off':
      return (
        <svg {...baseProps}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
          <path d="M4 4l16 16" strokeLinecap="round" />
        </svg>
      );
    case 'expand_more':
      return (
        <svg {...baseProps}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...baseProps}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case 'share_reviews':
      return (
        <svg {...baseProps}>
          <path d="M8 10h8M8 14h5" strokeLinecap="round" />
          <path d="M4 5h16v12H8l-4 3z" strokeLinejoin="round" />
        </svg>
      );
    case 'chevron_right':
      return (
        <svg {...baseProps}>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'delete_forever':
      return (
        <svg {...baseProps}>
          <path d="M5 7h14M9 7V5h6v2m-8 0 1 12h8l1-12M10 11l4 4m0-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
