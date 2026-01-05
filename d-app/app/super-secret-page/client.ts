"use client"

import { useEffect, useState } from "react";
import { askMetamask, Goal } from "../util-public";
import { initRenderer } from "./renderer";
import { PageState } from "./util";

interface Args {
    goals: Readonly<Goal[]>
}
export default function Client(args: Args) {
    const [state, setState] = useState(PageState.NoMetamask);
    const [renderer, setRenderer] = useState(initRenderer(setState, args.goals));

    useEffect(()=>{
        const provider = askMetamask();
        if (provider != null) {
            setRenderer(renderer.withProvider(provider, setRenderer));
            setState(PageState.MetaMaskDetected);
        }
    }, []);

    return renderer.render(state);
}