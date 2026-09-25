import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import { formatMarks } from "@/lib/marks";
import type { summarizeAttendance, summarizeMarks } from "@/lib/report";

/*
 * The printable report card, drawn with @react-pdf/renderer.
 * Uses the built-in Helvetica font, so it stays small and works everywhere.
 */

const C = {
  ink: "#2a2420",
  muted: "#6b625b",
  line: "#e4ddd3",
  soft: "#f7f4ef",
  primary: "#4338ca",
  primarySoft: "#eceafd",
  good: "#137d41",
  warn: "#995600",
  bad: "#b42318",
};

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 48, paddingHorizontal: 36, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.primary },
  centreName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.primary },
  centreMeta: { fontSize: 9, color: C.muted, marginTop: 3, maxWidth: 300 },
  titleBox: { alignItems: "flex-end" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  period: { fontSize: 9, color: C.muted, marginTop: 3 },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, padding: 10, backgroundColor: C.soft, borderRadius: 6 },
  infoCell: { width: "50%", paddingVertical: 3, flexDirection: "row" },
  infoLabel: { width: 70, color: C.muted, fontSize: 9 },
  infoValue: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 10 },

  tiles: { flexDirection: "row", marginTop: 14, gap: 8 },
  tile: { flex: 1, padding: 10, borderWidth: 1, borderColor: C.line, borderRadius: 6 },
  tileLabel: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  tileValue: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 4 },
  tileNote: { fontSize: 8.5, color: C.muted, marginTop: 2 },

  sectionTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 6, color: C.primary },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: C.primarySoft },
  th: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.ink },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  td: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 9.5 },
  right: { textAlign: "right" },
  empty: { padding: 10, fontSize: 9.5, color: C.muted, borderWidth: 1, borderColor: C.line, borderRadius: 4 },

  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 56 },
  sign: { width: 170, borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 4, fontSize: 9, color: C.muted, textAlign: "center" },

  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted },
});

function toneFor(percent: number | null) {
  if (percent === null) return C.muted;
  if (percent >= 75) return C.good;
  if (percent >= 40) return C.warn;
  return C.bad;
}

export type ReportCardProps = {
  centre: { name: string; address: string; phone: string };
  student: { name: string; class: string; batch: string; parentName: string; joiningDate: string };
  periodLabel: string;
  attendance: ReturnType<typeof summarizeAttendance>;
  marks: ReturnType<typeof summarizeMarks>;
  generatedOn: string; // "yyyy-MM-dd"
};

