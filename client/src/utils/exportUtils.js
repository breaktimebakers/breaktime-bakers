import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const REPORT_BRAND = 'Break Time Bakers'
const COLORS = {
  espresso: [59, 42, 33],
  crust: [247, 239, 226],
  proofCream: [255, 251, 243],
  ovenAmber: [201, 122, 43],
  muted: [132, 112, 98],
  line: [230, 213, 183],
}

const toTitleSlug = (title) => title.toLowerCase().replace(/\s+/g, '-')

const formatGeneratedAt = () =>
  new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function normalizePDFText(value) {
  return String(value).replace(/₹|â‚¹/g, 'Rs. ')
}

function normalizeRows(rows = [], { forPDF = false } = {}) {
  return rows.map((row) =>
    row.map((cell) => {
      if (cell === null || cell === undefined || cell === '') return '-'

      return forPDF ? normalizePDFText(cell) : String(cell)
    }),
  )
}

function buildSummaryRows(summaryRows = [], columnCount, { forPDF = false } = {}) {
  return summaryRows.map(({ label, value }) => [
    forPDF ? normalizePDFText(label) : label,
    ...Array(Math.max(columnCount - 2, 0)).fill(''),
    forPDF ? normalizePDFText(value) : value,
  ])
}

function drawPDFHeader(doc, { title, subtitle, generatedAt }) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...COLORS.proofCream)
  doc.rect(0, 0, pageWidth, 42, 'F')
  doc.setFillColor(...COLORS.ovenAmber)
  doc.rect(0, 0, pageWidth, 6, 'F')
  doc.setDrawColor(...COLORS.line)
  doc.line(14, 42, pageWidth - 14, 42)

  doc.setTextColor(...COLORS.espresso)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(REPORT_BRAND.toUpperCase(), 14, 17)

  doc.setFontSize(20)
  doc.text(title, 14, 29)

  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.muted)
    doc.text(subtitle, 14, 36)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Generated ${generatedAt}`, pageWidth - 14, 17, { align: 'right' })
}

function drawPDFFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...COLORS.line)
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(REPORT_BRAND, 14, pageHeight - 8)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }
}

export function exportPDF({ title, subtitle, columns, rows, summaryRows, filename, orientation = 'portrait' }) {
  const doc = new jsPDF({ orientation })
  const generatedAt = formatGeneratedAt()
  const normalizedRows = normalizeRows(rows, { forPDF: true })
  const normalizedSummaryRows = buildSummaryRows(summaryRows, columns.length, { forPDF: true })

  autoTable(doc, {
    head: [columns],
    body: [...normalizedRows, ...normalizedSummaryRows],
    startY: 50,
    margin: { top: 50, left: 14, right: 14, bottom: 20 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 3.2, right: 3, bottom: 3.2, left: 3 },
      textColor: COLORS.espresso,
      lineColor: COLORS.line,
      lineWidth: 0.15,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLORS.espresso,
      textColor: COLORS.proofCream,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: COLORS.crust },
    bodyStyles: { fillColor: [255, 255, 255] },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.row.index < normalizedRows.length) return

      data.cell.styles.fillColor = COLORS.proofCream
      data.cell.styles.fontStyle = 'bold'
      data.cell.styles.textColor = COLORS.espresso
      data.cell.styles.lineWidth = 0.25
    },
    willDrawPage: () => drawPDFHeader(doc, { title, subtitle, generatedAt }),
  })

  drawPDFFooter(doc)
  doc.save(filename || `${toTitleSlug(title)}.pdf`)
}

export function exportExcel({ title, subtitle, columns, rows, summaryRows, sheetName, filename }) {
  const generatedAt = formatGeneratedAt()
  const normalizedRows = normalizeRows(rows)
  const normalizedSummaryRows = buildSummaryRows(summaryRows, columns.length)
  const reportRows = [
    [title || sheetName || 'Report'],
    [subtitle || REPORT_BRAND],
    [`Generated ${generatedAt}`],
    [],
    columns,
    ...normalizedRows,
    ...(normalizedSummaryRows.length ? [[]] : []),
    ...normalizedSummaryRows,
  ]
  const ws = XLSX.utils.aoa_to_sheet(reportRows)
  const dataStartRow = 5
  const dataEndRow = reportRows.length
  const dataEndColumn = Math.max(columns.length - 1, 0)

  ws['!cols'] = columns.map((column, index) => {
    const maxCellLength = rows.reduce((max, row) => {
      const value = row[index]
      return Math.max(max, String(value ?? '').length)
    }, String(column).length)

    return { wch: Math.min(Math.max(maxCellLength + 3, 14), 34) }
  })
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: dataStartRow - 1, c: 0 },
      e: { r: Math.max(dataEndRow - 1, dataStartRow - 1), c: dataEndColumn },
    }),
  }
  ws['!freeze'] = { xSplit: 0, ySplit: dataStartRow, topLeftCell: 'A6', activePane: 'bottomLeft', state: 'frozen' }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1')
  wb.Props = {
    Title: title || sheetName || 'Export',
    Subject: subtitle || REPORT_BRAND,
    Author: REPORT_BRAND,
    CreatedDate: new Date(),
  }
  XLSX.writeFile(wb, filename || `${toTitleSlug(title || sheetName || 'export')}.xlsx`)
}
