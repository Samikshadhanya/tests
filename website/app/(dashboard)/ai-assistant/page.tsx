'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, User, Send, RefreshCw, AlertCircle, ShieldCheck, HeartPulse, Pill, Calendar, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';
import { FormattedMessage } from '@/components/formatted-message';
import { toast } from '@/hooks/use-toast';
import { sendRefillNotificationToLeader, triggerAutoSMS } from '@/lib/notifications';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Welcome to your **MedHome AI Health Assistant**! 🏥\n\nI have real-time visibility into your logged medicines, daily reminders, and doctor appointments.\n\nHere are some things you can ask me:\n- *"Which medicines are low in stock and need a refill?"*\n- *"What is my medication schedule for today?"*\n- *"What are common instructions or safety precautions for my prescriptions?"*\n- *"When is my next doctor appointment?"*',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, members, medicines, todayReminders, appointments, caregivers, lowStockMedicines, expiringMedicines, markDose } = useAppStore();

  const leaderMember = members.find((m) => m.accessLevel === 'Leader');
  const leaderCaregiver = caregivers.find((c) => c.accessLevel === 'Leader');
  const leaderName = leaderMember ? leaderMember.name : (leaderCaregiver?.name || user?.name || 'Household Leader');
  const leaderPhone = leaderMember?.phone || leaderCaregiver?.phone || user?.emergencyContact?.phone || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const userContext = {
        userName: user?.name,
        leaderName,
        emergencyContact: user?.emergencyContact,
        medicines: medicines.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          quantity: m.quantity,
          instructions: m.mealInstruction,
        })),
        reminders: todayReminders.map((r) => {
          const med = medicines.find((m) => m.id === r.medicineId);
          return {
            medicineName: med?.name || r.medicineId,
            time: r.time,
            status: r.status,
          };
        }),
        appointments: appointments.map((a) => ({
          doctorName: a.doctorName,
          specialty: a.specialty,
          date: a.date,
          time: a.time,
        })),
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      const data = await res.json();
      let replyContent = data.reply || data.error || 'Unable to fetch response.';

      // Parse and execute DOSE LOGGING action tag if present
      const actionMatch = replyContent.match(/\[ACTION:MARK_TAKEN:(.+?)\]/i) || queryText.match(/(?:took|taken|marked)\s+(.+?)(?:dose|pill|$)/i);
      if (actionMatch && actionMatch[1]) {
        const medQuery = actionMatch[1].trim();
        replyContent = replyContent.replace(/\[ACTION:MARK_TAKEN:.+?\]/gi, '').trim();

        const targetReminder = todayReminders.find((r) => {
          const med = medicines.find((m) => m.id === r.medicineId);
          const medName = med?.name || r.medicineId;
          return medName.toLowerCase().includes(medQuery.toLowerCase()) || medQuery.toLowerCase().includes(medName.toLowerCase());
        }) || todayReminders.find((r) => r.status === 'upcoming');

        if (targetReminder) {
          await markDose(targetReminder.id, 'taken');
          const med = medicines.find((m) => m.id === targetReminder.medicineId);
          toast({
            title: '✅ Dose Marked Taken via Chat',
            description: `Updated schedule: ${med?.name || targetReminder.medicineId} marked as TAKEN!`,
          });
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // If refill intent detected in prompt or response, automatically trigger SMS message to Leader
      if (/refill|restock|order\s+more/i.test(queryText) || /Refill Alert/i.test(replyContent)) {
        sendRefillNotificationToLeader(leaderName, queryText);
        triggerAutoSMS(leaderName, leaderPhone, queryText);
        toast({
          title: '💬 Auto SMS Messaging Dispatched',
          description: `Opened SMS message to Household Leader (${leaderName}) for restock.`,
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '❌ Connection error. Please check your internet connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: 'Chat conversation reset. Ask me anything about your health or medications!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 sm:p-6 bg-slate-50 gap-4 max-w-6xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Sparkles className="h-6 w-6 text-teal-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              AI Health & Medication Companion
            </h1>
            <p className="text-xs text-slate-300">
              Powered by Google Gemini • Real-time integration with your MedHome schedule
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar stats + Chat interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Left Side Info Cards */}
        <div className="hidden lg:flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-teal-600" /> Inventory Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Medicines</span>
                <span className="font-semibold text-slate-900">{medicines.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Low Stock Items</span>
                <span className={`font-semibold ${lowStockMedicines.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {lowStockMedicines.length}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Expiring Soon</span>
                <span className={`font-semibold ${expiringMedicines.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {expiringMedicines.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-600" /> Today's Doses
            </h3>
            <div className="text-xs text-slate-600">
              {todayReminders.length === 0 ? (
                <p className="italic text-slate-400">No scheduled doses for today.</p>
              ) : (
                <ul className="space-y-1.5">
                  {todayReminders.slice(0, 4).map((r, i) => {
                    const med = medicines.find((m) => m.id === r.medicineId);
                    return (
                      <li key={i} className="flex justify-between items-center text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                        <span className="truncate font-medium">{med?.name || r.medicineId}</span>
                        <span className="text-[11px] font-bold text-teal-700">{r.time}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-semibold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Interaction Checker
            </h3>
            <p className="text-[11px] text-teal-800 leading-normal">
              Cross-reference all logged medicines for safe combination & food warnings.
            </p>
            <button
              onClick={() => {
                const medNames = medicines.map((m) => m.name).join(', ');
                handleSend(`Please run a safety and drug interaction check for all my logged medicines: ${medNames || 'all active pills'}. Are they safe to take together? Highlight food restrictions or cautions, and advise if I should contact my doctor for cross-reference.`);
              }}
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 active:scale-95 transition-all shadow-2xs disabled:opacity-50"
            >
              🛡️ Check All My Medicines
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Medical Notice:</strong> MedHome AI provides assistance based on logged data. Always verify dosage & cross-reference with your doctor or pharmacist.
            </p>
          </div>
        </div>

        {/* Chat Box Container */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-xs mt-0.5 shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                  }`}
                >
                  <FormattedMessage content={msg.content} role={msg.role} leaderName={leaderName} leaderPhone={leaderPhone} />
                  <div
                    className={`mt-1 text-[11px] text-right ${
                      msg.role === 'user' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white text-xs mt-0.5 shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-slate-500 text-xs italic p-3 bg-white rounded-2xl border border-slate-200 w-fit">
                <Bot className="h-4 w-4 animate-bounce text-teal-600" />
                Analyzing schedule and generating response...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your medications, dosage instructions, low stock alerts..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 px-4 items-center gap-2 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 disabled:opacity-40 transition-all shadow-sm"
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
