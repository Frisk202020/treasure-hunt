"use client"

import { useEffect, useState } from "react";
import initRenderer from "./renderer";
import { PageState } from "./util";
import "../globals.css";
import { askMetamask } from "../util-public";

export default function Goals() {
    const [state, setState] = useState(PageState.Default);
    const [renderer, setRenderer] = useState(initRenderer(setState));
    useEffect(()=>{
        const provider = askMetamask();
        if (provider != null) {
            setRenderer(renderer.withProvider(provider, setRenderer));
            setState(PageState.Detected);
        }
    }, []);

    return <>
        <h1 className="rainbow">Claim Hunt Goals !</h1>

        <div id="main">
            {renderer.render(state)}
        </div>
    </>
}