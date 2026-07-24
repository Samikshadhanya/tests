'use client';

import { Phone, MapPin, AlertCircle, ShieldAlert, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function EmergencyPage() {
  const [emergencyContact, setEmergencyContact] = useState<{name: string, phone: string} | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    const saved = localStorage.getItem('emergencyContact');
    if (saved) {
      setEmergencyContact(JSON.parse(saved));
    } else {
      setIsEditingContact(true);
    }
  }, []);

  const saveContact = () => {
    if (!contactForm.name || !contactForm.phone) return;
    localStorage.setItem('emergencyContact', JSON.stringify(contactForm));
    setEmergencyContact(contactForm);
    setIsEditingContact(false);
  };

  const removeContact = () => {
    localStorage.removeItem('emergencyContact');
    setEmergencyContact(null);
    setContactForm({ name: '', phone: '' });
    setIsEditingContact(true);
  };

  const callEmergency = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const openHospitalFinder = () => {
    // Open Google Maps search for nearby hospitals
    window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank');
  };

  return (
    <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-red-700 md:text-3xl flex items-center gap-2">
          <ShieldAlert className="w-8 h-8" />
          Emergency SOS
        </h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">Quick access to emergency services and nearby hospitals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 animate-pulse">
            <Phone className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-red-900">Emergency Call</h2>
          <p className="text-sm text-red-700 max-w-xs">Instantly dial the local emergency services line (112) for immediate medical assistance.</p>
          <Button 
            onClick={() => callEmergency('112')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg mt-4 shadow-md"
          >
            <AlertCircle className="w-6 h-6 mr-2" />
            DIAL 112
          </Button>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm transition hover:border-blue-300">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
            <MapPin className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Hospital Finder</h2>
          <p className="text-sm text-slate-600 max-w-xs">Locate the nearest hospitals, clinics, and pharmacies based on your current GPS location.</p>
          <Button 
            onClick={openHospitalFinder}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 text-lg mt-4 shadow-md"
          >
            <MapPin className="w-6 h-6 mr-2" />
            Find Hospitals Near Me
          </Button>
        </section>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Phone className="w-5 h-5 text-teal-600" />
          Personal Emergency Contact
        </h3>
        
        {!emergencyContact && !isEditingContact && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-bold text-amber-900">No Emergency Contact Added</p>
              <p className="text-sm text-amber-700">Please add at least one person as your emergency contact (like a family member or close friend).</p>
            </div>
            <Button onClick={() => setIsEditingContact(true)} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        )}

        {isEditingContact && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
            <p className="text-sm font-medium text-slate-700">Add a family member or close friend to call in case of an emergency.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input 
                  type="text" 
                  value={contactForm.name} 
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Phone Number</span>
                <input 
                  type="tel" 
                  value={contactForm.phone} 
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="e.g. +1 234 567 8900"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              {emergencyContact && (
                <Button variant="outline" onClick={() => { setContactForm(emergencyContact); setIsEditingContact(false); }}>Cancel</Button>
              )}
              <Button onClick={saveContact} className="bg-teal-600 hover:bg-teal-700" disabled={!contactForm.name || !contactForm.phone}>Save Contact</Button>
            </div>
          </div>
        )}

        {emergencyContact && !isEditingContact && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-teal-50 rounded-lg border border-teal-100 gap-4">
            <div>
              <p className="font-bold text-teal-900 text-lg">{emergencyContact.name}</p>
              <p className="text-sm text-teal-700">{emergencyContact.phone}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => { setContactForm(emergencyContact); setIsEditingContact(true); }} className="text-teal-700 border-teal-200 hover:bg-teal-100 flex-1 sm:flex-none">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={removeContact} className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => callEmergency(emergencyContact.phone)} className="bg-teal-600 hover:bg-teal-700 text-white ml-2 flex-1 sm:flex-none">
                Call
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
