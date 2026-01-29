import { setAndRebuild } from "@/app/util-public";
import { useState } from "react";

export default function Runes() {
    const [classes, setClasses] = useState(Array<string>(6).fill(""));
    return [
        {name: "prelude", left: 5, top: 25, twist: -30},
        {name: "following", left: 2, top: 40, twist: 5},
        {name: "holy", left: 10, top: 80, twist: -70},
        {name: "first", left: -5, top: 30, twist: 180},
        {name: "second", left: -3, top: 40, twist: 0},
        {name: "last", left: -5, top: 70, twist: 90}
    ].map((params, i)=><img 
        className={`riddle ${classes[i]}`} 
        style={{
            left: params.left >= 0 ? `${params.left}vw` : undefined, 
            right: params.left < 0 ? `${-params.left}vw` : undefined,
            top: `${params.top}vh`,
            transform: `rotate(${params.twist}deg)`
        }} 
        src={`/${params.name}.png`} 
        key={params.name}
        onMouseEnter={()=>setClasses(setAndRebuild(classes, "appear", i))}
        onMouseLeave={()=>setClasses(setAndRebuild(classes, "disappear", i))}
        >
    </img>);
}