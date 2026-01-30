"use client"
import { Suspense, useState } from "react";
import Gate from "./gate";

export default function TheFarShore() {
    return <Suspense fallback={<p>Loading...</p>}>
        <Gate></Gate>
    </Suspense>
}