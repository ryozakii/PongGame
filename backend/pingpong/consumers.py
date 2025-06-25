from acounts.models import Games
from queue import Queue
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncJsonWebsocketConsumer
import time
from acounts.models import UserAccount
from acounts.serializers import UserSerializer
import random
import math
from enum import Enum
import asyncio
import json
    
class UniqueQueue(object):
    def __init__(self):
        self.queue = []  
        self.set = set() 
        self.state = 3

    def add(self, channel_name, username, user):
        """Add a new user to the queue, maintaining XP order"""
        if username not in self.set:
            new_element = {
                "channel_name": channel_name,
                "username": username,
                "user": user,
                "xp": user.xp
            }
            
            self.queue.append(new_element)
            self.set.add(username)
            return True
        return False

    def pop(self,username):
        element = None 
        if (len(self.queue) < 2):
            return None,None
        for (i,element) in enumerate(self.queue):
            if element["username"] == username:
                element = self.queue.pop(i)
                self.set.remove(username)
                break
        if element == None:
            return None,None
        min_range = 2147483647
        index = -1
        for (i,users) in enumerate(self.queue):
            if abs(element["xp"] - users["xp"]) < min_range:
                min_range = abs(element["xp"] - users["xp"])
                index = i
        element1 = None
        if index != -1 :
            element1 = self.queue.pop(index)
            self.set.remove(element1["username"])
        if element != None and element["username"] == element1["username"]:
            self.add(element)
            self.add(element1)
        return element,element1
                
        
    def has(self, username):
        """Check if a username exists in the queue"""
        return username in self.set

    def size(self):
        """Return the number of players in the queue"""
        return len(self.queue)

    def remove(self, username):
        """Remove a player by username and return new queue size"""
        if username in self.set:
            self.set.remove(username)
            self.queue = [x for x in self.queue if x["username"] != username]
        return len(self.queue)

class SimpleQueue(object):
    def __init__(self):
        self.queue = []  
        self.set = set() 

    def add(self, channel_name, username, user):
        """Add a new user to the queue, maintaining XP order"""
        if username not in self.set:
            new_element = {
                "channel_name": channel_name,
                "username": username,
                "user": user,
                "xp": user.xp
            }
            
            self.queue.append(new_element)
            self.set.add(username)
            return True
        return False

    def pop(self):
        if len(self.queue) == 0:
            return None
        element = self.queue.pop()
        self.set.remove(element["username"])
        return element
                
    def pop_user(self,username):
        if len(self.queue) == 0:
            return None
        if username not in self.set:
            return None
        for (i,element) in enumerate(self.queue):
            if element["username"] == username:
                element = self.queue.pop(i)
                self.set.remove(username)
                return element
   
    def has(self, username):
        """Check if a username exists in the queue"""
        return username in self.set

    def size(self):
        """Return the number of players in the queue"""
        return len(self.queue)

    def remove(self, username):
        """Remove a player by username and return new queue size"""
        if username in self.set:
            self.set.remove(username)
            self.queue = [x for x in self.queue if x["username"] != username]
        return len(self.queue)

