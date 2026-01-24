import { Goal, Setter, SHARED_STATES } from "../util-public";
import Renderer from "../renderer";
import { PageState } from "./util";
import "./style.css";
import GoalForm from "./form";

interface Args {
    state_setter: Setter<PageState>,
    data: Readonly<Goal[]>
}
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
        return <GoalForm len={this.#data.length}></GoalForm>
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
        }
    }
}

export function initRenderer(state_setter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new GoalRenderer({state_setter, data});
}