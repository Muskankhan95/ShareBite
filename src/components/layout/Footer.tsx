import React from "react";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, Mail, MapPin, Phone, Github } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Share<span className="text-emerald-500">Bite</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Connecting food donors, verified NGOs, and dedicated volunteer couriers to eliminate
              food waste and nourish local communities in need.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/60 max-w-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certified Safe Food Redistribution Network</span>
            </div>
          </div>

          {/* Public Links */}
          <div className="space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider">Explore</p>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About ShareBite
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Role Portals */}
          <div className="space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider">Role Portals</p>
            <ul className="space-y-2">
              <li>
                <Link href="/donor/dashboard" className="hover:text-emerald-400 transition-colors">
                  Donor Portal
                </Link>
              </li>
              <li>
                <Link href="/ngo/dashboard" className="hover:text-emerald-400 transition-colors">
                  NGO Network
                </Link>
              </li>
              <li>
                <Link href="/volunteer/dashboard" className="hover:text-emerald-400 transition-colors">
                  Volunteer Hub
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-emerald-400 transition-colors">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider">Get in Touch</p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>support@sharebite.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>+1 (800) 555-FOOD</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>100 Civic Center Plaza, San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ShareBite Social Impact Initiative. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Food Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
