import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bot, Send, ArrowLeft } from 'lucide-react-native';
import { useAppStore } from '../lib/app-store';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
};

export default function AiAssistantScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your MedHome Health Assistant. How can I assist you with your household medicines or dosage guidelines today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const { user, medicines, todayReminders, appointments, members } = useAppStore();

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg: Message = { id: String(Date.now()), sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    setSending(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      let systemContext = `You are "MedHome Assistant", a friendly medical companion inside the MedHome application.
Your goal is to help users manage their medications, dosage reminders, and appointments.
Always maintain a warm, clear, and reassuring tone.
If there are any medical risks, explicitly instruct the user to contact their doctor.

--- CURRENT USER CONTEXT ---
User Name: ${user.name}
Household: ${user.household}
Elder Mode: ${user.elderMode ? 'Yes' : 'No'}

MEDICINES INVENTORY:
${medicines.length > 0 ? medicines.map(m => {
  const member = members.find(mbr => mbr.id === m.assignedToId);
  return `- ${m.name} (Assigned to: ${member ? member.name : 'Unassigned'}): ${m.dosage}, ${m.quantity} in stock, instructions: "${m.mealInstruction}"`;
}).join('\n') : 'No medicines logged.'}

TODAY'S REMINDERS:
${todayReminders.length > 0 ? todayReminders.map((r: any) => {
  const med = medicines.find(m => m.id === r.medicineId);
  const member = members.find(mbr => mbr.id === r.memberId);
  return `- ${med?.name || r.medicineId} (For: ${member ? member.name : 'Unknown'}) at ${r.time} (Status: ${r.status})`;
}).join('\n') : 'No reminders.'}

UPCOMING APPOINTMENTS:
${appointments.length > 0 ? appointments.map(a => `- Dr. ${a.doctorName}, Date: ${a.date} at ${a.time}`).join('\n') : 'No appointments.'}
--- END USER CONTEXT ---`;

      const formattedMessages = messages.slice(1).map(m => ({
        role: m.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const contents = [
        ...formattedMessages,
        { role: 'user', parts: [{ text: currentInput }] }
      ];

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemContext }]
          },
          contents
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API Error");

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please check with your doctor.';
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), sender: 'bot', text: botText }]);
    } catch (e: any) {
      console.error('Gemini API Error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: 'I can help answer general questions about medicines and dosage. Always consult a healthcare provider for medical advice. (Offline mode/Error)',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Bot size={22} color="#0f766e" />
          <Text style={styles.headerTitle}>AI Health Assistant</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chatList}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText, msg.sender === 'user' ? styles.userText : styles.botText]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about medicines, doses, or side effects..."
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity onPress={handleSend} disabled={!input.trim() || sending} style={styles.sendBtn}>
          <Send size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chatList: {
    padding: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f766e',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#1e293b',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
