import { Goal, send_transaction, Setter, SHARED_STATES, TransactionParams, tx_box, unwrap_or } from "../util-public";
import Renderer from "../renderer";
import { PageState } from "./util";
import "./style.css"; import "../globals.css";
import GoalForm from "./form";
import { ErrorCodes, VrfyRequest } from "../api/public";
import { Interface } from "ethers";
import { TransactionResponse } from "ethers";

interface Args {
    state_setter: Setter<PageState>,
    data: Readonly<Goal[]>,
    err_block_id: number | null,
    goal_address: string | null,
} 
const CLAIM = new Interface(["function claim(uint256 nonce)"]);
const WIN = new Interface(["event GoalClaimed(address goal, address winner)"]);
const FUNDS_FAILED = new Interface(["event SendFundsFail(address goal, address winner)"]);
const PROCEED = <p>You can now proceed to the next level !</p>;
const CONTACT_ADMIN = <p>Please contact the administrator.</p>;

const txErrors = {
    cancelled: "rejected",
    wrong: "Wrong",
    invalid_level: "Invalid level",
    unauthorized: "Unauthorized",
};

class GoalRenderer extends Renderer<PageState, Args> {
    #data: Readonly<Goal[]>;
    #err_block_id: number | null;
    #goal_address: string | null;

    constructor(args: Args) {
        super(args.state_setter); this.#data = args.data; 
        this.#err_block_id = args.err_block_id; this.#goal_address = args.goal_address;
    } protected args(): Args {
        return {
            state_setter: this.state_setter, data: this.#data, 
            err_block_id: this.#err_block_id, goal_address: this.#goal_address
        };
    } protected get connected_state(): PageState {
        return PageState.Connected;
    } protected fallback(): void {
        this.state_setter(PageState.InternalError);
    } 
    
    #with_goal_address(addr: string) {
        if (!this.provider || !this.self_setter || !this.signer) {
            return this.state_setter(PageState.InternalError);
        }

