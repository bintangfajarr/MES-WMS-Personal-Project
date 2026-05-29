"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Alert } from "@prisma/client";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      const result = await res.json();
      if (result.success) {
        setAlerts(result.data);
        setError(null);
      } else {
        setError(result.error || "Gagal memuat alert");
      }
    } catch (e) {
      console.error("Error fetching alerts:", e);
      setError("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissAlert = async (id: string) => {
    try {
      // Optimistic update
      setAlerts((prev) => prev.filter((a) => a.id !== id));

      const res = await fetch(`/api/alerts/${id}/dismiss`, {
        method: "PATCH",
      });
      const result = await res.json();

      if (result.success) {
        toast.success("Alert berhasil diselesaikan");
      } else {
        toast.error("Gagal menyelesaikan alert: " + result.error);
        // Rollback state by refetching
        fetchAlerts(true);
      }
    } catch (e) {
      console.error("Error dismissing alert:", e);
      toast.error("Gagal terhubung ke server");
      fetchAlerts(true);
    }
  };

  const triggerAlertCheck = async () => {
    try {
      const res = await fetch("/api/alerts/check", {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Pengecekan alert selesai");
        fetchAlerts(true);
      } else {
        toast.error("Pengecekan alert gagal: " + result.error);
      }
    } catch (e) {
      console.error("Error checking alerts:", e);
      toast.error("Gagal terhubung ke server");
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Poll every 30 seconds to keep alerts updated
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refresh: () => fetchAlerts(false),
    dismissAlert,
    triggerAlertCheck,
  };
}
