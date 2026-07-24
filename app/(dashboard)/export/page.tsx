'use client';

import { useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';

export default function ExportPage() {
  const { medicines, members, appointments } = useAppStore();
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateWordDoc = () => {
    const currentDate = new Date().toLocaleDateString();
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Family Health Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 5px; }
          h2 { color: #0f766e; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>Family Health Report</h1>
        <p><strong>Generated on:</strong> ${currentDate}</p>

        <h2>Active Medications</h2>
        <table>
          <tr>
            <th>Patient (Family Member)</th>
            <th>Medicine Name</th>
            <th>Dosage & Instructions</th>
            <th>Condition / Use</th>
          </tr>`;

    medicines.forEach(m => {
      const member = members.find(mbr => mbr.id === m.assignedToId);
      htmlContent += `
          <tr>
            <td>${member?.name || 'Unassigned'}</td>
            <td><strong>${m.name}</strong> (${m.strength})</td>
            <td>${m.dosage} - ${m.mealInstruction}</td>
            <td>${m.use}</td>
          </tr>`;
    });

    htmlContent += `
        </table>

        <h2>Upcoming Doctor Appointments</h2>
        <table>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Specialty</th>
            <th>Date & Time</th>
            <th>Location</th>
          </tr>`;

    appointments.forEach(a => {
      const member = members.find(mbr => mbr.id === a.memberId);
      htmlContent += `
          <tr>
            <td>${member?.name || 'Unassigned'}</td>
            <td>Dr. ${a.doctorName}</td>
            <td>${a.specialty}</td>
            <td>${new Date(a.date).toLocaleDateString()} at ${a.time}</td>
            <td>${a.location}</td>
          </tr>`;
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const handleExport = () => {
    setExporting(true);
    setSuccess(false);

    setTimeout(() => {
      const docData = generateWordDoc();
      const blob = new Blob(['\ufeff', docData], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Family_Health_Report.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExporting(false);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Data Export</h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">Download your family's health records for doctor visits.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-slate-900">Comprehensive Health Report (Word)</h2>
          <p className="text-sm text-slate-600 mt-2">
            Generates a beautifully formatted Word Document (.doc) containing all active medicines, dosages, and upcoming appointments. Ideal for printing and sharing with your healthcare provider.
          </p>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={exporting}
          className={`w-full sm:w-auto h-12 px-8 transition-all ${success ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}`}
        >
          {exporting ? (
            'Generating Report...'
          ) : success ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Downloaded successfully
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Download Word Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
