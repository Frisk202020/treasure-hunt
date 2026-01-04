import { JsonRpcSigner, BrowserProvider, Interface } from "ethers";
import { PageState } from "./util";
import "./join.css";
import { TransactionRequest } from "ethers";
import { MutateResult, Setter } from "../util-public";
import { tryAddTicket } from "../actions";

const BANK_ADDRESS = "0xcdED3821113e9af36eb295B7b37807CfAe5AbdF9";
const TICKET_CLAIM = new Interface(["event TicketCreated(address user)"]);
const UNSUFFICIENT_FUNDS = new Interface(["event UnsufficientFunds(address user, uint value)"]);

interface Constructor {
    provider?: BrowserProvider,
    signer?: JsonRpcSigner,
    stateSetter: Setter<PageState>,
    setter?: Setter<Renderer>,
    registeredAddresses: Set<string>
}
class Renderer {
    #provider?: BrowserProvider;
    #signer?: JsonRpcSigner;
    #setter?: Setter<Renderer>;
    #stateSetter: Setter<PageState>;
    #registeredAddresses: Set<string>;

    constructor(args: Constructor) {
        this.#provider = args.provider; this.#signer = args.signer; this.#setter = args.setter;
        this.#stateSetter = args.stateSetter; this.#registeredAddresses = args.registeredAddresses;
    }

    withProvider(provider: BrowserProvider, setter: Setter<Renderer>) {
        return new Renderer({provider, setter, stateSetter: this.#stateSetter, registeredAddresses: this.#registeredAddresses});
    }
    render(state: PageState) {
        switch (state) {
            case PageState.NoMetaMask:
                return <p>Please add Metamask extension to your browser to proceed</p>;
            case PageState.Default:
                return <>
                    <p>Firstly, please connect your MetaMask wallet. Then you'll be able to claim a ticket.</p>
                    <div className="btn-box">
                        <button 
                            onClick={()=>this.#connectMetamask()} 
                            className={this.#signer == null ? "enabled" : "disabled"}
                        > Connect to Metamask</button>
                        <button 
                            className={this.#signer == null ? "disabled" : "enabled"}
                            onClick={()=>this.#claimTicket()}
                        >Claim ticket</button>
                    </div>
                </>;
            case PageState.TicketClaimPending:
                return <>
                    <p>Claiming ticket for address {this.#signer!.address}...</p>
                    <div>
                        <p>Transaction details</p>
                        <p>Sender: {this.#signer!.address}</p>
                        <p>Target: {BANK_ADDRESS}</p>
                        <p>Value: 10 wei</p>
                    </div>
                </>;
            case PageState.TicketClaimed:
                return <p>Ticket claimed successfully ! Good luck !</p>;
            case PageState.DuplicateClaim:
                return <p>You already claimed a ticket ! You can now begin the hunt.</p>;
            case PageState.TryAgainPending:
                return <>
                    <p>Failed to update the database. Please wait a few seconds and try again.</p>
                    <p>If it persists, please contact the administrator</p>
                </>;
            case PageState.TryAgain:
                return <>
                    <p>Failed to update the database. Please wait a few seconds and try again.</p>
                    <p>If it persists, please contact the administrator</p>
                </>;
            case PageState.NotMined:
                return <p>Transaction wasn't added to the blockchain. Please contact the administrator.</p>;
            case PageState.ParseLogFailed:
                return <p>Failed to find the transaction on the blockchain. Please contact the administrator</p>;
            case PageState.Fatal:
                return <p>An unexpected error occured. Please contact the administrator.</p>;
        };
    } 

    #connectMetamask() {
        this.#provider?.getSigner().then((x)=>this.#setter!(new Renderer({
            provider: this.#provider, signer: x, stateSetter: this.#stateSetter, setter: this.#setter, registeredAddresses: this.#registeredAddresses
        })));
    }
    #claimTicket() {
        if (this.#registeredAddresses.has(this.#signer!.address)) {
            this.#stateSetter(PageState.DuplicateClaim);
            return;
        }

        const tx: TransactionRequest = {
            chainId: 11155111,
            from: this.#signer!.address,
            to: BANK_ADDRESS,
            value: 10
        };

        this.#signer!.sendTransaction(tx).then((res)=>{
            res.wait().then((receipt)=>{
                if (receipt == null) {
                    this.#stateSetter(PageState.NotMined);
                    return;
                }

                for (const x of receipt.logs) {
                    const ticketClaim = TICKET_CLAIM.parseLog(x);
                    if (ticketClaim != null) {
                        tryAddTicket(this.#signer!.address).then((x)=>{
                            switch (x) {
                                case MutateResult.Ok: this.#stateSetter(PageState.TicketClaimed); return;
                                case MutateResult.Busy: this.#stateSetter(PageState.TryAgainPending); return;
                                case MutateResult.Unknown: this.#stateSetter(PageState.Fatal); return;
                            }
                        });
                        return;
                    }

                    const unsufficientFunds = UNSUFFICIENT_FUNDS.parseLog(x);
                    if (unsufficientFunds != null) {
                        //! TODO
                        return;
                    }

                    this.#stateSetter(PageState.ParseLogFailed);
                }
             
            });
        });
        this.#stateSetter(PageState.TicketClaimPending);
    }
}

export default function initRenderer(stateSetter: Setter<PageState>, registeredAddresses: Set<string>) {
    return new Renderer({stateSetter, registeredAddresses});
}

