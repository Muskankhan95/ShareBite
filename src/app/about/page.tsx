import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleSwitcherBanner } from "@/components/shared/RoleSwitcherBanner";
import { Button } from "@/components/ui/Button";
import { HeartHandshake, ShieldCheck, Target, Users, Leaf, Globe2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RoleSwitcherBanner />
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Our Mission
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-2">
              About ShareBite
            </h1>
            <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed">
              We bridge the tragic gap between food abundance and food poverty by building
              intelligent, hyper-local logistics infrastructure for verified redistribution.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero Food In Landfills</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Edible surplus food should nourish humans, not generate methane in landfills. We
                target eliminating commercial food waste at source.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verified & Safe</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every NGO recipient is legally verified and follows strict hygiene compliance
                protocols, ensuring dignity and safety for all beneficiaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Community Powered</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our network of everyday volunteer couriers makes hyper-local pickup and delivery
                rapid, economical, and socially connected.
              </p>
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="bg-slate-50 py-16 border-t border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Why We Built ShareBite
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                In urban centers, hundreds of catered conferences, high-volume hotel kitchens,
                university canteens, and local bakeries finish each day with wholesome, uneaten
                dishes. Yet, merely two miles away, community shelters struggle to feed those who
                walk through their doors.
              </p>
              <p>
                The barrier has never been a lack of generosity. The barrier has always been
                logistical friction: commercial chefs don’t have time to make dozens of phone calls,
                and understaffed shelters don’t have drivers standing by on short notice.
              </p>
              <p>
                ShareBite automates the match: donors post with three taps, verified NGOs claim what
                they need, and vetted volunteer couriers handle the transit.
              </p>
            </div>

            <div className="pt-4">
              <Link href="/register">
                <Button size="lg">Join the Network Today</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
