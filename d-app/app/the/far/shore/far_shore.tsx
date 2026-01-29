import { useState } from "react";
import "./style.css";
import Core from "./core";
import Prelude from "./prelude";

export default function FarShore() {
    const [className, setClass] = useState("inactive");
    const [enabled, setActivation] = useState(false);

    return <>
        {enabled ? <Core  setClass={setClass}></Core> : <Prelude setClass={setClass} setActivation={setActivation}></Prelude>}
        <div id="screen" className={className}></div>
    </>
}