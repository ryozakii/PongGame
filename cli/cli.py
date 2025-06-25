import curses
import asyncio
import websockets
import json
import sys
import signal
import os
import requests
import shutil
from websockets.protocol import State
import time
import urllib3
import ssl

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# from dotenv import load_dotenv
class CursesPong:
    def __init__(self):
        self.stdscr = None
        self.game_window = None
        self.score_window = None
        self.status_window = None
        self.ready = False
        self.last_move = ""
        self.game_settings = {}
        self.terminal_height = 29
        self.terminal_width = 80
        self.min_height = 29
        self.min_width = 80
        self.max_height = 29 * 3
        self.max_width = 80 * 3
        self.game_state = {}
        self.access_token = None
        self.ping_pong = {}
        self.game_height = 0
        self.game_width = 0
        self.score_height = 0
        self.score_width = 0
        self.status_height = 0
        self.status_width = 0
        self.player1 = {}
        self.player2 = {}
        # self.key = None

    def init_windows(self):
        # Initialize color pairs
        curses.start_color()
        curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)  # Default
        curses.init_pair(2, curses.COLOR_GREEN, curses.COLOR_BLACK)  # Score
        curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Ball
        curses.init_pair(4, curses.COLOR_RED, curses.COLOR_BLACK)    # Error messages
        # Hide cursor and enable special keys
        curses.curs_set(0)
        curses.noecho()
        curses.cbreak()
        # #print("test")

        # Create windows
        self.score_height = 3
        self.score_width = self.terminal_width
        self.status_height = 2
        self.status_width = self.terminal_width
        self.game_window_height = self.terminal_height - (self.score_height + self.status_height)
        self.game_window_width = self.terminal_width

        self.score_window = curses.newwin(self.score_height, self.score_width, 0, 0)
        self.game_window = curses.newwin(self.game_window_height, self.game_window_width, self.score_height, 0)
        self.status_window = curses.newwin(self.status_height, self.status_width, self.game_window_height + self.score_height, 0)

        # Enable keypad for all windows
        self.score_window.keypad(1)
        self.game_window.keypad(1)
        self.status_window.keypad(1)

        # Make game window non-blocking for input
        self.game_window.nodelay(1)

    def draw_game_state(self):
        if not self.game_state:
            return

        # Clear all windows
        self.score_window.clear()
        self.game_window.clear()
        # self.status_window.clear()

        # Draw borders
        self.game_window.border()

        # Scale coordinates to terminal size
        scale_x = (self.game_window_width) / self.game_settings.get('width')
        scale_y = (self.game_window_height - 1) / self.game_settings.get('height')

        # Draw scores
        user1 = self.player1.get("username", "Player 1")
        user2 = self.player2.get("username", "Player 2")
        score_text = f"{user1 }: {self.game_state.get('player1_score', 0)} | {user2}: {self.game_state.get('player2_score', 0)}"
        # score_text = score_text[:(self.game_window_width  - len(score_text)) // 2 - 2]
        self.score_window.attron(curses.color_pair(2))
        self.score_window.addstr(1, (self.game_window_width  - len(score_text)) // 2, score_text)
        self.score_window.attroff(curses.color_pair(2))
        self.score_window.refresh()
        # Draw paddles
        paddle_y1 = int(self.game_state.get('player1_y', 0) * scale_y)
        paddle_y2 = int(self.game_state.get('player2_y', 0) * scale_y)
        paddle_height = int(self.game_settings.get('paddle_height') * scale_y)

        for i in range(1,paddle_height + 1):
            if 0 < paddle_y1 + i < self.game_window_height:
                self.game_window.addch(paddle_y1 + i, 1, '│')
            if 0 < paddle_y2 + i < self.game_window_height:
                self.game_window.addch(paddle_y2 + i, self.game_window_width - 2 , '│')

        # Draw ball
        ball_x = int(self.game_state.get('ball_x', 0) * scale_x)
        ball_y = int(self.game_state.get('ball_y', 0) * scale_y) 

        if (0 < ball_y < self.game_window_height  and 
            0 < ball_x < self.game_window_width):
            self.game_window.attron(curses.color_pair(3))
            self.game_window.addch(ball_y, ball_x, '●')
            self.game_window.attroff(curses.color_pair(3))

        # Draw center line
        for i in range(1, self.game_window_height - 1, 2):
            self.game_window.addch(i, self.game_window_width // 2, '┆')

    async def wait_for_input(self, delay_ms):

        delay_ms = delay_ms / 10
        for _ in range(10):
            key = self.game_window.getch()
            if key != -1:
                return key
            await asyncio.sleep(delay_ms / 1000)  # Convert milliseconds to seconds
        return -1

    async def handle_input(self, websocket):
        # self.game_window.timeout(1000)
        self.game_window.nodelay(True)
        while True:
            try:
                # self.game_window.nodelay(True)
                key = await self.wait_for_input(100)
                # #print(key)
                message = None

                if key == ord('q'):
                    await websocket.close()
                    return False
                elif (key == ord('w') and self.last_move != 'w') or (key == curses.KEY_UP and self.last_move != curses.KEY_UP):
                    message = {'move': 'up', 'type': 'paddle_move'}
                    self.last_move = key
                elif (key == ord('s') and self.last_move != 's') or (key == curses.KEY_DOWN and self.last_move != curses.KEY_DOWN):
                    message = {'move': 'down', 'type': 'paddle_move'}
                    self.last_move = key
                elif key == -1 and self.last_move:
                    message = {'move': 'stop', 'type': 'paddle_move'}
                    self.last_move = ''

                if message and self.ready and websocket.state == State.OPEN:
                    await websocket.send(json.dumps(message))

                await asyncio.sleep(0.001)
            except Exception as e:
                self.show_error(f"Input error: {str(e)}")
                return False

        return True

    def show_error(self, message):
        """Display error message in status window"""
        self.status_window.clear()
        self.status_window.attron(curses.color_pair(4))
        self.status_window.addstr(0, 2, message)
        self.status_window.attroff(curses.color_pair(4))
        self.status_window.refresh()

    def show_message(self, message):
        """Display normal message in status window"""
        self.status_window.clear()
        self.status_window.addstr(0, 2, message)
        self.status_window.refresh()

    async def connect_to_websocket(self):
        url = f"{os.getenv('NEXT_PUBLIC_WS_BASE_URL')}/ws/ping_pong/"
        headers = {"authorization": f"bearer {self.access_token}"}
        self.game_window.clear()
        self.game_window.refresh()
        self.game_window.border()
        title = "CLI PONG"
        # self.game_window.addstr(2, (self.terminal_width - len(title)) // 2, title, curses.A_BOLD)
        # msg = "Waiting for players to join..."
        # self.game_window.addstr(self.game_window_height // 2, (self.game_window_width - len(msg)) // 2, msg)
        # self.game_window.refresh()
        # self.game_window.addch(self., 1,
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        try:
            async with websockets.connect(
                url, additional_headers=headers, ssl=ssl_context
            ) as websocket:
                self.show_message("(q - Quit) : Connected to server!")

                # Start input handling
                input_task = asyncio.create_task(self.handle_input(websocket))
                while True:
                    try:
                        if websocket.state == State.CLOSED:
                            break

                        response = await websocket.recv()
                        data = json.loads(response)

                        if 'type' in data:
                            if data['type'] == 'info':
                                self.show_message("(q - Quit) : " + data['message'])
                            elif data['type'] == 'game_init':
                                self.ready = True
                                self.game_settings = data['game_settings']
                                self.player1 = data['player1']
                                self.player2 = data['player2']

                                # self.show_message(str(self.player1))
                                # with open("logs.txt", "w") as f:
                                #     f.write(str(self.player1))
                                # sleep(10)
                                # player_type = str(data['player'])
                                # with open("logs.txt", "w") as f:
                                #     f.write(str(player_type))
                                # self.show_message(f"You are {player_type}, playing against {'player2' if player_type == 'player1' else 'player1'}")
                            elif data['type'] == 'game_state':
                                self.show_message("(q - Quit) (w/↑ - Up) (s/↓ - Down)")
                                self.game_state = data['game_state']
                                self.draw_game_state()
                            elif data['type'] == 'game_end':
                                self.ready = False
                                winner = data['winner']
                                # self.show_message("Game ended!")
                                # self.game_window.border()
                                winner = self.player1 if winner == 'player1' else self.player2 
                                winner = winner.get("username")
                                self.show_message(f"{winner} wins! Press any key to continue...")
                                self.game_window.nodelay(0)
                                self.game_window.getch()
                                self.game_window.clear()
                                self.game_window.border()
                                self.game_window.nodelay(1)
                                self.status_window.clear()
                                self.status_window.refresh()
                                self.score_window.clear()
                                break
                        self.game_window.refresh()
                        await asyncio.sleep(0.01)

                    except Exception as e:
                        self.show_error(f"Game Stoped")
                        break

                input_task.cancel()
                self.game_window.clear()
                self.game_window.border()
                self.show_message("Game ended!")

        except Exception as e:
            # with open("logs.txt", "w") as f:
            #     f.write(str(e))
            self.show_error(f"Connection error: {str(e)}")

    def get_string(self, window, prompt, y, x, password=False):
        """Get string input with editing support."""

        window.addstr(y, x, prompt)
        window.refresh()
        self.status_window.clear()
        self.status_window.addstr(0, 2, "Press 'esc' to return")
        self.status_window.refresh()
        input_str = ""
        while True:
            try:
                char = window.getch()
                if char == 27:  # Escape key
                    self.status_window.clear()
                    self.status_window.refresh()
                    return None
                if (x + len(prompt) + len(input_str)) >= self.terminal_width or  len(input_str) >= 30:
                    self.show_error("Invalid input length")
                    input_str = ""
                    window.addstr(y, x + len(prompt), " " * 30)
                    continue
                if char == ord('\n'):
                    if len(input_str) < 3:
                        self.show_error("Please enter a valid input")
                        input_str = ""
                        window.addstr(y, x + len(prompt), " " * 30)
                        continue
                    self.status_window.clear()
                    self.status_window.refresh()
                    break
                elif char in (ord('\b'), 127):  # Backspace
                    if input_str:
                        input_str = input_str[:-1]
                        window.addstr(y, x + len(prompt), " " * 30)
                elif 32 <= char <= 126:  # Printable characters
                    input_str += chr(char)
                window.addstr(y, x + len(prompt), '*' * len(input_str) if password else input_str)
            except Exception:
                break
        return input_str

    def login(self):
        """Handle user login"""
        self.game_window.clear()
        self.game_window.border()

        # Draw login form
        title = "LOGIN FORM"
        self.game_window.addstr(2, (self.terminal_width - len(title)) // 2, title, curses.A_BOLD)

        # Get credentials
        email = self.get_string(self.game_window, "Email: ", 5, 2)
        if email is None:
            return False
        password = self.get_string(self.game_window, "Password: ", 7, 2, password=True)
        if password is None:
            return False
        # email = "abc@gmail.com"
        # password = "abc@gmail.com"
        # Show loading message
        self.game_window.addstr(10, 2, "Logging in...")
        self.game_window.refresh()

        # Attempt login
        try:
            url = f"{os.getenv('NEXT_PUBLIC_URL')}/api/login"
            data = {"email": email, "password": password}
            response = requests.post(url, json=data, verify=False)
            data2 = response.json()
            if "requires_2fa" in data2 and data2["requires_2fa"]:
                while True:
                    otp_token = self.get_string(self.game_window, "Enter OTP: ", 10, 2)
                    if otp_token is None:
                        return False
                    data2 = {"email": email, "password": password, "otp_token": otp_token}
                    response = requests.post(url, json=data2)
                    if response.status_code == 200:
                        break
            if response.status_code == 200:
                self.access_token = response.json()['data']['access']
                self.show_message("Logged in successfully!")
                return True
            else:
                self.show_error(f"Login failed (Status {response.status_code})")
                return False

        except requests.exceptions.RequestException as e:
            # with open("logs.txt", "w") as f:
            #     f.write(str(e))
            self.show_error(f"Connection error: {str(e)}")
            return False

    def main_menu(self):
        menu_items = ["Login", "Start Game", "Help", "Quit"]
        current_item = 0
        if self.access_token:
            menu_items[0] = "Logout"
        self.game_window.clear()
        self.game_window.border()
        self.score_window.clear()
        self.status_window.clear()
        self.game_window.refresh()
        self.score_window.refresh()
        self.show_message("(w/↑ - Up) (s/↓ - Down) (Enter - Select)")
        while True:
            # self.game_window.clear()
            # self.game_window.refresh()
            # self.game_window.border()
            # Draw title
            title = "CLI PONG"
            self.game_window.addstr(2, (self.terminal_width - len(title)) // 2, title, curses.A_BOLD)

            # Draw menu items
            for idx, item in enumerate(menu_items):
                y = self.terminal_height // 2 - len(menu_items) + idx
                x = (self.terminal_width - len(item)) // 2         
                if idx == current_item:
                    self.game_window.attron(curses.A_REVERSE)
                self.game_window.addstr(y, x, item)
                if idx == current_item:
                    self.game_window.attroff(curses.A_REVERSE)

            # Handle input
            key = self.game_window.getch()
            if (key == curses.KEY_UP or key == ord('w')):
                current_item = (current_item - 1) % len(menu_items)
            elif (key == curses.KEY_DOWN or key == ord('s')):
                current_item = (current_item + 1) % len(menu_items)
            elif key == ord('\n'):
                selected = menu_items[current_item]
                if selected == "Login":
                    if self.login():
                        menu_items[0] = "Logout"  # Change Login to Logout
                    self.game_window.clear()
                    self.game_window.border()
                    self.game_window.refresh()
                elif selected == "Logout":
                    self.access_token = None
                    self.show_message("Logged out!")
                    menu_items[0] = "Login"
                    self.game_window.clear()
                    self.game_window.border()
                elif selected == "Start Game":
                    if self.access_token:
                        return True
                    else:
                        self.show_message("Please login first!")
                elif selected == "Quit":
                    return False
                elif selected == "Help":
                    self.game_window.clear()
                    msg = """Welcome to CLI Pong! In order to play the game you need to login first, if you encounter any issues related to login  make sure that the address of the server is correct, The Cli game aims to showcase the usage of  the pong api which consists of three major websocket events, 1.game_init: this event is sent when the game is  initialized and contains the game settings and the players 2.game_state: this event is sent when the game state is  updated and contains the current state of the game 3.game_end: this event is sent when the game ends  and contains the final state of the game. After the game ends the score is properly saved in  the database, users have the ability to view the  history through the dashboard view of the website. the game is played using the 'w/up' and 's/down'  keys to move the paddle up and down respectively, for the player to quit the game they can press the 'q' key. Enjoy the game and for further  information please contact us via email."""

                    # center the msg
                    msg_width = self.game_window_width - self.game_window_width // 4
                    msg_height = len(msg) // msg_width
                    start = (self.game_window_height - msg_height) // 2
                    for i in range(0, len(msg), msg_width):
                        self.game_window.addstr(start + i // msg_width, (self.game_window_width - msg_width )// 2, msg[i:i + msg_width])

                    # self.game_window.addstr(4, 2, msg)
                    self.game_window.border()
                    self.show_message("Press any key to continue...")
                    self.game_window.nodelay(0)
                    self.game_window.getch()
                    self.game_window.clear()
                    self.game_window.border()
                    self.game_window.nodelay(1)
                    self.status_window.clear()
                    self.status_window.refresh()
                    self.score_window.clear()
                    # self.show_message("Use 'W' and 'S' to move paddles, 'Q' to quit.")

    def run(self):
        try:
            # Initialize curses
            self.stdscr = curses.initscr()
            # self.terminal_height, self.terminal_width = self.stdscr.getmaxyx()
            # if self.terminal_height < self.min_height or self.terminal_width < self.min_width:
            #     self.terminal_height = self.min_height
            #     self.terminal_width = self.min_width
            # if self.terminal_height > self.max_height or self.terminal_width > self.max_width:
            #     self.terminal_height = self.max_height
            #     self.terminal_width = self.max_width
            # #print(self.terminal_height, self.terminal_width)
            # Set up windows
            self.init_windows()
            # #print(self.terminal_height, self.terminal_width)

            # Main game loop
            while True:
                # #print("test")
                # self.game_window.clear()
                # Show menu
                if not self.main_menu():
                    break

                # Start the game
                # self.game_window.clear()
                # self.game_window.refresh()
                # self.score_window.clear()
                # self.score_width.refresh()
                # self.status_window.clear()
                # self.status_window.refresh()
                asyncio.run(self.connect_to_websocket())
                # asyncio.wait_for(self.connect_to_websocket())
                # exit(0)

        except Exception as e:
            # Ensure we can see the error
            curses.endwin()
            # with open("logs.txt", "w") as f:
            #     f.write(str(e))
            # #print(f"Fatal error: {str(e)}")
        finally:
            # Clean up
            curses.endwin()

def main():
    # Set up signal handlers
    # load_dotenv()
    try:
        signal.signal(signal.SIGINT, lambda sig, frame: (curses.endwin(), sys.exit(0)))
        signal.signal(signal.SIGWINCH,lambda sig, frame: ())
    # #print(f"ncurses version: {curses.ncurses_version}")
    # return
    # Start the game
    
        game = CursesPong()
    # #print("Starting game...")
        game.run()
    except Exception as e:
        # with open("logs.txt", "w") as f:
        #     f.write(str(e))
        return

if __name__ == "__main__":
    main()
# import os
# import sys
# import time
# import random
# import select
# import tty
# import termios
# import json
# import asyncio
# import websockets
# import requests
# import signal
# from websockets.protocol import State
# # Game state settings
# ping_pong = {}
# game_settings = {}
# ready = False
# # Constants for game and terminal size
# TERM_WIDTH = 80
# TERM_HEIGHT = 22
# last_move = ""
# # Function to draw the game state
# async def draw_game_state(game_state):
#     width = game_settings['width']
#     height = game_settings['height']
#     paddle1_y = game_state['player1_y']
#     paddle2_y = game_state['player2_y']
#     ball_x = game_state['ball_x']
#     ball_y = game_state['ball_y']
#     ball_radius = game_settings['ball_radius']
#     paddle_width = game_settings['paddle_width']
#     paddle_height = game_settings['paddle_height']

#     # Scale the coordinates to terminal size
#     scale_x = TERM_WIDTH / width
#     scale_y = TERM_HEIGHT / height

#     # Convert game coordinates to terminal coordinates
#     term_ball_x = int(round(ball_x * scale_x))
#     term_ball_y = int(round(ball_y * scale_y))
#     term_paddle1_y = int(round(paddle1_y * scale_y))
#     term_paddle2_y = int(round(paddle2_y * scale_y))
#     term_paddle_height = int(round(paddle_height * scale_y))  # Minimum height of )3

#     # Create the game board
#     board = [[' ' for _ in range(TERM_WIDTH)] for _ in range(TERM_HEIGHT )]

#     # Draw paddles
#     paddle_half_height = term_paddle_height
#     for i in range(0, paddle_half_height):
#         # Left paddle
#         if 0 <= term_paddle1_y + i < TERM_HEIGHT:
#             board[term_paddle1_y + i][1] = '│'
#         # Right paddle
#         if 0 <= term_paddle2_y + i < TERM_HEIGHT:
#             board[term_paddle2_y + i][TERM_WIDTH - 1] = '│'

#     # Draw ball
#     if 0 <= term_ball_y < TERM_HEIGHT and 0 <= term_ball_x < TERM_WIDTH:
#         board[term_ball_y][term_ball_x] = '●'

#     # Draw scores
#     score_text = f"Player 1: {game_state['player1_score']} | Player 2: {game_state['player2_score']}"
#     score_pos = (TERM_WIDTH - len(score_text)) // 2

#     # Draw borders
#     board = [['-'] * (TERM_WIDTH + 2)] + board + [['-'] * (TERM_WIDTH + 2)]
#     # for i in range(TERM_WIDTH):
#     #     board[TERM_HEIGHT][i] = '─'
#     #     board[0][i] = '─'
#     for i in range(1, TERM_HEIGHT + 1):
#         board[i] = ['│'] + board[i] + ['│']
#     for i, char in enumerate(score_text):
#         if score_pos + i < TERM_WIDTH:
#             board[0][score_pos + i] = char

#     # Draw center line
#     for i in range(1, TERM_HEIGHT, 2):
#         board[i][TERM_WIDTH//2] = '┆'

#     # Clear screen and #print the board
#     #print("\033[H\033[J", end='')

#     #print('\n'.join(''.join(row) for row in board))
#     #print("\nControls: 'W' = Up, 'S' = Down, 'Q' = Quit")

# # Function to reset terminal input
# def reset_input(fd, old_settings):
#     termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

# # Signal handler for graceful exit
# def signal_handler(sig, frame):
#     #print("\nExiting gracefully...")
#     sys.exit(0)

# # Set up signal handler for Ctrl+C
# signal.signal(signal.SIGINT, signal_handler)

# # Get key press from terminal
# def get_key():
#     """Get a single keypress from the terminal."""
#     fd = sys.stdin.fileno()
#     old_settings = termios.tcgetattr(fd)
#     tty.setraw(fd)
#     try:
#         # Wait for the keypress with non-blocking select
#         t = select.select([sys.stdin], [], [], 0.1)[0]
#         if t:
#             # bytes_available = os.read(fd, 4096)  # Read up to 4096 bytes or less
#             # key = bytes_available.decode('utf-8')  # Decode to string
#             key = sys.stdin.read(1)
#             # #print("key: ", key)
#             return key
#         else:
#             return ''
#     except Exception as e:
#         #print(f"Error: {e}")
#     finally:
#         termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
#     return ''

# # Input loop for handling key presses
# async def input_loop(websocket):

#     global ready, last_move
#     # f = 0
#     """Handle keyboard input and send commands to the websocket."""
#     while True:
#         # if ready:
#         #     #print('tkays')
#         #     return
#         key = get_key().lower()
#         # #print("key: ", key)
#         message = None
#         if key == 'q':
#             os._exit(0)
#         if key == 'w':
#             if (last_move != 'w'):
#                 message = {'move': 'up','type':'paddle_move'}
#                 last_move = 'w'
#         elif key == 's':
#             if (last_move != 's'):
#                 message = {'move': 'down','type':'paddle_move'}
#                 last_move = 's'
#         else:
#             if (last_move == 'w' or last_move == 's'):
#                 # if (f == 3):
#                 message = {'move': 'stop','type':'paddle_move'}
#                 last_move = ''
#                 #     f = 0
#                 # f = 1 + f
#             # #print("\nGame terminated by user.")
#             # os._exit(0)
#         if message and ready:
#             await websocket.send(json.dumps(message))
#         await asyncio.sleep(0.001)

# # WebSocket connection and game loop
# async def connect_to_websocket(access_token):
#     global ready
#     url = "ws://localhost:8000/ws/ping_pong/"
#     player1 = player2 = player_type = ""

#     try:
#         headers = {
#             "authorization": f"bearer {access_token}"
#         }
#         async with websockets.connect(url, additional_headers=headers) as websocket:
#             #print("Connection established!")

#             # Start input handling in a separate task

#             asyncio.create_task(input_loop(websocket))
#             # Receive game state and render it
#             while True:
#                 try:
#                     if websocket.state == State.CLOSED:
#                         #print("Connection closed.")
#                         break
#                     # elif websocket.state == State.CLOSING:
#                     #     #print("Connection closing.")
#                     #     break
#                     response = await websocket.recv()
#                     data = json.loads(response)
#                     if 'type' in data:
#                         if data['type'] == 'info':
#                             #print(data['message'])
#                         elif data['type'] == 'game_init':
#                             ready = True
#                             player1 = data['player1']
#                             player2 = data['player2']
#                             player_type = data['player']
#                             global game_settings
#                             game_settings = data['game_settings']
#                             #print(f"You are {player_type}, playing against {player1 if player_type == 'player1' else player2}")
#                             #print("Game settings:", game_settings)
#                         elif data['type'] == 'game_state':
#                             ping_pong = data['game_state']
#                             await draw_game_state(ping_pong)
#                         elif data['type'] == 'game_end':
#                             #print("game end")
#                             # time.sleep(10)
#                             ready = False
#                             break
#                 except Exception as e:
#                     #print(f"Error receiving data: {e}")
#                     break
#     except Exception as e:
#         #print(f"An error occurred: {e}")

# # Login and authentication
# def login_and_run():
#     email = "abc@gmail.com"
#     password = "abc@gmail.com"
#     url = "http://localhost:8000/api/login"
#     data = {"email": email, "password": password}

#     try:
#         response = requests.post(url, json=data)
#         if response.status_code == 200:
#             access_token = response.json()['data']['access']
#             #print("Login successful! Connecting to WebSocket...")
#             asyncio.run(connect_to_websocket(access_token))
#         else:
#             #print(f"Login failed with status code: {response.status_code}")
#     except requests.exceptions.RequestException as e:
#         #print(f"An error occurred during login: {e}")

# if __name__ == "__main__":
#     login_and_run()
