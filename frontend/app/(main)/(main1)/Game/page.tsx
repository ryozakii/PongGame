import GameCard from "@components/GameCard";

import style from "@styles/game.module.css";

const cardData = [
  {
    title: "PingPong Game",
    description:
      "Enjoy a fast-paced game of Ping Pong with realistic physics and challenging AI opponents.",
    link: "/Game/PingPong",
    backgroundClass: style.ping_pong_background,
    buttonText: "Join Now",
  },
  {
    title: "TicTacToe Game",
    description:
      "Play the classic game of Tic Tac Toe against a friend. Can you get three in a row?",
    link: "/Game/TicTacToe",
    backgroundClass: style.tictac_background,
    buttonText: "Join Now",
  },
];

function game_page() {
  return (
    <div className={style.main}>
      <div className={style.cards}>
        {cardData.map((card, index) => (
          <GameCard
            key={index}
            title={card.title}
            description={card.description}
            link={card.link}
            backgroundClass={card.backgroundClass}
            buttonText={card.buttonText}
            // onButtonClick={card.onButtonClick}
          />
        ))}
      </div>
    </div>
  );
}

export default game_page;
