import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleSwitcherBanner } from "@/components/shared/RoleSwitcherBanner";
import { Button } from "@/components/ui/Button";
import {
  Utensils,
  Building2,
  Bike,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  QrCode,
  MapPin,
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Donor Posts Surplus Food",
      who: "Restaurants, Hotels, Canteens, Hostels, Caterers",
      icon: <Utensils className="w-6 h-6 text-emerald-600" />,
      desc: "In under two minutes, the kitchen staff inputs portion count, food classification (cooked, bakery, produce), dietary certifications, packaging method, and the available pickup window.",
    },
    {
      num: "02",
      title: "Smart Geographic Matching",
      who: "Verified Community Organizations & Shelters",
      icon: <Building2 className="w-6 h-6 text-blue-600" />,
      desc: "Registered NGOs within a 5-mile radius receive an instant push notification. They review portions, check dietary requirements, and claim the donation with one click.",
    },
    {
      num: "03",
      title: "Rapid Courier Dispatch",
      who: "Community Volunteers (Bikes, Cars, On-foot)",
      icon: <Bike className="w-6 h-6 text-amber-600" />,
      desc: "A volunteer courier claims the route via their mobile dashboard, receives GPS directions to the donor kitchen, and picks up the insulated food containers.",
    },
    {
      num: "04",
      title: "Digital Handover & Verification",
      who: "Safe Delivery & Impact Logging",
      icon: <QrCode className="w-6 h-6 text-purple-600" />,
      desc: "Upon delivery at the shelter, a QR code scan confirms food temperature and integrity. Donors receive an automated tax deduction certificate and carbon offset record.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RoleSwitcherBanner />
      <Navbar />

      <main className="flex-1">
        <div className="bg-slate-50 border-b border-slate-200/80 py-16 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Step-by-Step Overview
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-2">
              How ShareBite Works
            </h1>
            <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
              Our coordinated technology layer turns perishable surplus into immediate community relief.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="space-y-12">
            {steps.map((s, idx) => (
              <div
                key={s.num}
                className="flex flex-col md:flex-row gap-6 items-start bg-white p-8 rounded-2xl border border-slate-200 shadow-xs"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      STEP {s.num}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{s.who}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-emerald-50 rounded-2xl p-8 border border-emerald-100 text-center space-y-4">
            <h3 className="text-xl font-bold text-emerald-900">Ready to make a real difference?</h3>
            <p className="text-sm text-emerald-700 max-w-xl mx-auto">
              Sign up today under your role and start rescuing meals in your neighborhood.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/register">
                <Button>Create an Account</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
