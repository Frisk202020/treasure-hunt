import { BrowserProvider, JsonRpcSigner } from "ethers";
import { Setter } from "./util-public";

type Constructor<T, Args> = new (args: Args) => T;

export default abstract class Renderer<PageState, Args=PageState> {
    protected state_setter: Setter<PageState>;
    protected self_setter: Setter<this> | null;
    protected provider: BrowserProvider | null;
    protected signer: JsonRpcSigner | null;

    constructor(state_setter: Setter<PageState>) {
        this.state_setter = state_setter; this.self_setter = null;
        this.provider = null; this.signer = null;
    }
    protected abstract get connected_state(): PageState; 
    protected abstract args(): Args;
    protected abstract fallback(): void;

    with_provider(p: BrowserProvider, s: Setter<this>): this {
        const r = new (
            this.constructor as Constructor<this, Args>
        )(this.args());
        console.log(this.args());
        console.log(r.state_setter);
        r.provider = p; r.self_setter = s;
        return r;
    }
    protected with_signer(x: JsonRpcSigner): this {
        if (!this.provider || !this.self_setter) {
            this.fallback();
            return this;
        }

        const r = this.with_provider(this.provider, this.self_setter);
        r.signer = x;
        return r;
    }
    protected connect_metamask() {
        if (!this.provider || !this.self_setter) {
            this.fallback();
            return;
        }

        this.provider.getSigner().then((x)=>{
            const r = this.with_signer(x);
            this.self_setter!(r);
            this.state_setter(this.connected_state)
        });
    }

    abstract render(state: PageState): React.JSX.Element;
}