lock = asyncio.Lock()
class Matchmaking(AsyncJsonWebsocketConsumer):
    queue = UniqueQueue()
    rooms = {}
    rr = {}
    async def connect(self):
        self.state = 3
        self.user = self.scope.get("user")
        self.game_id = None
        self.start = False
        self.online = True
        self.room_name = None
        
        
        
        
        if b"sec-websocket-protocol" in dict(self.scope.get("headers", {})):
            await self.accept(subprotocol="json")
        else:
            await self.accept()
        if 'room_name' in self.scope['url_route']['kwargs']:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            if (self.room_name and self.room_name in Matchmaking.rr and Matchmaking.rr[self.room_name] == True):
                await self.close(3500)
                return
            await self.matchmaking1v1()
            return
        asyncio.create_task(self.matchmaking())


    async def matchmaking1v1(self):
        
        rooms = Matchmaking.rooms
        if (not self.room_name in rooms):
            rooms[self.room_name] = SimpleQueue()
            rooms[self.room_name].add(self.channel_name, self.user.username,  self.user)
        else:
            if (not rooms[self.room_name].add(self.channel_name, self.user.username,  self.user)):
                await self.close(3500)
                return
        if (rooms[self.room_name].size() == 2):
            p1 = rooms[self.room_name].pop()
            p2 = rooms[self.room_name].pop()
            Matchmaking.rr[self.room_name] = True
            await self.initialize_game(p1,p2)
            
    async def ping(self, event):
        
        await self.channel_layer.send(event["channel_name"], {'type' : 'pong'})
        
    async def pong(self, event):
        
        self.start = True

    async def waiting(self, p1,p2):
        x = 0
        while (not self.start):
            await asyncio.sleep(1)
            x += 1
            if (x == 10):
                
                return await self.matchmaking()
        await self.initialize_game(p1, p2)
        self.start = False
        
    async def matchmaking(self):
        async with lock:
            if (not Matchmaking.queue.add(self.channel_name, self.user.username,self.user)):
                
                await self.send_json({"type": "error", "message": "You are already in the queue"})
                await self.close(3500)
                return
            # await asyncio.sleep(2)
            if (not self.online):
                return
            if ((Matchmaking.queue.size()) >= 2):
                p1,p2 = Matchmaking.queue.pop(self.user.username)
                if (p1 == None or p2 == None):
                    self.start = False
                    if p1:
                        Matchmaking.queue.add(p1["channel_name"], p1["username"],p1["user"])
                    if p2:
                        Matchmaking.queue.add(p2["channel_name"], p2["username"],p2["user"])
                    return
                # await self.channel_layer.send(p2["channel_name"], {"type": "ping","channel_name" : self.channel_name})
                await self.initialize_game(p1, p2)
                # asyncio.create_task(self.waiting(p1,p2))
            else:
                await self.send_json({"type": "info", "message": "You are in the queue. Please wait for another player to join."})
            
    async def initialize_game(self, player1, player2):
        gameRef = await sync_to_async(Games.objects.create)(player1 = player1['user'], player2 = player2['user'], winner = None, pong = True)
        game_id = str(gameRef.id) + str(time.time())
        
        await self.channel_layer.group_add(game_id, player1["channel_name"])
        await self.channel_layer.group_add(game_id, player2["channel_name"])
        await self.channel_layer.group_send(game_id, {"type": "start.game", "game_id": game_id, 'player1' : player1, 'player2' : player2, 'game' : gameRef})


