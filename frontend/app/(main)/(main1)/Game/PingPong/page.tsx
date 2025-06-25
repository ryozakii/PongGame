import GameCard from '@components/GameCard'

import style from '@styles/games.module.css'

const cardData = [
  {
    title: "Local Game",
    description: "Take on an AI bot in a fast-paced local Ping Pong match! Show off your skills, outplay the machine, and prove that human reflexes and strategy still reign supreme.",
    link: "/Game/PingPong/LocalGame",
    backgroundClass: style.local_game_background,
    buttonText: "Start Game",
  },
  {
    title: "Online Game",
    description: "Challenge your friends in an exciting online ping pong game! Play real-time matches, compete in different game modes, and show off your skills as you rally for victory.",
    link: "/Game/PingPong/OnlineGame",
    backgroundClass: style.online_game_background,
    buttonText: "Join Now",
  },
  {
    title: "Tournament",
    description: "Compete in an online ping pong tournament, face off against skilled players, and climb the leaderboard to become the champion!",
    backgroundClass: style.tournament_background,
    buttonText: "Enter Tournament",
    link: "/Game/PingPong/Tournament",
    // onButtonClick: () => alert('Tournament feature coming soon!'),
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
      />
    ))}
  </div>
  </div>
  )
}

export default game_page