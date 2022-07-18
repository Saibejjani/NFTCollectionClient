import "./App.css";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTGen from "./utils/NFTGen.json";
import NFTCol from "./utils/NFTCol.json";
const Input = ({ placeholder, name, type, value, handleChange }) => (
  <input
    placeholder={placeholder}
    type={type}
    step="0.0001"
    value={value}
    onChange={(e) => handleChange(e, name)}
    className="input-group py-3 "
  />
);

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const contractAddress = "0x000c3b547eA7d55e861A586eaa74c46A4df6CeE7";
  const [formData, setFormData] = useState({
    Name: "",
    Symbol: "",
    URI: "",
    MintAmount: "",
  });
  const [fetched, setFetched] = useState(0);

  const [prev, setPrev] = useState();
  const [totalCollections, setTotalColletions] = useState([]);
  const [currentContractAddress, setCurrentContractsAddress] = useState([]);
  const [currentColletion, setCurrentCollection] = useState([]);
  const [fetchLimit, setFetchLimit] = useState(0);

  const handleChange = (e, name) => {
    setFormData((prevstate) => ({ ...prevstate, [name]: e.target.value }));
    console.log(formData);
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts) {
          setCurrentAccount(accounts[0]);
        } else {
          console.log("no authorized account found");
        }
      } else {
        console.log("Ethereum object not found");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

        setCurrentAccount(accounts[0]);

        console.log(accounts[0]);
      } else {
        alert("Please install metamaks");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchColletions = async () => {
    console.log(currentColletion);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          contractAddress,
          NFTGen,
          signer
        );

        const len = await connectedContract.collectionsLength();

        for (let i = fetched; i < len.toNumber(); i++) {
          const currentAddress = await connectedContract.collections(i);
          setCurrentContractsAddress((current) => [...current, currentAddress]);
          const currentContract = new ethers.Contract(
            currentAddress,
            NFTCol,
            signer
          );
          let uri = await currentContract.tokenURI(1);
          uri = `https://ipfs.io/ipfs/${uri.split("ipfs://")[1]}`;
          const tokenMetadata = await fetch(uri).then((response) =>
            response.json()
          );
          let { image } = tokenMetadata;

          image = `https://ipfs.io/ipfs/${image.split("ipfs://")}`;
          image = image.replace(",", "");
          const name = await currentContract.name();
          const symbol = await currentContract.symbol();

          setTotalColletions((current) => [
            ...current,
            { image, name, symbol },
          ]);
        }

        setFetched(len.toNumber());
        console.log(currentContractAddress);
        console.log(len.toNumber());
      } else {
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchThisCollection = async (index) => {
    try {
      const { ethereum } = window;
      console.log(prev);
      if (prev !== index) {
        setPrev(index);
        console.log(prev);
        setCurrentCollection([]);
        setFetchLimit(0);
      }

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const currentContract = new ethers.Contract(
          currentContractAddress[index],
          NFTCol,
          signer
        );
        console.log(currentContractAddress[index]);
        const totalSupply = await currentContract.totalSupply();

        for (let i = fetchLimit + 1; i <= totalSupply.toNumber(); i++) {
          let uri = await currentContract.tokenURI(i);
          uri = `https://ipfs.io/ipfs/${uri.split("ipfs://")[1]}`;
          const tokenMetadata = await fetch(uri).then((response) =>
            response.json()
          );
          let { image, name, description } = tokenMetadata;

          image = `https://ipfs.io/ipfs/${image.split("ipfs://")}`;
          image = image.replace(",", "");
          setCurrentCollection((current) => [
            ...current,
            { name, description, image },
          ]);
          console.log(image);
        }
        setFetchLimit(totalSupply.toNumber());
      } else {
        console.log("ethereum object not found");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const MintCollection = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          contractAddress,
          NFTGen,
          signer
        );
        const { Name, Symbol, URI, MintAmount } = formData;

        const rec = await connectedContract.createNewCollection(
          Name,
          Symbol,
          URI,
          MintAmount
        );
        const trx = await rec.wait();
        console.log(trx);
        fetchColletions();
      } else {
        console.log("Ethereum object not found");
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  useEffect(() => {
    (async () => {
      await fetchColletions();
    })();
  }, []);

  return (
    <div>
      <div className="app">
        {currentAccount ? (
          <h6 className="my-5">{currentAccount}</h6>
        ) : (
          <button className="btn btn-outline-primary" onClick={connectWallet}>
            ConnectWallet
          </button>
        )}

        <div className="front">
          <Input
            placeholder="TEST COLLECTION"
            name="Name"
            type="text"
            handleChange={handleChange}
          />
          <br />
          <Input
            placeholder="TSTC"
            name="Symbol"
            type="text"
            handleChange={handleChange}
          />
          <br />
          <Input
            placeholder="ipfs://your-uri/"
            name="URI"
            type="text"
            handleChange={handleChange}
          />
          <br />
          <Input
            placeholder="20"
            name="MintAmount"
            type="number"
            handleChange={handleChange}
          />
          <br />
          <button className="btn btn-primary" onClick={MintCollection}>
            MintCollection
          </button>

          <button
            onClick={() => {
              fetchColletions();
            }}
            className="btn btn-primary mx-3"
          >
            fetch collections
          </button>
        </div>
        <br />

        <div className="my-5">
          <h1>Colletions</h1>
          <div className="row row-col-1 row-cols-md-3 mb-3 text-center my-5">
            {totalCollections.map((ele, index) => {
              return (
                <div
                  key={index}
                  className="col"
                  onClick={async () => {
                    await fetchThisCollection(index);
                  }}
                >
                  <div className="card mb-4 rounded shadow-sm">
                    <img src={ele.image} style={{ margin: "20px" }} alt="nft" />
                    <div className="header">
                      <h4>{ele.name}</h4>
                      <h6>{ele.symbol}</h6>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <br />
        <div>
          <h1 className="text my-5 mx-5"> NFTS</h1>
          <div className="row row-col-1 row-cols-md-3 mb-3 text-center">
            {currentColletion.map((ele, index) => {
              return (
                <div className="col" key={index}>
                  <div className="card mb-4 rounded shadow-sm">
                    <img src={ele.image} style={{ margin: "20px" }} alt="nft" />
                    <div className="header">
                      <h4>{ele.name}</h4>
                      <h6>{ele.description}</h6>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
