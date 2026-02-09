import "../globals.css";
import { getData } from "../actions";
import Client from "./client";

export default async function SuperSecretPage() {
    const data = await getData();

    return <>
        <h1 className="rainbow">Super Secret Organizer Page</h1>
        
        <div id="main">
            <p>Hello organizer, here you can withdraw all funds from the <span className="gold">Ticket bank</span></p>
            <p>If you're not the organizer, you're kindly asked to get out :)</p>
            <Client bank={data.bank} goals={data.goals}></Client>
        </div>
    </>;
}