import { JsonRpcSigner } from "ethers";
import { BrowserProvider } from "ethers";
import { Goal, Setter } from "../util-public";
import { PageState } from "./util";
import { JSX } from "react";
import "../globals.css"

interface Constructor {
    provider?: BrowserProvider,
    signer?: JsonRpcSigner,
    stateSetter: Setter<PageState>,
    setter?: Setter<Renderer>,
    goalData?: Goal
}
class Renderer {
    #provider?: BrowserProvider;
    #signer?: JsonRpcSigner;
    #stateSetter: Setter<PageState>;
    #setter?: Setter<Renderer>;
    #goalData?: Goal

    constructor(args: Constructor) {
        this.#provider = args.provider; this.#signer = args.signer; this.#stateSetter = args.stateSetter; 
        this.#setter = args.setter; this.#goalData = args.goalData;
    }

    withProvider(provider: BrowserProvider, setter: Setter<Renderer>) {
        return new Renderer({provider, stateSetter: this.#stateSetter, setter});
    }
    #withData(goalData: Goal) {
        return new Renderer({
            provider: this.#provider,
            signer: this.#signer,
            stateSetter: this.#stateSetter,
            setter: this.#setter,
            goalData
        });
    }

    // TODO - Implement goal claim
    render(state: PageState): JSX.Element {
        switch(state) {
            case PageState.Default:
                return <p className="error">Please add Metamask extension to your browser to proceed</p>;
            case PageState.Detected:
                return <button className="more-margin" onClick={()=>this.#connectMetamask()}>Connect Metamask</button>;
            case PageState.Connected:
                return <p>We're loading your data, please stand by.</p>;
            case PageState.Loaded:
                return <>
                    <p>Current Goal info</p>
                    <div className="box">
                        <p>Address: {this.#goalData!.address}</p>
                        <p>Cashprize: <span className="gold">{this.#goalData!.value}</span> Wei</p>
                    </div>
                </>;
            case PageState.SuccessParseFail:
                return <>
                    <p className="error">Failed to parse goal data.</p>
                    <p>Please contact the administrator</p>
                </>;
            case PageState.Missing:
                return <>
                    <p className="error">Unexepected query format.</p>
                    <p>Please contact the administrator</p>
                </>;
            case PageState.NotFound:
                return <p className="error">Please <a className="blue" href="join">claim a ticket</a> to join the hunt.</p>;
            case PageState.Corrupted:
                return <>
                    <p className="error">Your ticket is corrupted</p>
                    <p>Please contact the administrator</p>
                </>;
            case PageState.ErrorParseFail:
                return <>
                    <p className="error">An unexpected error occured.</p>
                    <p>Please contact the administrator</p>
                </>;
        }
    }

    #connectMetamask() {
        this.#provider!.getSigner().then((x)=>{
            this.#setter!(new Renderer({
                provider: this.#provider, 
                signer: x, 
                stateSetter: this.#stateSetter, 
                setter: this.#setter, 
            }));
            this.#stateSetter(PageState.Connected);
            fetch(`/api/get-goal?address=${x.address}`).then((res)=>{
                res.json().then((body)=>{
                    if (res.ok) {
                        if (body.address !== undefined && body.value !== undefined) {
                            this.#setter!(this.#withData({address: body.address, value: body.value}));
                            this.#stateSetter(PageState.Loaded);
                        } else {
                            this.#stateSetter(PageState.SuccessParseFail);
                        }
                    } else {
                        switch(body.code) {
                            case 0: this.#stateSetter(PageState.Missing); return;
                            case 1: this.#stateSetter(PageState.NotFound); return;
                            case 2: this.#stateSetter(PageState.Corrupted); return;
                            default: this.#stateSetter(PageState.ErrorParseFail); return;
                        }
                    }
                });
            });
        });
    }
}

export default function initRenderer(stateSetter: Setter<PageState>) {
    return new Renderer({stateSetter});
} 