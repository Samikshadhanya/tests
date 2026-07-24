(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,69336,t=>{"use strict";var e=t.i(43476),a=t.i(71645),o=t.i(40160),l=t.i(75254);let d=(0,l.default)("file-text",[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]),s=(0,l.default)("circle-check",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);var r=t.i(67881),i=t.i(88196);t.s(["default",0,function(){let{medicines:t,members:l,appointments:n}=(0,i.useAppStore)(),[c,h]=(0,a.useState)(!1),[m,p]=(0,a.useState)(!1);return(0,e.jsxs)("div",{className:"page-panel space-y-5 p-3 sm:p-4 md:p-6",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h1",{className:"text-2xl font-bold leading-tight text-slate-900 md:text-3xl",children:"Data Export"}),(0,e.jsx)("p",{className:"mt-1 text-sm text-slate-600 md:text-base",children:"Download your family's health records for doctor visits."})]}),(0,e.jsxs)("div",{className:"bg-white border border-slate-200 rounded-lg p-6 max-w-xl text-center space-y-6",children:[(0,e.jsx)("div",{className:"mx-auto w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center",children:(0,e.jsx)(d,{className:"w-8 h-8"})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h2",{className:"text-lg font-bold text-slate-900",children:"Comprehensive Health Report (Word)"}),(0,e.jsx)("p",{className:"text-sm text-slate-600 mt-2",children:"Generates a beautifully formatted Word Document (.doc) containing all active medicines, dosages, and upcoming appointments. Ideal for printing and sharing with your healthcare provider."})]}),(0,e.jsx)(r.Button,{onClick:()=>{h(!0),p(!1),setTimeout(()=>{let e,a,o=new Blob(["\uFEFF",(e=new Date().toLocaleDateString(),a=`
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
        <p><strong>Generated on:</strong> ${e}</p>

        <h2>Active Medications</h2>
        <table>
          <tr>
            <th>Patient (Family Member)</th>
            <th>Medicine Name</th>
            <th>Dosage & Instructions</th>
            <th>Condition / Use</th>
          </tr>`,t.forEach(t=>{let e=l.find(e=>e.id===t.assignedToId);a+=`
          <tr>
            <td>${e?.name||"Unassigned"}</td>
            <td><strong>${t.name}</strong> (${t.strength})</td>
            <td>${t.dosage} - ${t.mealInstruction}</td>
            <td>${t.use}</td>
          </tr>`}),a+=`
        </table>

        <h2>Upcoming Doctor Appointments</h2>
        <table>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Specialty</th>
            <th>Date & Time</th>
            <th>Location</th>
          </tr>`,n.forEach(t=>{let e=l.find(e=>e.id===t.memberId);a+=`
          <tr>
            <td>${e?.name||"Unassigned"}</td>
            <td>Dr. ${t.doctorName}</td>
            <td>${t.specialty}</td>
            <td>${new Date(t.date).toLocaleDateString()} at ${t.time}</td>
            <td>${t.location}</td>
          </tr>`}),a+=`
        </table>
      </body>
      </html>
    `)],{type:"application/msword"}),d=URL.createObjectURL(o),s=document.createElement("a");s.href=d,s.download="Family_Health_Report.doc",document.body.appendChild(s),s.click(),document.body.removeChild(s),h(!1),p(!0),setTimeout(()=>p(!1),3e3)},1e3)},disabled:c,className:`w-full sm:w-auto h-12 px-8 transition-all ${m?"bg-green-600 hover:bg-green-700":"bg-teal-600 hover:bg-teal-700"}`,children:c?"Generating Report...":m?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(s,{className:"w-5 h-5 mr-2"}),"Downloaded successfully"]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(o.Download,{className:"w-5 h-5 mr-2"}),"Download Word Report"]})})]})]})}],69336)}]);