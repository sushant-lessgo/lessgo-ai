// 'use client';

// declare global {
//   interface Window {
//     gtag: (...args: any[]) => void;
//   }
// }


// interface CTAButtonProps {
//   text?: string; // ✅ Optional
//   href?: string; // ✅ Optional
//   onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
//   className?: string;
//   gaLabel?: string; // ✅ Optional
// }

// export default function CTAButton({
//     text = 'Launch My Landing Page Now!',
//     href = '#waitlist',
//     onClick,
//     className = 'mt-12',
//     gaLabel = 'default', 
//   }: CTAButtonProps) {
//   const baseStyles =
//     'inline-block px-8 sm:px-12 md:px-20 lg:px-40 py-7 md:py-6 lg:py-6 bg-brand-accentPrimary text-white text-2xl sm:text-4xl font-heading font-bold border-2 border-brand-text rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out';

  

//   const combinedStyles = `${baseStyles} ${className}`.trim();
  
//   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
//     // Track GA event
    
//     if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
//       window.gtag('event', 'join_waitlist_click', {
//         event_category: 'engagement',
//         event_label: gaLabel,
//       });
//     }

//     // Call user-defined onClick, if provided
//     if (onClick) {
//       onClick(e);
//     }
//   };

//   return (
//     <button onClick={handleClick} className={combinedStyles}>
//       {text}
//     </button>
//   );
// }

// interface CTAButtonProps {
//   text?: string;
//   onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
//   className?: string;
//   gaLabel?: string;
//   type?: 'button' | 'submit'; // ✅ Add this for form use
// }

// export default function CTAButton({
//   text = 'Launch My Landing Page Now!',
//   onClick,
//   className = 'mt-12',
//   gaLabel = 'default',
//   type = 'button', // default type is button
// }: CTAButtonProps) {
//   const baseStyles =
//     'inline-block px-8 sm:px-12 md:px-20 lg:px-40 py-7 md:py-6 lg:py-6 bg-brand-accentPrimary text-white text-2xl sm:text-4xl font-heading font-bold border-2 border-brand-text rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out';

//   const combinedStyles = `${baseStyles} ${className}`.trim();

//   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
//     if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
//       window.gtag('event', 'join_waitlist_click', {
//         event_category: 'engagement',
//         event_label: gaLabel,
//       });
//     }

//     if (onClick) {
//       onClick(e);
//     }
//   };

//   return (
//     <button type={type} onClick={handleClick} className={combinedStyles}>
//       {text}
//     </button>
//   );
// }
