"use client";

import { useParams } from "next/navigation";
import { ReportDetailPage } from "@/components/ReportDetailPage";

export default function ReportDetail() {
  const params = useParams();
  const reportId = params.id as string;
  
  return <ReportDetailPage reportId={reportId} />;
}

