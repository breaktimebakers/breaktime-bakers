import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function exportPDF({ title, subtitle, columns, rows, filename }) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(title, 14, 20)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(subtitle, 14, 27)
  }
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: subtitle ? 32 : 26,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [201, 122, 43], textColor: [59, 42, 33] },
    alternateRowStyles: { fillColor: [247, 239, 226] },
  })
  doc.save(filename || `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

export function exportExcel({ columns, rows, sheetName, filename }) {
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1')
  XLSX.writeFile(wb, filename || 'export.xlsx')
}
