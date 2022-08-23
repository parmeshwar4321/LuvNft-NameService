import React, { useEffect, useState } from "react";
import "./Home.css";
import twitterLogo from "../../assets/twitter-logo.svg";
import polygonLogo from "../../assets/polygonlogo.png";
import ethLogo from "../../assets/ethlogo.png";

import { ethers } from "ethers";
import contractAbi from "../../utils/DomainAbi.json";
import { networks } from "../../utils/networks";

// Constants
const TWITTER_HANDLE = "luvnft";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// Add the domain you will be minting
const tld = ".luv";
const CONTRACT_ADDRESS = "0x21eCE5879f17A9c0C4A3B2b3794A84C86DE81d04";

const App = () => {
  //Just a state variable we use to store our user's public wallet. Don't forget to import useState at the top.
  const [currentAccount, setCurrentAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [mints, setMints] = useState([]);
  const checkIfWalletIsConnected = async () => {
    // First make sure we have access to window.ethereum
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });

    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  // Implement your connectWallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price =
      domain.length === 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Create a function to render if wallet is not connected yet
  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      {/* <img
        src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif"
        alt="Ninja gif"
      /> */}
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    </div>
  );
  // Form to enter domain name and data
  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="connect-wallet-container">
          <h2>Please switch to Polygon Mumbai Testnet</h2>
          <button className="cta-button mint-button" onClick={switchNetwork}>
            Click here to switch
          </button>
        </div>
      );
    }
    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="Domain"
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={record}
          placeholder=" Your .luv name motto"
          onChange={(e) => setRecord(e.target.value)}
        />

        {editing ? (
          <div className="button-container">
            <button
              className="cta-button mint-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set record
            </button>
            <button
              className="cta-button mint-button"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={mintDomain}
          >
            MINT
          </button>
        )}
      </div>
    );
  };
  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  };
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        const names = await contract.getAllNames();
        console.log(names);

        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="subtitle"> Recently minted domains!</p>
          <div className="mint-list">
            {mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a
                      className="link"
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <p className="underlined">
                        {" "}
                        {mint.name}
                        {tld}{" "}
                      </p>
                    </a>
                    {mint.owner.toLowerCase() ===
                    currentAccount.toLowerCase() ? (
                      <button
                        className="edit-button"
                        onClick={() => editRecord(mint.name)}
                      >
                        <img
                          className="edit-icon"
                          src="https://img.icons8.com/metro/26/000000/pencil.png"
                          alt="Edit button"
                        />
                      </button>
                    ) : null}
                  </div>
                  <p> {mint.record} </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (network === "Polygon Mumbai Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);
  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <header className="navigation-container">
            <div className="left brand">
              <p className="brand-content">Luv Name Service</p>
            </div>
            <div className="project-feature-list">
              <p className="nav-link">Projects</p>
              <p className="nav-link">Community</p>
            </div>
            <div className="right-container">
              <div className="right">
                <img
                  alt="Network logo"
                  className="logo"
                  src={network.includes("Polygon") ? polygonLogo : ethLogo}
                />
                {currentAccount ? (
                  <p>
                    Wallet: {currentAccount.slice(0, 6)}...
                    {currentAccount.slice(-4)}{" "}
                  </p>
                ) : (
                  <p> Not connected </p>
                )}
              </div>
            </div>
          </header>
        </div>
        <div className="hero terra">
          <div className="hero-content">
            <h1 className="hero-heading">
              Blockchain <s>ownership</s> <br />
              own-ya-shit starts by owning your
              <span className="text-span project-title polygon"> Polygon </span>
              .luv name
            </h1>
            <div className="hero-subheading">
              All the cool kids on social media have have .eth/.sol name
              domains. Here's how you can become cooler than them: by making
              your own .luv Polygon name domain! Your .luv domain is your
              all-in-one domain/hosting, banking and billing, online
              identification, user management, authentication and more.
            </div>
          </div>
        </div>

        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
      <div className="about-section">
        <div className="project-lead">
          <div className="project-lead-img">
            <img
              src="https://uploads-ssl.webflow.com/62323c71bbabee32654e6d25/62617e11f8ed5a37f26cc9d6_raza-p-500.png"
              alt="img"
            ></img>
          </div>
          <div className="project-lead-content">
            <span>PROJECT LEAD</span>
            <h1>Hi, I'm Raza!</h1>
            <p>
              PROJECT LEAD Hi, I'm Raza! I'm a serial builder who's worked at
              web3 startups as a frontend dev. I contribute to multiple DAOs and
              have helped thousands of devs get into web3. Catch me on Twitter
              here.
            </p>
          </div>
        </div>
        <div className="faq-section">
          <h1> Frequently Asked Questions</h1>
          <div className="faq-blocks">
            <div className="faq-block">
              <div className="faq-question">
                <strong>How much does this cost?</strong>
              </div>
              <p className="faq-answer">
                How much does this cost? All of our projects are free and
                open-source! You'll never need to pay for our guides, and we'll
                deploy on a testnet so your total cost for this whole thing will
                be $0.
              </p>
            </div>
            <div className="faq-block">
              <div className="faq-question">
                <strong>What's the time commitment?</strong>
              </div>
              <p className="faq-answer">
                The whole project will probably take you like 5-10 hours.
                Depends on your skill level. Most people finish it the same
                weekend it kicks off.
              </p>
            </div>
            <div className="faq-block">
              <div className="faq-question">
                <strong>Is this live or async?</strong>
              </div>
              <div className="faq-answer">
                It's all async! You can work on your project on your own time.
                All of the content will be available to you when you enrol and
                you'll have access to it forever :)
              </div>
            </div>
            <div className="faq-block">
              <div className="faq-question">
                <strong>Are there guides I follow to build the project?</strong>
              </div>
              <p className="faq-answer">
                If you're a dev curious about web3 -- this will be perfect. It
                helps if you have basic web dev experience!
              </p>
            </div>
            <div className="faq-block">
              <div className="faq-question">
                <strong>What languages do I need to know for this?</strong>
              </div>
              <p className="faq-answer">
                You just need to know some Javascript and the basics of React.
                Also, you should know the basics of running stuff inside a
                terminal. Basically, if you're familiar with the basics of web
                dev, you can do this for sure. If you don't, you'll struggle but
                you'll figure it out if you put in the work. We'll support you
                :).
              </p>
            </div>
            <div className="faq-block">
              <div className="faq-question">
                <strong>Will I get an NFT for completing the project?</strong>
              </div>
              <p className="faq-answer">
                Yes ser. Every successful completion of a buildspace project is
                rewarded with a unique NFT! Good luck.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
