Welcome to CLI Pong! In order to play the game you need to login first,
 if you encounter any issues related to login  make sure that the address of the server is correct,
 the game script is set to take environement variables from frontend/.env
 if you encounter an error before the interface loads make sure to delete the virtual environement
 make sure NEXT_PUBLIC_URL and NEXT_PUBLIC_WS_BASE_URL envs are set and valid
  The Cli game aims to showcase the usage of  the pong api which consists of three major websocket events,
   1.game_init: this event is sent when the game is  initialized and contains the game settings and the players 
   2.game_state: this event is sent when the game state is  updated and contains the current state of the game 
   3.game_end: this event is sent when the game ends  and contains the final state of the game. 
   After the game ends the score is properly saved in  the database, users have the ability to view 
   the  history through the dashboard view of the website. the game is played using the 'w/up' and 's/down'  keys to move the paddle up and down respectively, for the player to quit the game they can press the 'q' key. Enjoy the game and for further  information please contact us via email."""
