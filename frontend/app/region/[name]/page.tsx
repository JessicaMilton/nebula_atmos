"use client";

import { useParams } from "next/navigation";
import { RegionDetailPage } from "@/components/RegionDetailPage";

export default function RegionDetail() {
  const params = useParams();
  const regionName = params.name as string;
  
  return <RegionDetailPage regionName={regionName} />;
}

