import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Define PDF styles
export const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#333" },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5, textAlign: "center", color: "#16a34a" },
  subtitle: { fontSize: 9, textAlign: "center", color: "#666" },
  docTitle: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 20, textDecoration: "underline" },
  metaContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  metaColumn: { width: "48%" },
  metaRow: { flexDirection: "row", marginBottom: 4 },
  metaLabel: { width: "35%", fontWeight: "bold", color: "#555" },
  metaValue: { width: "65%" },
  table: { marginTop: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#16a34a", padding: 6, fontWeight: "bold" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", padding: 6 },
  colProduct: { width: "40%", color: "#333" },
  colBatch: { width: "25%", color: "#333" },
  colSize: { width: "15%", textAlign: "right", color: "#333" },
  colQty: { width: "20%", textAlign: "right", color: "#333" },
  totalContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 15, paddingRight: 6 },
  totalBox: { alignItems: "flex-end" },
  totalText: { fontWeight: "bold", fontSize: 11, color: "#111" },
  signatureSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 60 },
  signatureBox: { width: "30%", textAlign: "center" },
  signatureLine: { marginTop: 40, borderTopWidth: 1, borderTopColor: "#000", paddingTop: 5, fontWeight: "bold" },
});

export default function SuratJalanPDF({ deliveryOrder }: { deliveryOrder: any }) {
  const totalSacks = deliveryOrder.items.reduce((sum: number, item: any) => sum + item.orderedQty, 0);
  const totalWeight = deliveryOrder.items.reduce(
    (sum: number, item: any) => sum + item.orderedQty * Number(item.batch.packagingSize),
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PT. BERAS NUSANTARA</Text>
          <Text style={styles.subtitle}>
            Jl. Raya Padi No. 88, Karawang, Jawa Barat | Telp: (0267) 123456 | Email: info@berasnusantara.co.id
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.docTitle}>SURAT JALAN / DELIVERY ORDER</Text>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaColumn}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Nomor DO</Text>
              <Text style={styles.metaValue}>: {deliveryOrder.doNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tanggal Kirim</Text>
              <Text style={styles.metaValue}>
                : {new Date(deliveryOrder.deliveryDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status DO</Text>
              <Text style={styles.metaValue}>: {deliveryOrder.status}</Text>
            </View>
          </View>
          <View style={styles.metaColumn}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Pelanggan</Text>
              <Text style={styles.metaValue}>: {deliveryOrder.customer.name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Alamat Kirim</Text>
              <Text style={styles.metaValue}>
                : {deliveryOrder.customer.deliveryAddress}, {deliveryOrder.customer.city}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Driver / Supir</Text>
              <Text style={styles.metaValue}>: {deliveryOrder.driver?.name || "Belum Ditugaskan"}</Text>
            </View>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colProduct, { color: "#fff", fontWeight: "bold" }]}>Nama Produk</Text>
            <Text style={[styles.colBatch, { color: "#fff", fontWeight: "bold" }]}>Nomor Batch</Text>
            <Text style={[styles.colSize, { color: "#fff", fontWeight: "bold", textAlign: "right" }]}>Kemasan</Text>
            <Text style={[styles.colQty, { color: "#fff", fontWeight: "bold", textAlign: "right" }]}>Jumlah (Sak)</Text>
          </View>
          {/* Table Items */}
          {deliveryOrder.items.map((item: any, idx: number) => (
            <View key={item.id || idx} style={styles.tableRow}>
              <Text style={styles.colProduct}>{item.batch.product.name}</Text>
              <Text style={styles.colBatch}>{item.batch.batchNumber}</Text>
              <Text style={styles.colSize}>{Number(item.batch.packagingSize)} kg</Text>
              <Text style={styles.colQty}>{item.orderedQty}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.totalContainer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>Total Sacks: {totalSacks} Sak</Text>
            <Text style={[styles.totalText, { marginTop: 4 }]}>Total Berat: {totalWeight.toLocaleString("id-ID")} kg</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Dibuat Oleh,</Text>
            <Text style={styles.signatureLine}>{deliveryOrder.createdBy.name}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Supir Pengirim,</Text>
            <Text style={styles.signatureLine}>{deliveryOrder.driver?.name || "........................"}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Diterima Oleh,</Text>
            <Text style={styles.signatureLine}>{deliveryOrder.customer.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
