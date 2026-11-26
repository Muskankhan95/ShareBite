"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleSwitcherBanner } from "@/components/shared/RoleSwitcherBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  HeartHandshake,
  Utensils,
  Building2,
  Bike,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Leaf,
  Clock,
  CheckCircle2,
  Scale,
  Users,
  Award,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RoleSwitcherBanner />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-emerald-50/70 via-white to-white">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-amber-50/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Mission Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 shadow-xs">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Social Impact Food Redistribution Platform</span>
            </div>

            {/* Hero Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              {siteConfig.hero.heading}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {siteConfig.hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/register?role=donor">
                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={<Utensils className="w-4 h-4" />}
                >
                  Donate Food
                </Button>
              </Link>

              <Link href="/register?role=volunteer">
                <Button
                  size="lg"
                  variant="secondary"
                  leftIcon={<Bike className="w-4 h-4" />}
                >
                  Join as Volunteer
                </Button>
              </Link>

              <Link href="/register?role=ngo">
                <Button
                  size="lg"
                  variant="outline"
                  leftIcon={<Building2 className="w-4 h-4" />}
                >
                  Find Food
                </Button>
              </Link>
            </div>

            {/* Trust snippet */}
            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Free for Charities
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified NGO Partners
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" /> Rapid Doorstep Pickup
              </span>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {siteConfig.impactStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow text-center"
              >
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">{stat.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {siteConfig.theProblem.tagline}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mt-2 text-white">
              {siteConfig.theProblem.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {siteConfig.theProblem.points.map((point, i) => (
              <div
                key={point.title}
                className="bg-slate-800/80 rounded-2xl p-7 border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg mb-5">
                  0{i + 1}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How ShareBite Works Section */}
      <section className="py-20 bg-slate-50/70 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Simple & Rapid Redistribution
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How ShareBite Works
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              From surplus kitchen pan to community dining plate in four transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteConfig.howItWorks.map((step) => (
              <div
                key={step.step}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      STEP {step.step}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{step.role}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Use ShareBite Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
              An Ecosystem For Good
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Who Can Use ShareBite
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Tailored workspaces and tools for every stakeholder in the food recovery chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteConfig.whoCanUse.map((userGroup) => (
              <Card key={userGroup.role} hoverEffect className="flex flex-col justify-between">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      {userGroup.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{userGroup.role}</h3>
                  <p className="text-xs font-semibold text-emerald-700">{userGroup.target}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {userGroup.description}
                  </p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link href={userGroup.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Explore {userGroup.role} Portal
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="py-20 bg-emerald-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mb-12">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Environmental & Social Dividends
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white">
              Our Verified Impact
            </h2>
            <p className="text-emerald-200 text-sm mt-2">
              Every meal rescued prevents unnecessary carbon emissions and conserves critical water
              reserves while feeding hungry families.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteConfig.environmentalImpact.map((stat) => (
              <div
                key={stat.label}
                className="bg-emerald-900/60 rounded-2xl p-6 border border-emerald-800/80 backdrop-blur-xs"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stat.metric}
                </p>
                <p className="text-xs text-emerald-200 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Join the Movement to End Food Waste
          </h2>
          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto">
            Whether you operate a commercial kitchen with extra portions, run an NGO shelter, or
            have an hour to pick up and deliver, your involvement transforms lives.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register?role=donor">
              <Button
                size="lg"
                className="bg-white text-emerald-800 hover:bg-slate-100 shadow-lg font-bold"
              >
                Start Donating Food
              </Button>
            </Link>
            <Link href="/register?role=volunteer">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-bold"
              >
                Sign Up as Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
