import { TransactionResponse, Interface } from "ethers";
import { BANK_ADDRESS, Goal, send_transaction, Setter, SHARED_STATES, TransactionParams } from "../util-public";
import { JSX } from "react";
import { PageState } from "./util";
import "../globals.css";
import Renderer from "../renderer";

// TODO : may allow multi-goal authorization / funding for less tx fee

const WITHDRAW = new Interface(["function withdraw()"]).encodeFunctionData("withdraw");
const AUTHORIZE_INTERFACE = new Interface(["function authorize_goal(address)"]);
interface Args {
    state_setter: Setter<PageState>,
    data: Readonly<Goal[]>;
}
const txErrors = {
    cancelled: "rejected",
    forbidden: "Forbidden",
}

class SecretRenderer extends Renderer<PageState, Args> {
    #data: Readonly<Goal[]>;

    constructor(args: Args) {
        super(args.state_setter); this.#data = args.data;
    } protected args() {
        return {state_setter: this.state_setter, data: this.#data};
    } protected get connected_state(): PageState {
        return PageState.Connected;
    } protected fallback(): void {
        this.state_setter(PageState.InternalError);
    } get #trollHandler() {
        return (err: any)=>{
            if (err.code !== undefined && err.code !== "ACTION_REJECTED") {
                this.state_setter(PageState.Troll)
            } else {
                this.state_setter(PageState.Canceled);
            }
        };
    } get #goal_buttons() {
        return this.#data.map((x, i)=>
            <button key={`goal:${i}`} onClick={()=>this.#fund_goal(x)}>Fund goal {i+1}</button>
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
            <form>
                <input placeholder="Goal address (0x...)" type="text" name="address"></input>
                <input type="submit" formAction={(formData)=>{
                    const address = formData.get("address");
                    if (!address) { this.state_setter(PageState.InvalidForm); return; }
                    
                    const tx: TransactionParams = {
                        signer: this.signer!,
                        to: BANK_ADDRESS,
                        data: AUTHORIZE_INTERFACE.encodeFunctionData("authorize_goal", [address])
                    };
                    const success_handler = (res: TransactionResponse)=>this.#success_handler(res, PageState.Authorized);
                    send_transaction(tx, success_handler, this.#trollHandler);
                }}></input>
            </form>
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
            case PageState.InvalidForm:
                return <>
                    <p className="error">ERROR: Invalid goal information</p>
                    <button onClick={()=>this.state_setter(PageState.Connected)}>Retry</button>
                </>;
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
            to: BANK_ADDRESS,
            data: WITHDRAW
        };
        const successHandler = (res: TransactionResponse)=>this.#success_handler(res, PageState.Claimed);
        send_transaction(tx, successHandler, this.#trollHandler);
    }
    #fund_goal(goal: Goal) {
        const tx: TransactionParams = {
            signer: this.signer!,
            to: goal.address,
            value: goal.value,
        };
        const successHandler = (res: TransactionResponse)=>{
            res.wait().then((receipt)=>{
                if (receipt == null) { this.state_setter(PageState.Error); }
                else if (receipt.blockNumber == null) { this.state_setter(PageState.NotMined); }
                else { this.state_setter(PageState.Funded); }
            });
            this.state_setter(PageState.Pending);
        };
        send_transaction(tx, successHandler, (err)=>this.#errorHandler(err));
    }
    #success_handler(res: TransactionResponse, success_state: PageState) {
        res.wait().then((receipt)=>{
            if (receipt == null) { this.state_setter(PageState.Error); }
            else if (receipt.blockNumber == null) { this.state_setter(PageState.NotMined); }
            else { this.state_setter(success_state); }
        });
        this.state_setter(PageState.Pending);
    }
    #errorHandler(err: any) {
        if (err === undefined || !err || err.reason === undefined) {
            return this.state_setter(PageState.Error);
        }

        switch(err.reason) {
            case txErrors.cancelled:
                return this.state_setter(PageState.Canceled);
            case txErrors.forbidden:
                return this.state_setter(PageState.Troll);
            default:
                return this.state_setter(PageState.ErrorParseFailed)
        }
    }
}

export function initRenderer(state_setter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new SecretRenderer({state_setter, data});
} 