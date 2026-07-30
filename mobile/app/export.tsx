import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/app-store';
import { ChevronLeft, Download, FileText, CheckCircle2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ExportScreen() {
  const router = useRouter();
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

  const handleExport = async () => {
    setExporting(true);
    setSuccess(false);

    try {
      const docData = generateWordDoc();
      const { uri } = await Print.printToFileAsync({ html: docData, base64: false });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Family Health Report',
          UTI: 'com.adobe.pdf'
        });
        setSuccess(true);
      } else {
        alert("Sharing is not available on this device");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to export report");
    } finally {
      setExporting(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Export</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Download your family's health records for doctor visits.</Text>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <FileText size={32} color="#0f766e" />
          </View>
          
          <Text style={styles.cardTitle}>Comprehensive Health Report (PDF)</Text>
          <Text style={styles.cardDesc}>
            Generates a beautifully formatted PDF Document containing all active medicines, dosages, and upcoming appointments. Ideal for viewing on any device and sharing with your healthcare provider.
          </Text>

          <TouchableOpacity 
            style={[styles.exportBtn, success && styles.exportSuccess]} 
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Text style={styles.exportBtnText}>Generating Report...</Text>
            ) : success ? (
              <>
                <CheckCircle2 size={20} color="#ffffff" />
                <Text style={styles.exportBtnText}>Shared successfully</Text>
              </>
            ) : (
              <>
                <Download size={20} color="#ffffff" />
                <Text style={styles.exportBtnText}>Generate Report (PDF)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  cardDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f766e', width: '100%', paddingVertical: 14, borderRadius: 8 },
  exportSuccess: { backgroundColor: '#16a34a' },
  exportBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});
