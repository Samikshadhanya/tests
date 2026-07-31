import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: `⚠️ **AI Chatbot Setup Required**:\nPlease add your \`GEMINI_API_KEY\` to your \`.env.local\` file to enable live AI responses from Google Gemini.\n\n*Example in .env.local*:\n\`\`\`env\nGEMINI_API_KEY=your_gemini_api_key_here\n\`\`\`\nGet a free API key at [Google AI Studio](https://aistudio.google.com/).`
      });
    }

    // Build context prompt from user's current MedHome data
    let systemContext = `You are "MedHome Assistant", a friendly, highly intelligent medical and caregiver companion inside the MedHome application.
Your goal is to help users manage their medications, dosage reminders, appointments, low stock alerts, and general medical/health questions.

RULES:
1. Always maintain a warm, clear, and reassuring tone suitable for caregivers and seniors.
2. Rely on the provided user context (medicines, reminders, appointments) when answering personal schedule or inventory questions.
3. For medical or pill questions, provide clear helpful guidance but end with a gentle disclaimer: "Note: Always consult your doctor or pharmacist for official medical diagnoses and changes to your prescription."
4. When listing or summarizing items (such as medicines inventory, dosages, reminders, stock levels, or appointments), format them into a neat Markdown table with clear column headers (for example: | Medicine | Dosage | Stock | Instructions |). Avoid clumsy bullet lists when tabular data is clearer. Keep text concise and easy to read.
5. AUTOMATED REFILL ALERTS: When the user asks for a refill or requests more medicine (e.g. "I need a refill", "refill Fentanyl", "order restock"), state clearly that MedHome has AUTOMATICALLY logged the refill request and dispatched a Refill Alert notification to Household Leader ([Leader Name]). Specify the exact pill name and requested quantity (if unspecified by user, ALWAYS default quantity to "1 strip"). Format it as a prominent notice starting with: "🔔 Refill Alert Dispatched to [Leader Name]: Refill request registered for [Pill Name] ([Quantity, e.g. 1 strip])."
6. DOSE LOGGING: When the user indicates they took a dose (e.g. "I just took my Paracetamol", "marked morning pill taken"), include the action tag "[ACTION:MARK_TAKEN:MedicineName]" in your text response so MedHome automatically updates their dose schedule in real time.
7. DRUG INTERACTIONS & SAFETY CHECK: When asked about drug interactions or taking medications together, thoroughly evaluate all logged medicines. Highlight any potential interactions, food/timing precautions, or side effects. If there are any risks or uncertainties, explicitly instruct the user to contact their doctor or pharmacist for official cross-reference before taking them.`;

    if (userContext) {
      const { medicines, reminders, appointments, userName, leaderName, emergencyContact } = userContext;
      
      systemContext += `\n\n--- CURRENT USER CONTEXT ---`;
      if (userName) systemContext += `\nUser Name: ${userName}`;
      if (leaderName) systemContext += `\nHousehold Leader: ${leaderName}`;
      if (emergencyContact?.name) systemContext += `\nPersonal Emergency Contact: ${emergencyContact.name} (${emergencyContact.phone})`;

      if (medicines && Array.isArray(medicines) && medicines.length > 0) {
        systemContext += `\n\nMEDICINES INVENTORY (${medicines.length} total):\n` +
          medicines.map((m: any) => `- ${m.name} (${m.dosage || 'N/A'}): ${m.stockCount ?? 0} in stock, instructions: "${m.instructions || 'None'}"`).join('\n');
      } else {
        systemContext += `\n\nMEDICINES INVENTORY: No medicines logged yet.`;
      }

      if (reminders && Array.isArray(reminders) && reminders.length > 0) {
        systemContext += `\n\nTODAY'S REMINDERS/DOSES:\n` +
          reminders.map((r: any) => `- Medicine: ${r.medicineName || r.medicineId}, Time: ${r.time}, Status: ${r.status}`).join('\n');
      }

      if (appointments && Array.isArray(appointments) && appointments.length > 0) {
        systemContext += `\n\nUPCOMING APPOINTMENTS:\n` +
          appointments.map((a: any) => `- Doctor/Title: ${a.title || a.doctorName}, Date: ${a.date}, Time: ${a.time || 'N/A'}`).join('\n');
      }
      systemContext += `\n--- END USER CONTEXT ---\n`;
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

    // Call Gemini API via GoogleGenAI SDK or REST API
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ];

      const response = await ai.models.generateContent({
        model: modelName,
        contents
      });

      const replyText = response.text || 'I apologize, but I was unable to generate a response. Please try again.';
      return NextResponse.json({ reply: replyText });
    } catch (sdkError: any) {
      console.warn('Gemini SDK call failed, trying direct API fallback...', sdkError?.message);
      
      // Fallback REST call to Google Gemini API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemContext }] },
              ...messages.map((msg: { role: string; content: string }) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
              }))
            ]
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Gemini API call failed');
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      return NextResponse.json({ reply: replyText });
    }
  } catch (err: any) {
    console.error('Error in AI Chat API route:', err);
    return NextResponse.json(
      { error: err?.message || 'An error occurred while generating the AI response.' },
      { status: 500 }
    );
  }
}
