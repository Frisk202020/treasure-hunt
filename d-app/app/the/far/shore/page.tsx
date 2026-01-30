"use client"
import { Suspense } from "react";
import Gate from "./gate";
import "../../../globals.css";

export default function TheFarShore() {
    return <Suspense fallback={<div className="main">Loading...</div>}>
        <Gate></Gate>
    </Suspense>
}