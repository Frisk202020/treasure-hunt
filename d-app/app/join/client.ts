"use client";
import { useEffect, useState } from "react";
import { PageState } from "./util";
import { askMetamask } from "../util-public";
import initRenderer from "./renderer";

export default function Client() {
    const [state, setState] = useState(PageState.Default);
    const [renderer, setRenderer] = useState(initRenderer(setState));

    const page = renderer.render(state);

    useEffect(()=>{
        const provider = askMetamask();
        if (provider == null) {
            setState(PageState.NoMetaMask);
        } else {
            setRenderer(renderer.withProvider(provider, setRenderer));
            setState(PageState.MetaMaskPending);
        }
    }, []);


    return page;
}