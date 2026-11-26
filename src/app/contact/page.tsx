"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleSwitcherBanner } from "@/components/shared/RoleSwitcherBanner";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RoleSwitcherBanner />
      <Navbar />

      <main className="flex-1 py-16 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Get in Touch
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Contact ShareBite
            </h1>
            <p className="text-slate-600 text-sm mt-2">
              Have questions about corporate food partnerships, NGO onboarding, or volunteer
              programs? Our team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info Cards */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Email Us</h4>
                    <p className="text-xs text-slate-500 mt-0.5">We reply within 1 business day</p>
                    <a
                      href="mailto:support@sharebite.org"
                      className="text-xs font-semibold text-emerald-700 hover:underline block mt-2"
                    >
                      support@sharebite.org
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Call Center</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Mon–Sat from 8am to 8pm</p>
                    <a
                      href="tel:18005553663"
                      className="text-xs font-semibold text-emerald-700 hover:underline block mt-2"
                    >
                      +1 (800) 555-FOOD
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Headquarters</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Civic Tech Hub</p>
                    <p className="text-xs text-slate-700 mt-2">
                      100 Civic Center Plaza, Suite 400<br />San Francisco, CA 94102
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  {submitted ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto">
                        Thank you for reaching out to ShareBite. A representative from our team will contact you shortly.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmitted(false)}
                        className="mt-4"
                      >
                        Send Another Inquiry
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Send us a Message</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Your Name" placeholder="e.g. Elena Rostova" required />
                        <Input label="Email Address" type="email" placeholder="elena@example.org" required />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                          label="Your Role / Organization Type"
                          options={[
                            { value: "donor", label: "Food Donor (Restaurant / Hotel / Canteen)" },
                            { value: "ngo", label: "NGO / Charitable Organization" },
                            { value: "volunteer", label: "Volunteer Courier" },
                            { value: "corporate", label: "Corporate Sponsor / CSR" },
                            { value: "other", label: "General Inquiry" },
                          ]}
                        />
                        <Input label="Phone Number" placeholder="+1 (555) 000-0000" />
                      </div>

                      <Textarea
                        label="Message"
                        placeholder="How can we assist you?"
                        rows={4}
                        required
                      />

                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        rightIcon={<Send className="w-4 h-4" />}
                      >
                        Submit Inquiry
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