export function ReportCard({ centre, student, periodLabel, attendance, marks, generatedOn }: ReportCardProps) {
  return (
    <Document title={`Report card – ${student.name}`} author={centre.name} creator="TuitionDesk">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.centreName}>{centre.name}</Text>
            {(centre.address || centre.phone) && (
              <Text style={s.centreMeta}>{[centre.address, centre.phone && `Phone: ${centre.phone}`].filter(Boolean).join("  |  ")}</Text>
            )}
          </View>
          <View style={s.titleBox}>
            <Text style={s.title}>PROGRESS REPORT</Text>
            <Text style={s.period}>{periodLabel}</Text>
          </View>
        </View>

        {/* Student details */}
        <View style={s.infoGrid}>
          <Info label="Student" value={student.name} />
          <Info label="Class" value={student.class || "–"} />
          <Info label="Batch" value={student.batch || "–"} />
          <Info label="Parent" value={student.parentName || "–"} />
          <Info label="Joined on" value={formatDate(student.joiningDate)} />
          <Info label="Period" value={periodLabel} />
        </View>

        {/* Summary tiles */}
        <View style={s.tiles}>
          <Tile
            label="Attendance"
            value={attendance.percent === null ? "–" : `${attendance.percent}%`}
            note={
              attendance.total
                ? `${attendance.present} of ${attendance.total} ${attendance.total === 1 ? "class" : "classes"} attended`
                : "No classes marked"
            }
            color={toneFor(attendance.percent)}
          />
          <Tile
            label="Test average"
            value={marks.average === null ? "–" : `${marks.average}%`}
            note={marks.averageLabel ?? "No tests written"}
            color={toneFor(marks.average)}
          />
          <Tile
            label="Tests written"
            value={`${marks.written}/${marks.tests.length}`}
            note={marks.missed ? `Missed ${marks.missed}` : "Did not miss any"}
            color={C.ink}
          />
        </View>

        {/* Attendance by month */}
        <Text style={s.sectionTitle}>Attendance</Text>
        {attendance.total === 0 ? (
          <Text style={s.empty}>No attendance was marked in this period.</Text>
        ) : (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 2 }]}>Month</Text>
              <Text style={[s.th, s.right, { flex: 1 }]}>Classes</Text>
              <Text style={[s.th, s.right, { flex: 1 }]}>Present</Text>
              <Text style={[s.th, s.right, { flex: 1 }]}>Absent</Text>
              <Text style={[s.th, s.right, { flex: 1.2 }]}>Attendance</Text>
            </View>
            {attendance.byMonth.map((m) => (
              <View key={m.month} style={s.tr} wrap={false}>
                <Text style={[s.td, { flex: 2 }]}>{m.label}</Text>
                <Text style={[s.td, s.right, { flex: 1 }]}>{m.total}</Text>
                <Text style={[s.td, s.right, { flex: 1 }]}>{m.present}</Text>
                <Text style={[s.td, s.right, { flex: 1 }]}>{m.absent}</Text>
                <Text style={[s.td, s.right, { flex: 1.2, color: toneFor(m.percent), fontFamily: "Helvetica-Bold" }]}>
                  {m.percent === null ? "–" : `${m.percent}%`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Test results */}
        <Text style={s.sectionTitle}>Test results</Text>
        {marks.tests.length === 0 ? (
          <Text style={s.empty}>No tests were held in this period.</Text>
        ) : (
          <View style={s.table}>
            <View style={s.thead} fixed>
              <Text style={[s.th, { flex: 1.3 }]}>Date</Text>
              <Text style={[s.th, { flex: 2.2 }]}>Test</Text>
              <Text style={[s.th, { flex: 1.6 }]}>Subject</Text>
              <Text style={[s.th, s.right, { flex: 1.1 }]}>Marks</Text>
              <Text style={[s.th, s.right, { flex: 0.8 }]}>%</Text>
              <Text style={[s.th, { flex: 1.7 }]}>Performance</Text>
            </View>
            {marks.tests.map((t, i) => (
              <View key={`${t.name}-${t.date}-${i}`} style={s.tr} wrap={false}>
                <Text style={[s.td, { flex: 1.3 }]}>{formatDate(t.date)}</Text>
                <Text style={[s.td, { flex: 2.2 }]}>{t.name}</Text>
                <Text style={[s.td, { flex: 1.6 }]}>{t.subject || "–"}</Text>
                <Text style={[s.td, s.right, { flex: 1.1 }]}>
                  {t.marks === null ? "AB" : `${formatMarks(t.marks)}/${formatMarks(t.max)}`}
                </Text>
                <Text style={[s.td, s.right, { flex: 0.8 }]}>{t.percent === null ? "–" : `${t.percent}%`}</Text>
                <Text style={[s.td, { flex: 1.7, color: toneFor(t.percent), fontFamily: "Helvetica-Bold" }]}>{t.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Subject-wise */}
        {marks.bySubject.length > 1 && (
          <>
            <Text style={s.sectionTitle}>Subject-wise average</Text>
            <View style={s.table} wrap={false}>
              <View style={s.thead}>
                <Text style={[s.th, { flex: 2.5 }]}>Subject</Text>
                <Text style={[s.th, s.right, { flex: 1 }]}>Tests</Text>
                <Text style={[s.th, s.right, { flex: 1 }]}>Average</Text>
                <Text style={[s.th, { flex: 2 }]}>Performance</Text>
              </View>
              {marks.bySubject.map((sub) => (
                <View key={sub.subject} style={s.tr}>
                  <Text style={[s.td, { flex: 2.5 }]}>{sub.subject}</Text>
                  <Text style={[s.td, s.right, { flex: 1 }]}>{sub.tests}</Text>
                  <Text style={[s.td, s.right, { flex: 1 }]}>{sub.average}%</Text>
                  <Text style={[s.td, { flex: 2, color: toneFor(sub.average), fontFamily: "Helvetica-Bold" }]}>{sub.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Signatures */}
        <View style={s.signRow} wrap={false}>
          <Text style={s.sign}>Teacher&apos;s signature</Text>
          <Text style={s.sign}>Parent&apos;s signature</Text>
        </View>

        <View style={s.footer} fixed>
          <Text>
            Generated on {formatDate(generatedOn)} with TuitionDesk
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
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

function Tile({ label, value, note, color }: { label: string; value: string; note: string; color: string }) {
  return (
    <View style={s.tile}>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={[s.tileValue, { color }]}>{value}</Text>
      <Text style={s.tileNote}>{note}</Text>
    </View>
  );
}
