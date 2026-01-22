import { Interface, TransactionRequest, TransactionResponse } from "ethers";
import { PageState } from "./util";
import { BANK_ADDRESS, CHAIN_ID, send_transaction, Setter, SHARED_STATES } from "../util-public";
import { JSX } from "react";
import "../globals.css";
import Renderer from "../renderer";

const TICKET_CLAIM = new Interface(["event TicketCreated(address user)"]);
const UNSUFFICIENT_FUNDS = new Interface(["event UnsufficientFunds(address user, uint value)"]);
const DUPLICATE = new Interface(["event AlreadyClaimed(address user, uint level)"]);

class JoinRenderer extends Renderer<PageState> {
    #fatal_block_id: number | null;

    constructor(state_setter: Setter<PageState>) {
        super(state_setter);
        this.#fatal_block_id = null;
    }
    protected get connected_state() {
        return PageState.MetaMaskConnected;
    } protected args() {
        return this.state_setter;
    } protected fallback(): void {
        this.state_setter(PageState.InternalError);
    }
    #set_fatal_error(block: number | null) {
        if (!this.provider || !this.self_setter || !this.signer){
            this.state_setter(PageState.InternalError);
            return;
        }
        const r = this.with_signer(this.signer);
        r.#fatal_block_id = block;

        this.self_setter(r);
        this.state_setter(PageState.Fatal);
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
                    <button onClick={()=>this.connect_metamask()}> Connect to Metamask</button>
                </>;
            case PageState.MetaMaskConnected:
                return <>
                    <p style={{textAlign: "center"}}>Great, MetaMask is connected !</p>
                    <p>Now you can claim a ticket, the following action will launch a transaction of <span>10</span> Wei to the organizer.</p>
                    <button onClick={()=>this.#claim_ticket()}>Claim a ticket</button>
                </>;
            case PageState.Canceled:
                return <>
                    {SHARED_STATES.cancelled}
                    <button onClick={()=>this.#claim_ticket()}>Claim a ticket</button>
                </>
            case PageState.TicketClaimPending:
                return <>
                    <p>Claiming ticket for address <span className="gold">{this.signer!.address}</span>...</p>
                    <div className="box">
                        <p style={{textAlign: "center"}}>Transaction details</p>
                        <p>Sender: {this.signer!.address}</p>
                        <p>Target: {BANK_ADDRESS}</p>
                        <p>Value: 10 wei</p>
                    </div>
                </>;
            case PageState.TicketClaimed:
                return <p>Ticket claimed successfully ! Good luck !</p>;
            case PageState.DuplicateClaim:
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
                const error = this.#fatal_block_id == null 
                        ? <p className="error">An unexpected error occured, and transaction wasn't on the blockchain.</p>
                        : <p className="error">An unexpected error occured. Transaction was recorded on the blockchain at block {this.#fatal_block_id}</p>;
                return <>
                    {error}
                    <p>Please save this info and contact the administrator.</p>
                </>;
            case PageState.InternalError:
                return SHARED_STATES.internal;
        };
    }

    #claim_ticket() {
        if (!this.signer) {
            this.state_setter(PageState.InternalError); return;
        }

        const tx: TransactionRequest = {
            chainId: CHAIN_ID,
            from: this.signer!.address,
            to: BANK_ADDRESS,
            value: 10
        };
        const successHandler = (res: TransactionResponse)=>{
            this.state_setter(PageState.TicketClaimPending);
            res.wait().then((receipt)=>{
                if (receipt == null) {
                    this.state_setter(PageState.NotMined);
                    return;
                }

                if (receipt.logs.length === 0) {
                    this.#set_fatal_error(receipt.blockNumber)
                    return;
                }

                const ticketClaim = TICKET_CLAIM.parseLog(receipt.logs[0]);
                if (ticketClaim != null) {
                    this.state_setter(PageState.TicketClaimed);
                    return;
                }

                const dup = DUPLICATE.parseLog(receipt.logs[0]);
                if (dup != null) {
                    if (receipt.logs.length < 2) {
                        this.state_setter(PageState.DuplicateClaim);
                    }

                    this.#set_fatal_error(receipt.blockNumber);
                    return;
                }

                const unsufficientFunds = UNSUFFICIENT_FUNDS.parseLog(receipt.logs[0]);
                if (unsufficientFunds != null) {
                    if (receipt.logs.length < 2) {
                        return PageState.UnsufficientFunds;
                    }

                    this.#set_fatal_error(receipt.blockNumber);
                    return;
                }

                this.state_setter(PageState.ParseLogFailed);
            });
        };
        const error_handler = ()=>this.state_setter(PageState.Canceled)
        send_transaction(this.signer, tx, successHandler, error_handler);
    }
}

export default function initRenderer(stateSetter: Setter<PageState>) {
    return new JoinRenderer(stateSetter);
}