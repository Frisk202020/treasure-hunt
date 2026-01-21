import Client from "./client";
import "../globals.css";

export default async function Join() {
    return <>
        <div id="main">
            <h1 className="rainbow">Join the Hunt !</h1>
            <Client></Client>
        </div>
    </>
}