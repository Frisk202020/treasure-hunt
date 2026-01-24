"use client";
import { useEffect, useState } from "react";
import { PageState } from "./util";
import { ask_metamask } from "../util-public";
import initRenderer from "./renderer";

export default function Client() {
    const [state, setState] = useState(PageState.Default);
    const [renderer, setRenderer] = useState(initRenderer(setState));

    useEffect(()=>{
        const provider = ask_metamask();
        if (provider != null) {
            setRenderer(renderer.with_provider(provider, setRenderer));
            setState(PageState.MetaMaskPending);
        }
    }, []);


    return renderer.render(state);
}