class PingPongGame:
    def __init__(self, width=800, height=600):
        self.width = width
        self.height = height
        self.ball_radius = 10
        self.paddle_width = 10
        self.paddle_height = 100
        self.player_speed = 5
        
        self.ball_x = width / 2
        self.ball_y = height / 2
        self.ball_speed_x = random.choice([-4,4])
        self.ball_speed_y = random.uniform(-5,5) 
        
        self.player1_y = self.height / 2 - self.paddle_height / 2
        self.player2_y = self.height / 2 - self.paddle_height / 2
        self.player1_y_up = False
        self.player1_y_down = False
        self.player2_y_up = False
        self.player2_y_down = False
        
        
        self.player1_score = 0
        self.player2_score = 0
    def game_settings(self):
        return {
            'width': self.width,
            'height': self.height,
            'ball_radius': self.ball_radius,
            'paddle_width': self.paddle_width,
            'paddle_height': self.paddle_height,
        }
    def move_ball(self):
        self.ball_x += self.ball_speed_x
        self.ball_y += self.ball_speed_y
        if (self.ball_y - self.ball_radius - 1<= 0):
            self.ball_speed_y = abs(self.ball_speed_y) 
        if (self.ball_y + self.ball_radius + 1>= self.height):
            self.ball_speed_y = -abs(self.ball_speed_y)

        if self.player1_y_up:
            self.player1_y -= self.player_speed
        if self.player1_y_down:
            self.player1_y += self.player_speed
        if self.player2_y_up:
            self.player2_y -= self.player_speed
        if self.player2_y_down:
            self.player2_y += self.player_speed
        
        self.player1_y = max(min(self.player1_y, self.height - self.paddle_height), 0)
        self.player2_y = max(min(self.player2_y, self.height - self.paddle_height), 0)
        
        if self.ball_x - self.ball_radius <= -10:
            self.player2_score += 1
            self._reset_ball()
        elif self.ball_x + self.ball_radius >= self.width +10 :
            self.player1_score += 1
            self._reset_ball()

    def check_paddle_collision(self, player1_y, player2_y):
        
        self.player1_y= player1_y
        self.player2_y = player2_y

        
        if (self.ball_x - self.ball_radius <= self.paddle_width and
            self.player1_y  -10 <= self.ball_y  <= self.player1_y + self.paddle_height +10):
                self._bounce_off_paddle(1)

        
        if (self.ball_x + self.ball_radius >= self.width - self.paddle_width and
            self.player2_y -10 <= self.ball_y  <= self.player2_y + self.paddle_height +10):
                self._bounce_off_paddle(0)
                
    def _bounce_off_paddle(self,direction):
        
        self.ball_speed_x = abs(self.ball_speed_x) if direction else -abs(self.ball_speed_x) 
        self.ball_speed_x += 1 if  self.ball_speed_x  > 0 else -1
        if (self.ball_speed_x > 0):
            self.ball_speed_x = min(self.ball_speed_x, 20)
        else:
            self.ball_speed_x = max(self.ball_speed_x, -20)
        self.player_speed += 0.5
        if self.player_speed > 10:
            self.player_speed = 10
        self.ball_speed_y = random.uniform(-3,3) 

    def _reset_ball(self):
        
        self.ball_x = self.width / 2
        self.ball_y = self.height / 2
        self.ball_speed_x = random.choice([-4,4])
        self.ball_speed_y = random.uniform(-5,5)
        self.player_speed = 5
        self.player1_y = self.height / 2 - self.paddle_height / 2
        self.player2_y = self.height / 2 - self.paddle_height / 2

    def get_game_state(self):
        return {
            'ball_x': round(self.ball_x),
            'ball_y': round(self.ball_y),
            'player1_y': round(self.player1_y),
            'player2_y': round(self.player2_y),
            'player1_score': self.player1_score,
            'player2_score': self.player2_score,
            'state' : 1,
        }

class PingPong1v1Consumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        
        if b"sec-websocket-protocol" in dict(self.scope.get("headers", {})):
            await self.accept(subprotocol="json")
        else:
            await self.accept()

