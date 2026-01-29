"use client";

import "../globals.css"; import "./style.css";
import Heart from "./heart";
import Holy from "./holy";
import { useState } from "react";
import { setAndRebuild } from "../util-public";
import { Args } from "./shared";

const GOAL_DATA = [
    {icon: "soul", data: (args: Args)=>buildHeart(args), title: "Stay determined !"},
    {icon: "seeker", data: (args: Args)=>buildHoly(args), title: "The Golden Goal."}
];
const ANIMATION_TIME = 1500; // ms

export default function Page() {
    const [wrapper_classes, setWClasses] = useState(Array<string>(GOAL_DATA.length).fill(""));
    const [icon_classes, setIClasses] = useState(Array<string>(GOAL_DATA.length).fill(""));
    const [data_enabled, setEnabled] = useState(Array<boolean>(GOAL_DATA.length).fill(false));
    const [data_classes, setDClasses] = useState(Array<string>(GOAL_DATA.length).fill(""));

    return <div id="main">
        <h1 className="rainbow">Need some help ?</h1>
        <p>Here you can find some guidelines to help you find <span className="rainbow">Hunt goal</span> keys.</p>
        {GOAL_DATA.map((x,i)=>{
           return <div className={`wrapper ${wrapper_classes[i]}`} key={x.icon} onClick={()=>{
                    setWClasses(setAndRebuild(wrapper_classes, "enabled", i)); setIClasses(setAndRebuild(icon_classes, "icon-enabled", i));
                    new Promise((r)=>setTimeout(r, ANIMATION_TIME)).then(()=>{
                        setEnabled(setAndRebuild(data_enabled, true, i));
                    });
                }}>
                <div style={{display: "flex", flexDirection: "row"}}>
                    <div className={`icon-container ${icon_classes[i]}`}>
                        <img src={`/${x.icon}.png`} className="icon"></img>
                    </div>
                    {data_enabled[i] ? <p style={{display: "grid", alignItems: "center"}} className="title">{x.title}</p> : <></>}
                </div>
                {data_enabled[i] ? <div className={`data ${data_classes[i]}`}>{x.data({
                    set: setDClasses, from: data_classes, index: i
                })}</div> : <></>}
            </div>; 
        })}
    </div>
}

function buildHeart(args: Args) {
    return <Heart set={args.set} from={args.from} index={args.index}></Heart>
} function buildHoly(args: Args) {
    return <Holy set={args.set} from={args.from} index={args.index}></Holy>
}