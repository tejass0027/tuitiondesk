import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate, formatMonth } from "@/lib/format";
import { amountInWords, rupees } from "@/lib/receipt";

/*
 * A one-page fee receipt (A5), drawn with @react-pdf/renderer.
 * Built-in Helvetica has no ₹ sign, so amounts are written "Rs. 1,500".
 */

const C = {
  ink: "#2a2420",
  muted: "#6b625b",
  line: "#e4ddd3",
  soft: "#f7f4ef",
  primary: "#4338ca",
  primarySoft: "#eceafd",
  good: "#137d41",
  goodSoft: "#e3f4ea",
  warn: "#995600",
  warnSoft: "#fdf1dc",
};

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: C.primary },
  centreName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.primary, maxWidth: 230 },
  centreMeta: { fontSize: 8.5, color: C.muted, marginTop: 3, maxWidth: 230 },
  titleBox: { alignItems: "flex-end" },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  meta: { fontSize: 8.5, color: C.muted, marginTop: 3 },
  metaStrong: { fontFamily: "Helvetica-Bold", color: C.ink },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, padding: 9, backgroundColor: C.soft, borderRadius: 5 },
  infoCell: { width: "50%", paddingVertical: 2.5, flexDirection: "row" },
  infoLabel: { width: 58, color: C.muted, fontSize: 8.5 },
  infoValue: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 9.5 },

  table: { marginTop: 12, borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: C.primarySoft },
  th: { paddingVertical: 5, paddingHorizontal: 7, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  td: { paddingVertical: 6, paddingHorizontal: 7, fontSize: 9.5 },
  right: { textAlign: "right" },

  paidBox: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 11, borderRadius: 6, backgroundColor: C.primary },
  paidLabel: { color: "#ffffff", fontSize: 9, letterSpacing: 1 },
  paidValue: { color: "#ffffff", fontSize: 20, fontFamily: "Helvetica-Bold" },
  words: { marginTop: 6, fontSize: 8.5, color: C.muted, fontFamily: "Helvetica-Oblique" },

  status: { marginTop: 12, padding: 8, borderRadius: 5, fontSize: 9.5, fontFamily: "Helvetica-Bold", textAlign: "center" },

  signRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 34 },
  sign: { width: 150, borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 4, fontSize: 8.5, color: C.muted, textAlign: "center" },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, textAlign: "center", fontSize: 7.5, color: C.muted },
});

export type FeeReceiptProps = {
  receiptNo: string;
  centre: { name: string; address: string; phone: string };
  student: { name: string; class: string; batch: string; parentName: string };
  month: string; // "yyyy-MM-01"
  payment: { amount: number; paidOn: string; mode: string; note: string };
  fee: { due: number; paidSoFar: number; balance: number };
};

export function FeeReceipt({ receiptNo, centre, student, month, payment, fee }: FeeReceiptProps) {
  const fullyPaid = fee.balance <= 0;
  return (
    <Document title={`Fee receipt ${receiptNo} – ${student.name}`} author={centre.name} creator="TuitionDesk">
      <Page size="A5" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.centreName}>{centre.name}</Text>
            {centre.address ? <Text style={s.centreMeta}>{centre.address}</Text> : null}
            {centre.phone ? <Text style={s.centreMeta}>Phone: {centre.phone}</Text> : null}
          </View>
          <View style={s.titleBox}>
            <Text style={s.title}>FEE RECEIPT</Text>
            <Text style={s.meta}>
              No. <Text style={s.metaStrong}>{receiptNo}</Text>
            </Text>
            <Text style={s.meta}>
              Date <Text style={s.metaStrong}>{formatDate(payment.paidOn)}</Text>
            </Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <Info label="Student" value={student.name} />
          <Info label="Class" value={student.class || "–"} />
          <Info label="Parent" value={student.parentName || "–"} />
          <Info label="Batch" value={student.batch || "–"} />
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2 }]}>Description</Text>
            <Text style={[s.th, s.right, { flex: 1.3 }]}>Amount</Text>
          </View>
          <Row label={`Tuition fee for ${formatMonth(month)}`} value={rupees(fee.due)} />
          <Row label="Paid now" value={rupees(payment.amount)} bold />
          {fee.paidSoFar > payment.amount && <Row label="Total paid for this month" value={rupees(fee.paidSoFar)} />}
          <Row label="Balance left" value={rupees(Math.max(fee.balance, 0))} />
          <Row label="Paid by" value={[payment.mode, payment.note].filter(Boolean).join(" · ")} />
        </View>

        <View style={s.paidBox}>
          <Text style={s.paidLabel}>AMOUNT RECEIVED</Text>
          <Text style={s.paidValue}>{rupees(payment.amount)}</Text>
        </View>
        <Text style={s.words}>{amountInWords(payment.amount)}</Text>

        <Text
          style={[
            s.status,
            fullyPaid ? { backgroundColor: C.goodSoft, color: C.good } : { backgroundColor: C.warnSoft, color: C.warn },
          ]}
        >
          {fullyPaid
            ? `${formatMonth(month)} fee fully paid. Thank you!`
            : `${rupees(fee.balance)} still due for ${formatMonth(month)}`}
        </Text>

        <View style={s.signRow}>
          <Text style={s.sign}>For {centre.name}</Text>
        </View>

        <Text style={s.footer} fixed>
          Computer-generated receipt from TuitionDesk. No signature needed.
        </Text>
      </Page>
    </Document>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const weight = bold ? { fontFamily: "Helvetica-Bold" } : {};
  return (
    <View style={s.tr} wrap={false}>
      <Text style={[s.td, { flex: 2 }, weight]}>{label}</Text>
      <Text style={[s.td, s.right, { flex: 1.3 }, weight]}>{value}</Text>
    </View>
  );
}
