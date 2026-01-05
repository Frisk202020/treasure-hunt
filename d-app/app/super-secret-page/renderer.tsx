import { JsonRpcSigner } from "ethers";
import { BrowserProvider } from "ethers";
import { BANK_ADDRESS, CHAIN_ID, Goal, Setter } from "../util-public";
import { JSX } from "react";
import { PageState } from "./util";
import { TransactionRequest } from "ethers";
import { Interface } from "ethers";
import "../globals.css";

const WITHDRAW = new Interface(["function withdraw()"]).encodeFunctionData("withdraw");

interface Constructor {
    provider?: BrowserProvider,
    signer?: JsonRpcSigner,
    stateSetter: Setter<PageState>,
    setter?: Setter<Renderer>,
    data: Readonly<Goal[]>;
}

class Renderer {
    #provider?: BrowserProvider;
    #signer?: JsonRpcSigner;
    #stateSetter: Setter<PageState>;
    #setter?: Setter<Renderer>;
    #data: Readonly<Goal[]>;

    constructor(args: Constructor) {
        this.#provider = args.provider; this.#signer = args.signer; this.#stateSetter = args.stateSetter; 
        this.#setter = args.setter; this.#data = args.data;
    }

    withProvider(provider: BrowserProvider, setter: Setter<Renderer>) {
        return new Renderer({provider, stateSetter: this.#stateSetter, setter, data: this.#data});
    }

    render(state: PageState): JSX.Element {
        const buttons = <>
            <button className="more-margin" onClick={()=>this.#claim()}>Claim funds</button>

            <p className="more-margin">Additionally you can fund goals here, if you didn't already.</p>
            <div className="goals" style={{display: "flex", justifyContent: "space-evenly"}}>
                {this.#getGoalButtons()}
            </div>
        </>;

        switch (state) {
            case PageState.NoMetamask:
                return <p className="error">Please add Metamask extension to your browser to proceed</p>;
            case PageState.MetaMaskDetected:
                return <button className="more-margin" onClick={()=>this.#connectMetamask()}>Connect Metamask</button>;
            case PageState.Connected:
                return buttons;
            case PageState.Claimed:
                return <p className="gold">Bounty claimed !</p>;
            case PageState.NotMined:
                return <p className="error">ERROR: Transaction was not added to the blockchain.</p>;
            case PageState.Error:
                return <p className="error">ERROR: Failed to receive transaction response.</p>;
            case PageState.Canceled:
                return <>
                    <p className="error">ERROR: Transaction canceled</p>
                    {buttons}
                </>;
            case PageState.Troll:
                return <>
                    <p>I think you're not the organizer...</p>
                    <video src={"/troll.mp4"} style={{height: "20vh"}} autoPlay={true}></video>
                </>;
            case PageState.Funded:
                return <p className="gold">Goal funded !</p>
            case PageState.Pending:
                return <p>Sending transaction, please wait...</p>
        }
    }

    #getGoalButtons() {
        return this.#data.map((x, i)=>
            <button key={`goal:${i}`} onClick={()=>this.#fundGoal(x)}>Fund goal {i}</button>
        );
    }

    #connectMetamask() {
        this.#provider!.getSigner().then((x)=>{
            this.#setter!(new Renderer({
                provider: this.#provider, 
                signer: x, 
                stateSetter: this.#stateSetter, 
                setter: this.#setter, 
                data: this.#data
            }));
            this.#stateSetter(PageState.Connected);
        });
    }

    #claim() {
        const tx: TransactionRequest = {
            chainId: CHAIN_ID,
            from: this.#signer!.address,
            to: BANK_ADDRESS,
            value: 0,
            data: WITHDRAW
        };

        this.#signer!.sendTransaction(tx).then((res)=>{
            res.wait().then((receipt)=>{
                if (receipt == null) { this.#stateSetter(PageState.Error); }
                else if (receipt.blockNumber == null) { this.#stateSetter(PageState.NotMined); }
                else { this.#stateSetter(PageState.Claimed); }
            });
            this.#stateSetter(PageState.Pending);
        }).catch((err)=>{
            if (err.code !== undefined && err.code !== "ACTION_REJECTED") {
                this.#stateSetter(PageState.Troll)
            } else {
                console.log(err.code);
                console.log(err);
                this.#stateSetter(PageState.Canceled);
            }
        });
    }

    #fundGoal(goal: Goal) {
        const tx: TransactionRequest = {
            chainId: CHAIN_ID,
            from: this.#signer!.address,
            to: goal.address,
            value: goal.value,
        };

        this.#signer!.sendTransaction(tx).then((res)=>{
            res.wait().then((receipt)=>{
                if (receipt == null) { this.#stateSetter(PageState.Error); }
                else if (receipt.blockNumber == null) { this.#stateSetter(PageState.NotMined); }
                else { this.#stateSetter(PageState.Funded); }
            });
            this.#stateSetter(PageState.Pending);
        }).catch(()=>this.#stateSetter(PageState.Canceled));
    }
}

export function initRenderer(stateSetter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new Renderer({stateSetter, data});
} 