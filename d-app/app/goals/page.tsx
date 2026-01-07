"use client"

// TODO - Test Page states (states fr address input are tested)

import "../globals.css";
import { JSX, useState } from "react";
import { Setter } from "../util-public";

interface Info {
    address: string,
    goalAddress: string,
    value: number,
    level: number
}
export default function Goals() {
    const [state, setState] = useState(PageState.Default);
    const [info, setInfo] = useState<Info>();

    return <>
        <h1 className="rainbow">Claim Hunt Goals !</h1>

        <div id="main">
            {render(state, setState, setInfo, info)}
        </div>
    </>
}

function render(state: PageState, setter: Setter<PageState>, infoSetter: Setter<Info | undefined>, info?: Info): JSX.Element {
    switch(state) {
        case PageState.Default:
            return <>
                <p>Please input your wallet address.</p>
                <p>We'll find your <span className="rainbow">Hunt data</span>.</p>
                <form action={(formData)=>{
                    const addressVal = formData.get("address");
                    if (!addressVal) { setter(PageState.InvalidQuery); return; }

                    const address = addressVal.toString();
                    fetch(`/api/get-goal?address=${address}`).then((res)=>{
                        res.json().then((body)=>{
                            if (res.ok) {
                                if (body.address !== undefined && body.value !== undefined && body.level !== undefined ) {
                                    infoSetter({address, goalAddress: body.address, level: body.level, value: body.value});
                                    setter(PageState.Loaded);
                                } else {
                                    setter(PageState.SuccessParseFail);
                                }
                            } else {
                                switch(body.code) {
                                    case 0: setter(PageState.Missing); return;
                                    case 1: setter(PageState.NotFound); return;
                                    case 2: setter(PageState.Corrupted); return;
                                    default: setter(PageState.ErrorParseFail); return;
                                }
                            }
                        });
                    });
                }}>
                    <input type="text" placeholder="Wallet Address" name="address"></input>
                    <input type="submit" value="Submit"></input>
                </form>
            </>
        case PageState.Loaded:
            return <>
                <p>Current Goal info</p>
                <div className="box">
                    <p>Address: {info!.goalAddress}</p>
                    <p>Cashprize: <span className="gold">{info!.value}</span> Wei</p>
                </div>

                <p className="more-margin">Submit goal</p>
                <form>
                    <input placeholder="Nonce answer" type="text" name="nonce"></input>
                    <input type="submit" formAction={(formData)=>{
                        const nonceVal = formData.get("nonce");
                        if (!nonceVal) { setter(PageState.InvalidNonceQuery); return; }

                        const nonce = Number.parseInt(nonceVal.toString());
                        if (Number.isNaN(nonce)) { setter(PageState.InvalidNonceQuery); return; }

                        fetch("/api/claim-goal", {
                            method: "POST",
                            body: JSON.stringify({
                                address: info!.address, level: info!.level, nonce
                            })
                        }).then((res)=>{
                            res.json().then((x)=>{
                                if (res.ok) {
                                    if (x.win === undefined) { setter(PageState.SuccessParseFail); return; }

                                    if (x.win) {
                                        setter(PageState.Win);
                                    } else {
                                        setter(PageState.Loose);
                                    }
                                } else {
                                    switch (x.code) {
                                        case 0: setter(PageState.Missing); return;
                                        case 1: setter(PageState.InvalidGoal); return;
                                        case 2: setter(PageState.NotFound); return;
                                        case 3: setter(PageState.InvalidLevel); return;
                                        case 4: setter(PageState.WrongNonce); return;
                                        case 5: setter(PageState.NotMined); return;
                                        case 6: setter(PageState.UnexpectedLog); return;
                                        case 7: setter(PageState.UnexpectedWinner); return;
                                        case 8: setter(PageState.Conflict); return;
                                        case 9: setter(PageState.Busy); return;
                                        case 10: setter(PageState.Unknown); return;
                                        default: setter(PageState.ErrorParseFail); return;
                                    }
                                }
                            })
                        });
                    }}></input>
                </form>
            </>;
        case PageState.SuccessParseFail:
            return <>
                <p className="error">Failed to parse goal data.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.Missing:
            return <>
                <p className="error">Unexepected query format.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.NotFound:
            return <p className="error">Please <a className="blue" href="join">claim a ticket</a> to join the hunt.</p>;
        case PageState.Corrupted:
            return <>
                <p className="error">Your ticket is corrupted</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.ErrorParseFail:
            return <>
                <p className="error">An unexpected error occured.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.InvalidNonceQuery:
            return <>
                <p className="error">Invalid nonce format - nonce is a number.</p>
                <button onClick={()=>setter(PageState.Loaded)}>Retry</button>
            </>;
        case PageState.InvalidQuery:
            return <>
                <p className="error">Invalid address / nonce format or missing input.</p>
                <button onClick={()=>setter(PageState.Default)}>Retry</button>
            </>;
        case PageState.Busy:
            return <>
                <p className="error">Failed to update your ticket.</p>
                <p>Please contact the administrator</p> // TODO - Rather make a retry btn available
            </>;
        case PageState.Conflict:
            return <>
                <p className="error">Internal conflict while modifying your ticket.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.InvalidGoal:
            return <>
                <p className="error">Invalid goal.</p>
            </>;
        case PageState.InvalidLevel:
            return <>
                <p className="error">You can't claim this goal, rather lower or higher level than yours.</p>
            </>;
        case PageState.NotMined:
            return <>
                <p className="error">Nonce is correct, but claim action wasn't registered on the blockchain.</p>
                <p>Please try to claim the goal again.</p>
                <button onClick={()=>setter(PageState.Loaded)}></button>
            </>;
        case PageState.UnexpectedLog:
            return <>
                <p className="error">Transaction emitted an unexpected log.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.UnexpectedWinner:
            return <>
                <p className="error">Encountered a confict.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.Unknown:
            return <>
                <p className="error">Encountered an unexpected error.</p>
                <p>Please contact the administrator</p>
            </>;
        case PageState.WrongNonce:
            return <>
                <p className="error">Invalid nonce !</p>
                <p>Time to get back to the drawing board, on <a href="/hints" className="blue">this way</a> !</p>
            </>;
        case PageState.Loose:
            return <>
                <p className="rainbow">That's the right answer, congrats !</p>
                <p>Sadly this goal have already been claimed, try your luck on the <a href="/hints" className="blue">next one</a> !</p>
            </>;
        case PageState.Win:
            return <>
                <p className="rainbow">That's the right answer, congrats !</p>
                <p>And what's more, you actually <span className="gold">won this cashprize</span> !</p>
                <p>Time to get a <a href="/hints" className="blue">win streak</a> !</p>
            </>;
    }
}

enum PageState {
    Default,
    Loaded,
    Win,
    Loose,
    InvalidQuery,
    InvalidNonceQuery,
    SuccessParseFail,
    Missing,
    NotFound,
    Corrupted,
    ErrorParseFail,
    InvalidGoal,
    InvalidLevel,
    WrongNonce,
    NotMined,
    UnexpectedLog,
    UnexpectedWinner,
    Conflict,
    Busy,
    Unknown
}