        const r = this.with_signer(this.signer);
        r.#goal_address = addr;
        this.self_setter(r);
    }
    #set_error(id: number | null, state: PageState) {
        if (!this.provider || !this.self_setter || !this.signer) {
            return this.state_setter(PageState.InternalError);
        }

        const r = this.with_signer(this.signer);
        r.#err_block_id = id;
        this.self_setter(r); this.state_setter(state);
    }
    get claim_form() {
        return <GoalForm len={this.#data.length} handler={(data: FormData)=>this.#form_handler(data)}></GoalForm>
    } 

    render(state: PageState): React.JSX.Element {
        switch (state) {
            case PageState.Default:
                return SHARED_STATES.noMetaMask;
            case PageState.Pending:
                return <>
                    <p>To proceed, please connect to Metamask.</p>
                    <button onClick={()=>this.connect_metamask()}>Connect Metamask</button>
                </>;
            case PageState.Connected:
                return this.claim_form;
            case PageState.InternalError:
                return SHARED_STATES.internal;
            case PageState.Processing:
                return <p>Verifying your answer...</p>;
            case PageState.Retry:
                return <>
                    <p className="error">Failed to parse your key value, please ensure you provided a 20-digit number.</p>
                    <button className="more-margin" onClick={()=>this.state_setter(PageState.Connected)}>Retry</button>
                </>;
            case PageState.Wrong:
                return <>
                    <p>Your answer is wrong.</p>
                    <p>You might want to check your awswer or ensure it is for the correct goal.</p>
                    <p>Don't give up, We're sure you're very close !</p>
                </>;
            case PageState.Cancelled:
                return SHARED_STATES.cancelled;
            case PageState.NotMined:
                return SHARED_STATES.notMined;
            case PageState.ParseFailed:
                return this.#err_block_id == null 
                    ? <p className="error">Failed to find the transaction on the blockchain, please contact the administrator.</p>
                    : <p className="error">Failed to parse logs of the transaction. It was recorded on block {this.#err_block_id}</p>;
            case PageState.Sending:
                return <>
                    <p>Claiming <span className="rainbow">Hunt Goal</span>, please stand by.</p>
                    {tx_box(
                        this.signer!.address,
                        unwrap_or("Internal error", this.#goal_address),
                        0
                    )}
                </>;
            case PageState.Ok:
                return <>
                    <p><span className="rainbow">Hunt Goal</span> claimed, but you didn't win the prize :(</p>
                    {PROCEED}
                </>;
            case PageState.Win:
                return <>
                    <p className="gold">Congratulations, you won the prize !!</p>
                    {PROCEED}
                </>;
            case PageState.InvalidLevel:
                return <p className="error">You can't claim this goal now. Make sure you're claiming goals in order.</p>;
            case PageState.ErrParseFailed:
                return <p className="error">Can't send the transaction, but failed to parse the error.</p>;
            case PageState.MissingFunds:
                return <>
                    <p className="error">Goal claimed but we failed to send you the funds.</p>
                    {CONTACT_ADMIN}
                    <p>You still unlocked access to the next level</p>
                </>;
            case PageState.Unexpected:
                return <>
                    <p className="error">An unexpected error occured during the transaction.</p>
                    {CONTACT_ADMIN}
                </>;
        }
    }

    #form_handler(data: FormData) {
        this.state_setter(PageState.Processing);
        const nonce  = data.get("nonce"); const goal = data.get("goal");
        if (!nonce || !goal) { return this.state_setter(PageState.Retry); }
        
        const body: VrfyRequest = {
            nonce: nonce.toString(),
            goalId: goal.toString()
        };
        fetch("api/vrfy-goal", {
            method: "POST",
            body: JSON.stringify(body)
        }).then((res)=>{
            if (res.status == 200) {
                const address = this.#data[Number.parseInt(goal.toString())].address; // id validated by query
                const n = Number.parseInt(nonce.toString()); // also validated
                const tx: TransactionParams = {
                    signer: this.signer!,
                    to: address,
                    data: CLAIM.encodeFunctionData("claim", [n])
                };
                
                this.#with_goal_address(address);
                this.state_setter(PageState.Sending);
                send_transaction(
                    tx, 
                    (res: TransactionResponse)=>this.#success_handler(res), 
                    (err)=>this.#error_handler(err)
                );
            } else {
                res.json().then((body)=>{
                    if (body.code === undefined) {
                        return this.state_setter(PageState.InternalError);
                    }

                    switch(body.code) {
                        case ErrorCodes.UndefinedParams:
                        case ErrorCodes.InvalidId:
                            return this.state_setter(PageState.InternalError);
                        case ErrorCodes.InvalidParams:
                            return this.state_setter(PageState.Retry);
                        case ErrorCodes.Wrong:
                            return this.state_setter(PageState.Wrong);
                        default:
                            return this.state_setter(PageState.Unexpected);
                    }
                });
            }
        })
    }
    #success_handler(res: TransactionResponse) {
        res.wait().then((receipt)=>{
            if (!receipt) {
                return this.state_setter(PageState.NotMined);
            }

            if (receipt.logs.length === 0) {
                return this.state_setter(PageState.Ok);   
            }

            const log = WIN.parseLog(receipt.logs[0]);
            if (!log) {
                const log = FUNDS_FAILED.parseLog(receipt.logs[0]);
                this.#set_error(receipt.blockNumber, log == null ? PageState.ParseFailed : PageState.MissingFunds);
            } else {
                this.state_setter(PageState.Win);
            }
        });
    }
    #error_handler(err: any) {
        if (err === undefined || !err || err.reason === undefined) {
            return this.state_setter(PageState.ErrParseFailed);
        } 

        console.log(err);
        switch(err.reason) {
            case txErrors.cancelled: return this.state_setter(PageState.Cancelled);
            case txErrors.wrong: return this.state_setter(PageState.Wrong);
            case txErrors.invalid_level: return this.state_setter(PageState.InvalidLevel);
            case txErrors.unauthorized: return this.state_setter(PageState.Unexpected);
            default: return this.state_setter(PageState.ErrParseFailed);
        }
    }
}

export function initRenderer(state_setter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new GoalRenderer({state_setter, data, err_block_id: null, goal_address: null});
}