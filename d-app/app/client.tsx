"use client";
import { useEffect, useState } from "react";

export default function Client(args: Args) {
    const [height, setHeight] = useState("");

    useEffect(()=>{
        const handler = ()=>{
            const elm = document.getElementById(args.navId);
            if (!elm) { return; }
            
            const style = window.getComputedStyle(elm).height;
            setHeight(style);
        }; handler();

        window.addEventListener("resize", handler);
    }, []);

    return <div style={{marginBottom: `${height}`}}>{args.children}</div>;
}

interface Args {
    children: React.ReactNode;
    navId: string;
}