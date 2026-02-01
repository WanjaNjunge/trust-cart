import Link from 'next/link';
import {
  Laptop,
  Smartphone,
  Headphones,
  Watch,
  Gamepad,
  Camera,
  Monitor,
  Speaker,
  Tablet,
  Router,
  HardDrive,
} from 'lucide-react';

const CATEGORIES = [
  { label: 'Laptops', icon: Laptop, href: '/categories/laptops' },
  { label: 'Mobile', icon: Smartphone, href: '/categories/mobile' },
  { label: 'Tablets', icon: Tablet, href: '/categories/tablets' },
  { label: 'Audio', icon: Headphones, href: '/categories/audio' },
  { label: 'Wearables', icon: Watch, href: '/categories/wearables' },
  { label: 'Gaming', icon: Gamepad, href: '/categories/gaming' },
  { label: 'Cameras', icon: Camera, href: '/categories/cameras' },
  { label: 'Monitors', icon: Monitor, href: '/categories/monitors' },
  { label: 'Smart Home', icon: Speaker, href: '/categories/smart-home' },
  { label: 'Networking', icon: Router, href: '/categories/networking' },
  { label: 'Storage', icon: HardDrive, href: '/categories/storage' },
];

export function CategoryRail() {
  return (
    <div className="relative z-20 mt-6 mb-8 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-8 overflow-x-auto py-4 scrollbar-hide">
          {CATEGORIES.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="group flex flex-shrink-0 items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              <category.icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-blue-400" />
              <span className="relative">
                {category.label}
                <span className="absolute -bottom-4 left-0 h-0.5 w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
