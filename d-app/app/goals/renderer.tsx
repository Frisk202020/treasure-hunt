import { Goal, send_transaction, Setter, SHARED_STATES, TransactionParams } from "../util-public";
import Renderer from "../renderer";
import { PageState } from "./util";
import "./style.css";
import GoalForm from "./form";
import { ErrorCodes, VrfyRequest } from "../api/public";
import { Interface } from "ethers";

interface Args {
    state_setter: Setter<PageState>,
    data: Readonly<Goal[]>
} 
const CLAIM = new Interface(["function claim(uint nonce)"]);

class GoalRenderer extends Renderer<PageState, Args> {
    #data: Readonly<Goal[]>;

    constructor(args: Args) {
        super(args.state_setter); this.#data = args.data;
    } protected args(): Args {
        return {state_setter: this.state_setter, data: this.#data};
    } protected get connected_state(): PageState {
        return PageState.Connected;
    } protected fallback(): void {
        this.state_setter(PageState.InternalError);
    } get claim_form() {
        return <GoalForm len={this.#data.length} handler={(data: FormData)=>this.#form_handler(data)}></GoalForm>
    }

    render(state: PageState): React.JSX.Element {
        switch (state) {
            case PageState.Default:
                return SHARED_STATES.noMetaMask;
            case PageState.Pending:
                return <>
                    <p>To proceed, please connect to Metamask.</p>
                    <button onClick={()=>this.connect_metamask()}></button>
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

                const success_handler = ()=>{
                    // TODO
                }; const error_handler = ()=>{
                    // TODO
                }; send_transaction(tx, success_handler, error_handler);
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
                            return this.state_setter(PageState.InternalError);
                    }
                });
            }
        })
    }
}

export function initRenderer(state_setter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new GoalRenderer({state_setter, data});
}