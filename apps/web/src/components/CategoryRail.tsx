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
    { label: 'Phones', icon: Smartphone, href: '/categories/phones' },
    { label: 'Tablets', icon: Tablet, href: '/categories/tablets' },
    { label: 'Audio', icon: Headphones, href: '/categories/accessories' }, // Redirect to accessories
    { label: 'Wearables', icon: Watch, href: '/categories/accessories' },  // Redirect to accessories
    { label: 'Gaming', icon: Gamepad, href: '/categories/accessories' },   // Redirect to accessories
    { label: 'Cameras', icon: Camera, href: '/categories/accessories' },   // Redirect to accessories
    { label: 'Monitors', icon: Monitor, href: '/categories/monitors' },
    { label: 'Smart Home', icon: Speaker, href: '/categories/accessories' },// Redirect to accessories
    { label: 'Networking', icon: Router, href: '/categories/accessories' }, // Redirect to accessories
    { label: 'Storage', icon: HardDrive, href: '/categories/accessories' }, // Redirect to accessories
];

export function CategoryRail() {
    return (
        <div className="relative z-20 w-full mb-8 border-b border-slate-200/60 bg-white/60 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-8 overflow-x-auto py-4 scrollbar-hide">
                    {CATEGORIES.map((category) => (
                        <Link
                            key={category.label}
                            href={category.href}
                            className="group flex flex-shrink-0 items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
                        >
                            <category.icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500" />
                            <span className="relative">
                                {category.label}
                                <span className="absolute -bottom-4 left-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
