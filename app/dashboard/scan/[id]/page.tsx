"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardScanIdPage() {
  useEffect(() => {
    redirect("/dashboard/scan");
  }, []);
  return null;
}
