"use client"

import { useEffect, useState } from "react";
import { ask_metamask, Goal } from "../util-public";
import { initRenderer } from "./renderer";
import { PageState } from "./util";

interface Args {
    bank: string,
    goals: Readonly<Goal[]>
}
export default function Client(args: Args) {
    const [state, setState] = useState(PageState.NoMetamask);
    const [renderer, setRenderer] = useState(initRenderer(setState, args.goals, args.bank));

    useEffect(()=>{
        const provider = ask_metamask();
        if (provider != null) {
            setRenderer(renderer.with_provider(provider, setRenderer));
            setState(PageState.MetaMaskDetected);
        }
    }, []);

    return renderer.render(state);
}