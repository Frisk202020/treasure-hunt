import { JsonRpcSigner, BrowserProvider, Interface, TransactionRequest, TransactionResponse } from "ethers";
import { PageState } from "./util";
import { BANK_ADDRESS, CHAIN_ID, sendTransaction, Setter, SHARED_STATES } from "../util-public";
import { JSX } from "react";
import "../globals.css";

// TODO : remove centralization of ticket db (blockchain handles)

const TICKET_CLAIM = new Interface(["event TicketCreated(address user)"]);
const UNSUFFICIENT_FUNDS = new Interface(["event UnsufficientFunds(address user, uint value)"]);
const DUPLICATE = new Interface(["event AlreadyClaimed(address user, uint level)"]);

class Renderer {
    #stateSetter: Setter<PageState>;
    #provider: BrowserProvider | null;
    #signer: JsonRpcSigner | null;
    #setter: Setter<Renderer> | null;
    #fatalErrorBlockId: number | null;

    constructor(stateSetter: Setter<PageState>) {
        this.#stateSetter = stateSetter; this.#provider = null;
        this.#signer = null; this.#setter = null; 
        this.#fatalErrorBlockId = null;
    }
    withProvider(provider: BrowserProvider, setter: Setter<Renderer>) {
        const r = new Renderer(this.#stateSetter);
        r.#provider = provider; r.#setter = setter;
        return r;
    }
    #withSigner(provider: BrowserProvider, setter: Setter<Renderer>, signer: JsonRpcSigner) {
        const r = this.withProvider(provider, setter);
        r.#signer = signer;
        return r;
    }
    #connectMetamask() {
        if (!this.#provider || !this.#setter) {
            this.#stateSetter(PageState.InternalError);
            return;
        }

        this.#provider!.getSigner().then((x)=>{
            const r = this.#withSigner(this.#provider!, this.#setter!, x);
            this.#setter!(r);
            this.#stateSetter(PageState.MetaMaskConnected);
        });
    }
    #setFatalError(block: number | null) {
        if (!this.#provider || !this.#setter || !this.#signer){
            this.#stateSetter(PageState.InternalError);
            return;
        }
        const r = this.#withSigner(this.#provider, this.#setter, this.#signer);
        r.#fatalErrorBlockId = block;

        this.#setter(r);
        this.#stateSetter(PageState.Fatal);
    }

    render(state: PageState): JSX.Element {
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
                    {SHARED_STATES.noMetaMask}
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
                    {SHARED_STATES.cancelled}
                    <button onClick={()=>this.#claimTicket()}>Claim a ticket</button>
                </>
            case PageState.TicketClaimPending:
                return <>
                    <p>Claiming ticket for address <span className="gold">{this.#signer!.address}</span>...</p>
                    <div className="box">
                        <p style={{textAlign: "center"}}>Transaction details</p>
                        <p>Sender: {this.#signer!.address}</p>
                        <p>Target: {BANK_ADDRESS}</p>
                        <p>Value: 10 wei</p>
                    </div>
                </>;
            case PageState.TicketClaimed:
                return <p>Ticket claimed successfully ! Good luck !</p>;
            case PageState.DuplicateClaim:
                console.log("hello??????");
                return <>
                    <p>You already claimed a ticket ! We refunded you successfully.</p>
                    <p>You can proceed to the hunt !</p>
                </>; 
            case PageState.NotMined:
                return SHARED_STATES.notMined;
            case PageState.ParseLogFailed:
                return <p className="error">Failed to find the transaction on the blockchain. Please contact the administrator</p>;
            case PageState.UnsufficientFunds:
                return <>
                    <p className="error">You sent an unsufficient ammount of money.</p>
                    <p>These were refunded to your account, but please contact the administrator.</p>
                </>;
            case PageState.Fatal:
                const error = this.#fatalErrorBlockId == null 
                        ? <p className="error">An unexpected error occured, and transaction wasn't on the blockchain.</p>
                        : <p className="error">An unexpected error occured. Transaction was recorded on the blockchain at block {this.#fatalErrorBlockId}</p>;
                return <>
                    {error}
                    <p>Please save this info and contact the administrator.</p>
                </>;
            case PageState.InternalError:
                return SHARED_STATES.internal;
        };
    } 

    #claimTicket() {
        if (!this.#signer) {
            this.#stateSetter(PageState.InternalError); return;
        }

        const tx: TransactionRequest = {
            chainId: CHAIN_ID,
            from: this.#signer!.address,
            to: BANK_ADDRESS,
            value: 10
        };
        const successHandler = (res: TransactionResponse)=>{
            this.#stateSetter(PageState.TicketClaimPending);
            res.wait().then((receipt)=>{
                if (receipt == null) {
                    this.#stateSetter(PageState.NotMined);
                    return;
                }

                if (receipt.logs.length === 0) {
                    this.#setFatalError(receipt.blockNumber)
                    return;
                }

                const ticketClaim = TICKET_CLAIM.parseLog(receipt.logs[0]);
                if (ticketClaim != null) {
                    this.#stateSetter(PageState.TicketClaimed);
                    return;
                }

                const dup = DUPLICATE.parseLog(receipt.logs[0]);
                if (dup != null) {
                    if (receipt.logs.length < 2) {
                        this.#stateSetter(PageState.DuplicateClaim);
                    }

                    this.#setFatalError(receipt.blockNumber);
                    return;
                }

                const unsufficientFunds = UNSUFFICIENT_FUNDS.parseLog(receipt.logs[0]);
                if (unsufficientFunds != null) {
                    if (receipt.logs.length < 2) {
                        return PageState.UnsufficientFunds;
                    }

                    this.#setFatalError(receipt.blockNumber);
                    return;
                }

                this.#stateSetter(PageState.ParseLogFailed);
            });
        };
        const errorHandler = ()=>this.#stateSetter(PageState.Canceled)
        sendTransaction(this.#signer, tx, successHandler, errorHandler);
    }
}

export default function initRenderer(stateSetter: Setter<PageState>) {
    return new Renderer(stateSetter);
}