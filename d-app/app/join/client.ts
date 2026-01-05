"use client";
import { useEffect, useState } from "react";
import { PageState } from "./util";
import { askMetamask } from "../util-public";
import initRenderer from "./renderer";

interface Args {
    registeredAddresses: Set<string>;
}
export default function Client(args: Args) {
    const [state, setState] = useState(PageState.Default);
    const [renderer, setRenderer] = useState(initRenderer(setState, args.registeredAddresses));

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