class PingPongConsumer(Matchmaking):
    game = {}
    async def start_game(self, event):
        self.player_type = 'player1' if event['player1']['username'] == self.scope.get("user").username else 'player2'
        self.game_id = event["game_id"]
        if PingPongConsumer.game.get(self.game_id) == None:
            PingPongConsumer.game[self.game_id] = PingPongGame()
            self.task = asyncio.create_task(self.start_timer())
        player1 = event['player1']['user'] if event['player1']['username'] == self.scope.get("user").username else event['player2']['user']
        player2 = event['player2']['user'] if event['player1']['username'] == self.scope.get("user").username else event['player1']['user']
        self.player1 = event['player1']['user']
        self.player2 = event['player2']['user']
        self.gameRef = event['game']
        player1 = await sync_to_async(lambda: UserSerializer(player1).data)()
        player2 = await sync_to_async(lambda: UserSerializer(player2).data)()
        self.state = 1
        data = {'type': 'game_init', 'player': self.player_type, 'game_state': PingPongConsumer.game[self.game_id].get_game_state(), 'player1' : player1, 'player2' : player2, 'state' : 1,'game_settings': PingPongConsumer.game[self.game_id].game_settings()}
        await self.send_json(data)
        

    async def disconnect(self, close_code):
        self.online = False
        if (close_code == 3500):
            return
        if self.room_name:
            Matchmaking.rr[self.room_name] = False
            if self.room_name in Matchmaking.rooms:
                del Matchmaking.rooms[self.room_name]
        if PingPongConsumer.queue.has(self.scope.get("user").username):
            PingPongConsumer.queue.remove(self.scope.get("user").username)
        if self.game_id:
            game_state = PingPongConsumer.game[self.game_id].get_game_state()
            game_state['state'] = 2
            winner  = 'player1' if self.player_type == 'player2' else 'player2'
            await self.channel_layer.group_send(self.game_id, {"type": "end.game", 'winner' : winner, 'game_state' : game_state})
            return

    async def start_timer(self):
        while True:
            await asyncio.sleep(1 / 60)  
            if self.state == 1:
                PingPongConsumer.game[self.game_id].move_ball()
                PingPongConsumer.game[self.game_id].check_paddle_collision(
                    PingPongConsumer.game[self.game_id].player1_y, 
                    PingPongConsumer.game[self.game_id].player2_y
                )
                await self.channel_layer.group_send(
                    self.game_id,
                    {
                        'type': 'game_update',
                    }
                )

    async def receive(self, text_data):
        try:
            p = json.loads(text_data.strip())
            await self.receive_json(p)
        except json.JSONDecodeError:
            data = {'type':'error', 'message': 'invalid format'}
            await self.send_json(data)
            return

    async def receive_json(self, text_data):
        data = text_data
        if not 'type' in data:
            return 
        if data['type'] == 'paddle_move':
            if self.state != 1:
                return
            if not 'move' in data:
                return
            if data['move'] not in ['up', 'down', 'stop']:
                return
            if self.player_type == 'player1':
                if (data['move'] == 'up'):
                    PingPongConsumer.game[self.game_id].player1_y_up = True
                    PingPongConsumer.game[self.game_id].player1_y_down = False
                elif (data['move'] == 'down'):
                    PingPongConsumer.game[self.game_id].player1_y_down = True
                    PingPongConsumer.game[self.game_id].player1_y_up = False
                    
                elif (data['move'] == 'stop'):
                    PingPongConsumer.game[self.game_id].player1_y_up = False
                    PingPongConsumer.game[self.game_id].player1_y_down = False

            elif  self.player_type == 'player2':
                if (data['move'] == 'up'):
                    PingPongConsumer.game[self.game_id].player2_y_up = True
                    PingPongConsumer.game[self.game_id].player2_y_down = False
                    
                elif (data['move'] == 'down'):
                    PingPongConsumer.game[self.game_id].player2_y_down = True
                    PingPongConsumer.game[self.game_id].player2_y_up = False
                    
                elif (data['move'] == 'stop'):
                    PingPongConsumer.game[self.game_id].player2_y_up = False
                    PingPongConsumer.game[self.game_id].player2_y_down = False
                    

    async def game_update(self, event):
        if (self.state == 2):
            return
        game_state = PingPongConsumer.game[self.game_id].get_game_state()
        if (game_state['player1_score'] >= 11 or game_state['player2_score'] >= 11):
            if (abs(game_state['player1_score'] - game_state['player2_score']) >= 2):
                self.state = 2
                game_state['state'] = 2
                winner  = 'player1' if game_state['player1_score'] > game_state['player2_score'] else 'player2'
                await self.channel_layer.group_send(self.game_id, {"type": "end.game", 'winner' : winner})
                return

        await self.send_json({
            'type': 'game_state',
            'game_state': PingPongConsumer.game[self.game_id].get_game_state()
        })



    async def end_game(self, event):
        
        if hasattr(self, 'task') and self.task:
            self.task.cancel()
        if self.gameRef.winner == None:
            
            
            self.player1.is_uptodate = False
            self.player2.is_uptodate = False
            await sync_to_async(self.player1.save)()
            await sync_to_async(self.player2.save)()
            self.gameRef.score = str(PingPongConsumer.game[self.game_id].player1_score) + "-" + str(PingPongConsumer.game[self.game_id].player2_score)
            self.gameRef.winner = self.player1 if event['winner'] == 'player1' else self.player2
            await sync_to_async(self.gameRef.save)()
        game_state = PingPongConsumer.game[self.game_id].get_game_state()
        game_state['state'] = 2
        self.state = 2
        data = {"type" : "game_end", "winner" : event['winner'], "game_state" : game_state}
        try:
            await self.send_json(data)
            await self.close(3500)
        except:
            
            return

