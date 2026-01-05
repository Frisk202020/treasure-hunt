import { JsonRpcSigner, BrowserProvider, Interface } from "ethers";
import { PageState } from "./util";
import { TransactionRequest } from "ethers";
import { MutateResult, Setter } from "../util-public";
import { tryAddTicket } from "../actions";
import "./join.css";
import "../globals.css";

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
            case PageState.Default:
                return <>
                    <p>To join the hunt, you'll need a <span className="rainbow">Hunt ticket</span>.</p>
                    <p>The hunt has an entry fee of <span className="gold">10</span>  Wei.</p>
                </>;
            case PageState.NoMetaMask:
                return <>
                    <p>To join the hunt, you'll need a <span className="rainbow">Hunt ticket</span>.</p>
                    <p>The hunt has an entry fee of <span className="gold">10</span>  Wei.</p>
                    <p className="error">Please add Metamask extension to your browser to proceed</p>
                </>;
            case PageState.MetaMaskPending:
                return <>
                    <p>To join the hunt, you'll need a <span className="rainbow">Hunt ticket</span>.</p>
                    <p>The hunt has an entry fee of <span className="gold">10</span>  Wei.</p>
                    <p className="more-margin">Firstly, please connect your MetaMask wallet. Then you'll be able to claim a ticket.</p>
                    <button onClick={()=>this.#connectMetamask()}> Connect to Metamask</button>
                </>;
            case PageState.MetaMaskConnected:
                return <>
                    <p style={{textAlign: "center"}}>Great, MetaMask is connected !</p>
                    <p>Now you can claim a ticket, the following action will launch a transaction of <span>10</span> Wei to the organizer.</p>
                    <button onClick={()=>this.#claimTicket()}>Claim a ticket</button>
                </>;
            case PageState.Canceled:
                return <>
                    <p className="error">Transaction canceled, please try again.</p>
                    <button onClick={()=>this.#claimTicket()}>Claim a ticket</button>
                </>
            case PageState.TicketClaimPending:
                return <>
                    <p>Claiming ticket for address <span className="gold">{this.#signer!.address}</span>...</p>
                    <div className="tx">
                        <p style={{textAlign: "center"}}>Transaction details</p>
                        <p>Sender: {this.#signer!.address}</p>
                        <p>Target: {BANK_ADDRESS}</p>
                        <p>Value: 10 wei</p>
                    </div>
                </>;
            case PageState.TicketClaimed:
                return <p>Ticket claimed successfully ! Good luck !</p>;
            case PageState.DuplicateClaim:
                return <p>You already claimed a ticket ! You can now begin the hunt.</p>;
            // TODO - Finish rendering of error cases
            case PageState.TryAgainPending:
                return <>
                    <p className="error">Failed to update the database. Please wait a few seconds and try again.</p>
                    <p>If it persists, please contact the administrator</p>
                </>;
            case PageState.TryAgain:
                return <>
                    <p className="error">Failed to update the database. Please wait a few seconds and try again.</p>
                    <p>If it persists, please contact the administrator</p>
                </>;
            case PageState.NotMined:
                return <p className="error">Transaction wasn't added to the blockchain. Please contact the administrator.</p>;
            case PageState.ParseLogFailed:
                return <p className="error">Failed to find the transaction on the blockchain. Please contact the administrator</p>;
            case PageState.Fatal:
                return <p className="error">An unexpected error occured. Please contact the administrator.</p>;
        };
    } 

    #connectMetamask() {
        this.#provider?.getSigner().then((x)=>{
            this.#setter!(new Renderer({
                provider: this.#provider, 
                signer: x, 
                stateSetter: this.#stateSetter, 
                setter: this.#setter, 
                registeredAddresses: this.#registeredAddresses
            }));
            this.#stateSetter(PageState.MetaMaskConnected);
        });
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
            this.#stateSetter(PageState.TicketClaimPending);
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
                        // TODO - Implement behaviour for this log type and other unhandled logs
                        return;
                    }

                    this.#stateSetter(PageState.ParseLogFailed);
                }
             
            });
        }).catch(()=>this.#stateSetter(PageState.Canceled));
    }
}

export default function initRenderer(stateSetter: Setter<PageState>, registeredAddresses: Set<string>) {
    return new Renderer({stateSetter, registeredAddresses});
}

