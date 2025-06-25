
import json

from channels.generic.websocket import WebsocketConsumer

from channels.generic.websocket import AsyncJsonWebsocketConsumer
import pprint
from django.core.cache import cache
import random
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from asgiref.sync import sync_to_async
import asyncio
from queue import Queue
from acounts.models import Games
from enum import Enum
from acounts.serializers import UserSerializer
channel_layer = get_channel_layer()
import time
from acounts.models import Games
from django.shortcuts import get_object_or_404
lock = asyncio.Lock()
winningCombinations = [
    {'combo':[0,1,2]},
    {'combo':[3,4,5]},
    {'combo':[6,7,8]},
    {'combo':[0,3,6]},
    {'combo':[1,4,7]},
    {'combo':[2,5,8]},
    {'combo':[0,4,8]},
    {'combo':[2,4,6]},
]

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

class Matchmaking(AsyncJsonWebsocketConsumer):
    queue = UniqueQueue()
    rooms = {}
    rr = {}
    async def connect(self):
        self.state = 3
        self.user = self.scope.get("user")
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
        
        
    async def matchmaking(self):
        
        async with lock:
            self.start = False
            if (not Matchmaking.queue.add(self.channel_name, self.user.username,self.user)):
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
    async def waiting(self, p1,p2):
        x = 0
        while (not self.start):
            await asyncio.sleep(1)
            x += 1
            if (x == 10):
                
                return await self.matchmaking()
        await self.initialize_game(p1, p2)
        self.start = False
    async def pong(self, event):
        
        self.start = True

    async def initialize_game(self, player1, player2):
        gameRef = await sync_to_async(Games.objects.create)(player1 = player1['user'], player2 = player2['user'], winner = None, pong = False)
        game_id = str(gameRef.id) + str(time.time())
        await self.channel_layer.group_add(game_id, player1["channel_name"])
        await self.channel_layer.group_add(game_id, player2["channel_name"])
        await self.channel_layer.group_send(game_id, {"type": "start.game", "game_id": game_id, 'player1' : player1, 'player2' : player2, 'game' : gameRef})

class TicTacConsumer( Matchmaking):
    tables = {}
    times = {}
                
    async def start_game(self, event):
        
        self.game_id = event["game_id"]
        self.turn = True if event["player1"]["username"] == self.scope.get("user").username else False
        self.logo = "X" if self.turn else "O"
        self.state = 1
        if TicTacConsumer.tables.get(self.game_id) == None:
            TicTacConsumer.tables[self.game_id] = [''] * 9
        player1 = event['player1']['user'] if event['player1']['username'] == self.scope.get("user").username else event['player2']['user']
        player2 = event['player2']['user'] if event['player1']['username'] == self.scope.get("user").username else event['player1']['user']
        self.player1 = event['player1']['user']
        self.player2 = event['player2']['user']
        self.gameRef = event['game']
        
        player1 = await sync_to_async(lambda: UserSerializer(player1).data)()
        player2 = await sync_to_async(lambda: UserSerializer(player2).data)()
        
        data = {"type" : "start","turn": self.turn, "logo" : self.logo,'player1' : player1, 'player2' : player2, 'state' : 1}
        await self.send_json(data)
        if self.turn:
            TicTacConsumer.times[self.game_id] = time.time() 
            asyncio.create_task(self.start_timer())
    

    async def start_timer(self):
        await asyncio.sleep(11)  
        if time.time() - TicTacConsumer.times[self.game_id] > 10 and self.turn:
            await self.channel_layer.group_send(self.game_id, {"type": "end.game", 'winner' : 'X' if self.logo == 'O' else 'O', "combo" : ''})

    async def check_winner(self):
        table = TicTacConsumer.tables[self.game_id]

        for combination in winningCombinations:
            if table[combination['combo'][0]] == table[combination['combo'][1]] == table[combination['combo'][2]] != '':
                self.state = 2
                return combination['combo']
        self.state = 2 if all(block != "" for block in table) else 1
        return "draw"
    
    async def receive(self, text_data):
        try:
            p = json.loads(text_data.strip())
            await self.receive_json(p)
        except json.JSONDecodeError:
            
            data = {'type':'error', 'message': 'invalid format'}
            await self.send_json(data)
            return
    
    async def receive_json(self, text_data):
        

        if self.state != 1:
            
            return
        if not self.turn:
            
            return
        TicTacConsumer.times[self.game_id] = time.time()
        asyncio.create_task(self.start_timer())
        if not "index" in text_data or not 0 <= text_data["index"] < 9:
            
            return
        table = TicTacConsumer.tables[self.game_id]
        if table[text_data["index"]] != '': 
            
            return
        table[text_data["index"]] = self.logo
        
        e = await self.check_winner()
        if self.state == 1:
            await self.channel_layer.group_send(self.game_id, {"type": "update.table"})
        else:
            if (e == "draw"):
                await self.channel_layer.group_send(self.game_id, {"type": "end.game", "winner": 'draw', "combo" : ''})
            else:
                await self.channel_layer.group_send(self.game_id, {"type": "end.game", "winner": self.logo, "combo" : e})

    async def end_game(self, event):
        
        if self.gameRef.winner == None:
            self.player1.is_uptodate = False
            self.player2.is_uptodate = False
            await sync_to_async(self.player1.save)()
            await sync_to_async(self.player2.save)()
            me = self.scope.get("user")
            opponent = self.player1 if self.player1 != me else self.player2
            self.gameRef.winner = me if event['winner'] == self.logo else opponent if event['winner'] != 'draw' else None
            await sync_to_async(self.gameRef.save)()
        data = {"type" : "end" ,"turn": self.turn , "winner" : event['winner'], "table" : TicTacConsumer.tables[self.game_id], "combo" : event["combo"]}
        try:
            await self.send_json(data)
            await self.close(3500)
        except:
            
            return
        
    async def update_table(self, event):
        
        self.turn = not self.turn
        if self.turn:
            asyncio.create_task(self.start_timer())
            
        
        
        data = {"type" : "play", "turn": self.turn, "table" : TicTacConsumer.tables[self.game_id]}
        await self.send_json(data)

    async def disconnect(self, close_code):
        
        if (close_code == 3500):
            return
        self.online = False
        if self.room_name:
            Matchmaking.rr[self.room_name] = False
            if self.room_name in Matchmaking.rooms:
                del Matchmaking.rooms[self.room_name]
        if TicTacConsumer.queue.has(self.scope.get("user").username):
            
            TicTacConsumer.queue.remove(self.scope.get("user").username)
        if self.game_id:
            await self.channel_layer.group_discard(self.game_id, self.channel_name)
            await self.channel_layer.group_send(self.game_id, {"type": "end.game", 'winner' : 'X' if self.logo == 'O' else 'O', "combo" : ''})
