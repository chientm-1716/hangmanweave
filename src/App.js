import React, { Component } from 'react';

import gameFactory from './game-state-factory';
import { GAME_WON, GAME_STARTED, GAME_OVER } from './game-states';
import AppHeader from './AppHeader';
import Game from './Game';
import Arweave from 'arweave/web';

import './App.css';
var counter;
class App extends Component {
  constructor(props) {
    super(props);
    this.onLetterClick = this.onLetterClick.bind(this);
    this.onRestartClick = this.onRestartClick.bind(this);
    this.fileUpload = React.createRef();
    // Random word and new game state data
    this.state = gameFactory.newGame();
    this.state.isLoggedIn = false;
    this.state.startGame = false;
    this.state.timeCounter = 0;
    this.state.timeScore = 0;
    this.state.leaderboard = [];
  }

  async componentDidMount() {
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });
    this.setState({ arweave: arweave });
  }

  render() {
    const gameProps = {
      onLetterClick: this.onLetterClick,
      onRestartClick: this.onRestartClick,
      ...this.state,
    };

    return (
      <div className='App'>
        <AppHeader
          login={this.showUpload.bind(this)}
          isLoggedIn={this.state.isLoggedIn}
          address={this.state.address}
          leaderboard={this.state.leaderboard}
        />
        <input
          type='file'
          onChange={this.onUpload}
          style={{ display: 'none' }}
          ref={this.fileUpload}
        />
        <br />
        <span>Timer: {this.state.timeCounter}</span>
        <Game {...gameProps} />
      </div>
    );
  }

  showUpload = () => {
    this.fileUpload.current.click();
  };

  onUpload = async (e) => {
    let dataFile = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.onloadend = async (e) => {
      const jwk = JSON.parse(fileReader.result);
      this.setState({ jwk: jwk });
      const arweave = this.state.arweave;
      let query = {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'App',
          expr2: 'hangman-arweave',
        },
        expr2: {
          op: 'equals',
          expr1: 'Type',
          expr2: 'time',
        },
      };
      let tx_rows = [];
      if (arweave) {
        arweave.wallets.jwkToAddress(jwk).then(async (address) => {
          this.setState({ address: address, isLoggedIn: true });
        });
        const res = await arweave.arql(query);
        tx_rows = await Promise.all(
          res.map(async (id, i) => {
            let tx_row = {};
            let tx;
            try {
              tx = await arweave.transactions.get(id);
            } catch (e) {
              return {};
            }
            let tx_owner = await arweave.wallets.ownerToAddress(tx.owner);

            tx_row['unixTime'] = '0';
            tx_row['type'] = null;
            tx.get('tags').forEach((tag) => {
              let key = tag.get('name', {
                decode: true,
                string: true,
              });
              let value = tag.get('value', {
                decode: true,
                string: true,
              });

              if (key === 'Unix-Time') tx_row['unixTime'] = parseInt(value);
              if (key === 'Type') tx_row['type'] = value;
            });
            tx_row['player'] = tx_owner;
            let data = tx.get('data', { decode: true, string: true });
            tx_row['value'] = parseInt(data);
            return tx_row;
          })
        );
        console.log(tx_rows);
        tx_rows.sort((a, b) => {
          return a.value - b.value !== 0 ? a.value - b.value : a.unixTime - b.unixTime;
        });
        this.setState({ leaderboard: tx_rows });
      }
    };
    if (dataFile) {
      fileReader.readAsText(dataFile);
    }
  };

  submitScore = async (timeScore) => {
    let unixTime = Math.round(new Date().getTime() / 1000);
    let tx = await this.state.arweave.createTransaction(
      {
        data: timeScore.toString(),
      },
      this.state.jwk
    );
    tx.addTag('App', 'hangman-arweave');
    tx.addTag('Unix-Time', unixTime);
    tx.addTag('Type', 'time');
    await this.state.arweave.transactions.sign(tx, this.state.jwk);
    let res = await this.state.arweave.transactions.post(tx);
    console.log(res);
    alert('Successful');
  };

  fetchScore = async () => {
    let arweave = this.state.arweave;
    let query = {
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'App',
        expr2: 'hangman-arweave',
      },
      expr2: {
        op: 'equals',
        expr1: 'Type',
        expr2: 'time',
      },
    };
    let tx_rows = [];
    if (arweave) {
      const res = await arweave.arql(query);
      tx_rows = await Promise.all(
        res.map(async (id, i) => {
          let tx_row = {};
          let tx;
          try {
            tx = await arweave.transactions.get(id);
          } catch (e) {
            return {};
          }
          let tx_owner = await arweave.wallets.ownerToAddress(tx.owner);

          tx_row['unixTime'] = '0';
          tx_row['type'] = null;
          tx.get('tags').forEach((tag) => {
            let key = tag.get('name', {
              decode: true,
              string: true,
            });
            let value = tag.get('value', {
              decode: true,
              string: true,
            });

            if (key === 'Unix-Time') tx_row['unixTime'] = parseInt(value);
            if (key === 'Type') tx_row['type'] = value;
          });
          tx_row['player'] = tx_owner;
          let data = tx.get('data', { decode: true, string: true });
          tx_row['value'] = parseInt(data);
        })
      );
      tx_rows.sort((a, b) => {
        return a.value - b.value !== 0 ? a.value - b.value : a.unixTime - b.unixTime;
      });
      this.setState({ leaderboard: tx_rows });
    }
  };

  async onLetterClick(letter, e) {
    e.preventDefault();
    if (!this.state.startGame) {
      this.setState({ startGame: true });
      counter = setInterval(() => {
        this.setState({ timeCounter: this.state.timeCounter + 1 });
      }, 1000);
    }
    const firstIndex = this.state.word.indexOf(letter);
    console.log(this.state.word);
    if (firstIndex !== -1) {
      const letters = this.state.letters.map((letterObject) => {
        if (letterObject.value === letter) {
          return Object.assign({}, letterObject, {
            guessed: true,
          });
        }

        return letterObject;
      });

      // Check if the game has been won
      const gameWon = letters.reduce((winState, currentObject) => {
        return winState && currentObject.guessed;
      }, true);

      if (gameWon) {
        await this.submitScore(this.state.timeCounter);
        this.setState({ timeScore: this.state.timeCounter, timeCounter: 0, startGame: false });
        clearInterval(counter);
      }

      this.setState((prevState, props) => {
        return {
          letters,
          pastGuesses: [letter].concat(prevState.pastGuesses),
          gameState: gameWon ? GAME_WON : GAME_STARTED,
        };
      });
    } else {
      this.setState((prevState, props) => {
        // Update number of attempts left
        const guessesLeft = prevState.guesses - 1;
        let stateUpdate = {
          guesses: guessesLeft,
        };

        // Kill the game if needed
        if (guessesLeft === 0) {
          stateUpdate.gameState = GAME_OVER;
          this.setState({ timeScore: this.state.timeCounter, startGame: false, timeCounter: 0 });
          clearInterval(counter);
        }

        // Update the letters already tried
        stateUpdate.pastGuesses = [letter].concat(prevState.pastGuesses);

        return stateUpdate;
      });
    }
  }

  onRestartClick(e) {
    e.preventDefault();

    this.setState(gameFactory.newGame());
  }
}

export default App;
