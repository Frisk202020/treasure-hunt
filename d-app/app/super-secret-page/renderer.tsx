import { TransactionResponse, Interface } from "ethers";
import { Goal, send_transaction, Setter, SHARED_STATES, TransactionParams } from "../util-public";
import { JSX } from "react";
import { PageState } from "./util";
import "../globals.css";
import Renderer from "../renderer";

const WITHDRAW = new Interface(["function withdraw()"]).encodeFunctionData("withdraw");
const AUTHORIZE_INTERFACE = new Interface(["function authorize_goal(address)"]);
interface Args {
    state_setter: Setter<PageState>
    bank: string;
    data: Readonly<Goal[]>;
}
const txErrors = {
    cancelled: "rejected",
    forbidden: "Forbidden",
}

class SecretRenderer extends Renderer<PageState, Args> {
    #bank: string;
    #data: Readonly<Goal[]>;

    constructor(args: Args) {
        super(args.state_setter); this.#data = args.data; this.#bank = args.bank;
    } protected args() {
        return {state_setter: this.state_setter, bank: this.#bank, data: this.#data};
    } protected get connected_state(): PageState {
        return PageState.Connected;
    } protected fallback(): void {
        this.state_setter(PageState.InternalError);
    } get #goal_buttons() {
        return this.#data.map((x, i)=>
            <button key={`goal:${i}`} onClick={()=>this.#fund_goal(x)}>Fund goal {i+1}</button>
        );
    } get #authorize_buttons() {
        return this.#data.map((x, i)=>
            <button key={`goal:${i}`} onClick={()=>this.#authorize(x)}>Fund goal {i+1}</button>
        );
    }

    render(state: PageState): JSX.Element {
        const elements = <>
            <button className="more-margin" onClick={()=>this.#claim()}>Claim funds</button>

            <p className="more-margin">Additionally you can fund goals here, if you didn't already.</p>
            <div className="goals" style={{display: "flex", justifyContent: "space-evenly"}}>
                {this.#goal_buttons}
            </div>
            <p className="more-margin">Oh, and you can also authorize a new <span className="rainbow">Hunt Goal</span>.</p>
            <div className="goals" style={{display: "flex", justifyContent: "space-evenly"}}>
                {this.#authorize_buttons}
            </div>
        </>;

        switch (state) {
            case PageState.NoMetamask:
                return SHARED_STATES.noMetaMask;
            case PageState.MetaMaskDetected:
                return <button className="more-margin" onClick={()=>this.connect_metamask()}>Connect Metamask</button>;
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
            case PageState.Authorized:
                return <>
                    <p className="gold">Goal authorized successfully !</p>
                </>;
            case PageState.InternalError:
                return SHARED_STATES.internal;
            case PageState.ErrorParseFailed:
               return <p className="error">Transaction failed, but failed to parse the error.</p>;
        }
    }

    #claim() {
        const tx: TransactionParams = {
            signer: this.signer!,
            to: this.#bank,
            data: WITHDRAW
        };
        send_transaction(
            tx, 
            (res: TransactionResponse)=>this.#success_handler(res, PageState.Claimed), 
            (err)=>this.#error_handler(err)
        );
    }
    #authorize(goal: Goal) {
        const tx: TransactionParams = {
            signer: this.signer!,
            to: goal.address,
            data: AUTHORIZE_INTERFACE.encodeFunctionData("authorize_goal", [goal.address])
        };
        send_transaction(
            tx, 
            (res: TransactionResponse)=>this.#success_handler(res, PageState.Funded), 
            (err)=>this.#error_handler(err)
        );
    }
    #fund_goal(goal: Goal) {
        const tx: TransactionParams = {
            signer: this.signer!,
            to: goal.address,
            value: goal.value,
        };
        send_transaction(
            tx, 
            (res: TransactionResponse)=>this.#success_handler(res, PageState.Funded), 
            (err)=>this.#error_handler(err)
        );
    }
    #success_handler(res: TransactionResponse, success_state: PageState) {
        res.wait().then((receipt)=>{
            if (receipt == null) { this.state_setter(PageState.Error); }
            else if (receipt.blockNumber == null) { this.state_setter(PageState.NotMined); }
            else { this.state_setter(success_state); }
        });
        this.state_setter(PageState.Pending);
    }
    #error_handler(err: any) {
        if (err === undefined || !err || err.reason === undefined) {
            return this.state_setter(PageState.Error);
        }

        switch(err.reason) {
            case txErrors.cancelled:
                return this.state_setter(PageState.Canceled);
            case txErrors.forbidden:
                return this.state_setter(PageState.Troll);
            default:
                return this.state_setter(PageState.ErrorParseFailed);
        }
    }
}

export function initRenderer(state_setter: Setter<PageState>, data: Readonly<Goal[]>, bank: string) {
    return new SecretRenderer({state_setter, data, bank});
} 