"use client";
import { BrowserProvider } from "ethers";
import { useEffect, useState } from "react";
import { PageState } from "./util";
import "./renderer";
import initRenderer from "./renderer";

const SEPOLIA = "0xaa36a7";

interface Args {
    registeredAddresses: Set<string>;
}
export default function Client(args: Args) {
    const [state, setState] = useState(PageState.NoMetaMask);

    const [renderer, setRenderer] = useState(initRenderer(setState, args.registeredAddresses));
    const page = renderer.render(state);

    useEffect(()=>{
        const eth = (window as any).ethereum;
        if (eth != null) {
            eth.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],      
            });
            setRenderer(renderer.withProvider(new BrowserProvider(eth), setRenderer));
            setState(PageState.Default);
        }
    }, []);


    return page;
}