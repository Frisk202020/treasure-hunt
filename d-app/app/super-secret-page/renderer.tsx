import { JsonRpcSigner, BrowserProvider, TransactionRequest, TransactionResponse, Interface } from "ethers";
import { BANK_ADDRESS, CHAIN_ID, Goal, sendTransaction, Setter, SHARED_STATES } from "../util-public";
import { JSX } from "react";
import { PageState } from "./util";
import "../globals.css";

// TODO : may allow multi-goal authorization / funding for less tx fee

const WITHDRAW = new Interface(["function withdraw()"]).encodeFunctionData("withdraw");
const AUTHORIZE_INTERFACE = new Interface(["function authorize_goal(address)"]);

class Renderer {
    #stateSetter: Setter<PageState>;
    #data: Readonly<Goal[]>;
    #provider: BrowserProvider| null;
    #signer: JsonRpcSigner | null;
    #setter: Setter<Renderer> | null;

    constructor(stateSetter: Setter<PageState>, data: Readonly<Goal[]>) {
        this.#stateSetter = stateSetter;  this.#data = data;  this.#provider = null;
        this.#signer = null; this.#setter = null; 
    }
    withProvider(provider: BrowserProvider, setter: Setter<Renderer>) {
        const r = new Renderer(this.#stateSetter, this.#data);
        r.#provider = provider; r.#setter = setter;
        console.log("hi");
        return r;
    }
    #connectMetamask() {
        if (!this.#provider || !this.#setter) {
            this.#stateSetter(PageState.InternalError);
            return;
        }

        this.#provider!.getSigner().then((x)=>{
            const r = this.withProvider(this.#provider!, this.#setter!);
            r.#signer = x;
            this.#setter!(r);
            this.#stateSetter(PageState.Connected);
        });
    }
    get #trollHandler() {
        return (err: any)=>{
            if (err.code !== undefined && err.code !== "ACTION_REJECTED") {
                this.#stateSetter(PageState.Troll)
            } else {
                this.#stateSetter(PageState.Canceled);
            }
        };
    }

    render(state: PageState): JSX.Element {
        const elements = <>
            <button className="more-margin" onClick={()=>this.#claim()}>Claim funds</button>

            <p className="more-margin">Additionally you can fund goals here, if you didn't already.</p>
            <div className="goals" style={{display: "flex", justifyContent: "space-evenly"}}>
                {this.#getGoalButtons()}
            </div>
            <p className="more-margin">Oh, and you can also authorize a new <span className="rainbow">Hunt Goal</span>.</p>
            <form>
                <input placeholder="Goal address (0x...)" type="text" name="address"></input>
                <input type="submit" formAction={(formData)=>{
                    const address = formData.get("address");
                    if (!address) { this.#stateSetter(PageState.InvalidForm); return; }
                    
                    const tx: TransactionRequest = {
                        chainId: CHAIN_ID,
                        from: this.#signer!.address,
                        to: BANK_ADDRESS,
                        value: 0,
                        data: AUTHORIZE_INTERFACE.encodeFunctionData("authorize_goal", [address])
                    };
                    const successHandler = (res: TransactionResponse)=>{
                        res.wait().then((receipt)=>{
                            if (receipt == null) { this.#stateSetter(PageState.Error); }
                            else if (receipt.blockNumber == null) { this.#stateSetter(PageState.NotMined); }
                            else { this.#stateSetter(PageState.Authorized); }
                        });
                        this.#stateSetter(PageState.Pending);
                    };
                    sendTransaction(this.#signer!, tx, successHandler, this.#trollHandler);
                }}></input>
            </form>
        </>;

        switch (state) {
            case PageState.NoMetamask:
                return SHARED_STATES.noMetaMask;
            case PageState.MetaMaskDetected:
                return <button className="more-margin" onClick={()=>this.#connectMetamask()}>Connect Metamask</button>;
            case PageState.Connected:
                return elements;
            case PageState.Claimed:
                return <p className="gold">Bounty claimed !</p>;
            case PageState.NotMined:
                return SHARED_STATES.notMined;
            case PageState.Error:
                return SHARED_STATES.noResponse;
            case PageState.Canceled:
                return <>
                    {SHARED_STATES.cancelled}
                    {elements}
                </>;
            case PageState.Troll:
                return <>
                    <p>I think you're not the organizer...</p>
                    <video src={"/troll.mp4"} style={{height: "20vh"}} autoPlay={true}></video>
                </>;
            case PageState.Funded:
                return <p className="gold">Goal funded !</p>
            case PageState.Pending:
                return SHARED_STATES.pending;
            case PageState.InvalidForm:
                return <>
                    <p className="error">ERROR: Invalid goal information</p>
                    <button onClick={()=>this.#stateSetter(PageState.Connected)}>Retry</button>
                </>;
            case PageState.Authorized:
                return <>
                    <p className="gold">Goal authorized successfully !</p>
                </>;
            case PageState.InternalError:
                return SHARED_STATES.internal;
        }
    }

    #getGoalButtons() {
        return this.#data.map((x, i)=>
            <button key={`goal:${i}`} onClick={()=>this.#fundGoal(x)}>Fund goal {i+1}</button>
        );
    }

    #claim() {
        const tx: TransactionRequest = {
            chainId: CHAIN_ID,
            from: this.#signer!.address,
            to: BANK_ADDRESS,
            value: 0,
            data: WITHDRAW
        };
        const successHandler = (res: TransactionResponse)=>{
            res.wait().then((receipt)=>{
                if (receipt == null) { this.#stateSetter(PageState.Error); }
                else if (receipt.blockNumber == null) { this.#stateSetter(PageState.NotMined); }
                else { this.#stateSetter(PageState.Claimed); }
            });
            this.#stateSetter(PageState.Pending);
        };
        sendTransaction(this.#signer!, tx, successHandler, this.#trollHandler);
    }

    #fundGoal(goal: Goal) {
        const tx: TransactionRequest = {
            chainId: CHAIN_ID,
            from: this.#signer!.address,
            to: goal.address,
            value: goal.value,
        };
        const successHandler = (res: TransactionResponse)=>{
            res.wait().then((receipt)=>{
                if (receipt == null) { this.#stateSetter(PageState.Error); }
                else if (receipt.blockNumber == null) { this.#stateSetter(PageState.NotMined); }
                else { this.#stateSetter(PageState.Funded); }
            });
            this.#stateSetter(PageState.Pending);
        };
        const errorHandler = ()=>this.#stateSetter(PageState.Canceled);
        sendTransaction(this.#signer!, tx, successHandler, errorHandler);
    }
}

export function initRenderer(stateSetter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new Renderer(stateSetter, data);
} 