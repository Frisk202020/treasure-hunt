# Treasure Hunt - A blockchain project

This project is my final submission for the [Blockchain and Distributed Ledger Technologies](https://sites.google.com/uniroma1.it/blockchain-dlt-course) course from [Sapienza](https://www.uniroma1.it/it/pagina-strutturale/home) University of Rome. 

In this project, we organize a treasure hunt, which consists of finding keys accross the internet which allow to collect rewards in a *decentralized manner*, meanning after the initial deployment, the organizer is not needed anymore. Contestants need keys to claim *Hunt Goals*, which deliver automatically funds towards the first address that provides the correct key.

# Content of the project

This project features both blockchain-focused work, namely *tokens* that are deployed on the Ethereum Sepolia network to provide funds management through *Smart Contracts*, and a Decentrilized-Application (dApp) which abstracts users from the low-level blockchain work (namely Ethereum transactions).

## Tokens

We built two tokens which have different purposes. We'll describe each shortly.

- [Ticket Bank](solidity/src/TicketBank.sol) : A Treasure Hunt should have a **unique** instance of this token. Contestants need to pay an entry fee to participate in the hunt, and this contract tracks enrolled addresses. Furthermore, Goals are **ordered**, and the bank keeps track for each user which goal needs to be claimed next. It finally stores all *authorized* goals, meaning goals deployed by the organizer. This prevents users to claim a malicious goal and go to the next level without actually finding the expected solution.
- [Hunt Goal](solidity/src/HuntGoal.sol) : This is the token that actually holds money and should be claimed by users, and a hunt has multiple of these. It is deployed by the organizer, which funds the goal and provides the `Ticket Bank` address the goal should call when it is claimed. The key to collect the goal is a **16 digits** nonce, of which only the hash is stored on the blockchain.

## The App

Users are meant to interact with these tokens through the [dApp](https://treasure-hunt-8pjo.onrender.com/). The hunt handles the case where users bypass the app, it is only a convinience tool. This app features :
- **Abstraction of blockchain work** (transactions) : to this end, the app requires to interact with a user's [Metamask](https://metamask.io/) wallet. Abstractions are both for users (claim ticket / goals) **and the organizer**. Indeed, prior to the hunt he can fund and authorize goals, and after the hunt is launched he can collect ticket fees (sent to the `Ticket Bank`).
- **Integrity of goals** : only official goals (emitted by organizer) are available to claim through the app.
- **Prevent useless transactions** : the app checks keys before doing any transactions on the blockchain, which allows to check answers for free.
- **Provide hints** : a dedicated page provides hints for each goal to reach its key.

This app was the occasion to learn [React](https://react.dev/) and [Next.js](https://nextjs.org/) frameworks.