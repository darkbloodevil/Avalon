#!/usr/bin/env python

import asyncio
import json
import secrets

import websockets

from avalon import avalon

JOIN = {}

WATCH = {}


async def error(websocket, message):
    """
    Send an error message.

    """
    event = {
        "type": "error",
        "message": message,
    }
    await websocket.send(json.dumps(event))


def broadcast(message, join_key):
    game, connected = JOIN[join_key]
    websockets.broadcast([connected[i] for i in game.players], message)
    # game, connected = JOIN[join_key]
    # print(connected)
    # try:
    #     await asyncio.wait([connected[i].send(message) for i in game.players])
    # except websockets.ConnectionClosedOK as e:
    #     print("broadcast ",e)


async def start(websocket, user_id):
    """
    Handle a connection from the first player: start a new game.

    """
    # Initialize a Connect Four game, the set of WebSocket connections
    # receiving moves from this game, and secret access tokens.
    print("---handling start---\n from ---", user_id)
    game = avalon()
    connected = {user_id: websocket}

    join_key = secrets.token_urlsafe(2)
    JOIN[join_key] = game, connected

    watch_key = secrets.token_urlsafe(2)
    WATCH[watch_key] = game, connected

    if user_id in game.players:
        return
    game.add_player(user_id)

    try:
        # Send the secret access tokens to the browser of the first player,
        # where they'll be used for building "join_key" and "watch" links.
        event = {
            "type": "key",
            "join_key": join_key,
            "watch": watch_key,
        }
        await websocket.send(json.dumps(event))
        event = {
            "type": "players",
            "player_list": game.players,
            "join_key": join_key,
        }
        broadcast(json.dumps(event), join_key)
    finally:
        pass
        # del JOIN[join_key]
        # del WATCH[watch_key]


async def join(websocket, join_key, user_id):
    """
    Handle a connection from the second player: join an existing game.

    """
    # Find the Connect Four game.
    try:
        game, connected = JOIN[join_key]
        if user_id in game.players:
            return
        game.add_player(user_id)
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected[user_id] = websocket
    try:
        event = {
            "type": "key",
            "join_key": join_key,
        }
        await websocket.send(json.dumps(event))
        event = {
            "type": "players",
            "player_list": game.players,
            "join_key": join_key,
        }
        broadcast(json.dumps(event), join_key)
    finally:
        pass
        # connected.remove(websocket)


async def watch(websocket, watch_key):
    """
    Handle a connection from a spectator: watch an existing game.

    """
    # Find the Connect Four game.
    try:
        game, connected = WATCH[watch_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        # Keep the connection open, but don't receive any messages.
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)


async def handler(websocket):
    """
    Handle a connection and dispatch it according to who is connecting.

    """
    async for message in websocket:
        event = json.loads(message)
        # assert event["type"] == "init"

        if event["type"] == "join":
            # Second player joins an existing game.
            await join(websocket, event["join_key"], event["uid"])
        elif event["type"] == "watch":
            # Spectator watches an existing game.
            await watch(websocket, event["watch"])
        elif event["type"] == "new":
            # First player starts a new game.
            await start(websocket, event["uid"])
        elif event["type"] == "ready":
            game, _ = JOIN[event["join_key"]]
            if event["uid"] not in game.players_ready:
                game.players_ready.append(event["uid"])
                event = {
                    "type": "ready_list",
                    "ready_list": game.players_ready,
                    "join_key": event["join_key"],
                }
                broadcast(json.dumps(event), event["join_key"])
            # print(game.players_ready)
        elif event["type"] == "start_game":
            game, _ = JOIN[event["join_key"]]
            if game.start_able():
                game.assign_role()
                game.play()

                event = {
                    "type": "game_start",
                    "join_key": event["join_key"],
                    "player_role": game.player_roles,
                    "play_turn": game.play_turn,
                    "team_leader": game.team_leader,
                    "player_list": game.players,
                    "game_state": game.game_state
                }
                broadcast(json.dumps(event), event["join_key"])

                print("---game\t" + event["join_key"] + "\t---\n" + "roles ")
                for i in game.player_roles.keys():
                    print(i + "\t%d" % game.player_roles[i])
        elif event["type"] == "organize_team":
            game, _ = JOIN[event["join_key"]]
            game.game_state = 1
            game.pre_team_members = event["team_members"]
            game.begin_voting(game.players)
            event = {
                "type": "pre_team",
                "team_members": game.pre_team_members,
                "join_key": event["join_key"],
            }
            broadcast(json.dumps(event), event["join_key"])
        elif event["type"] == "vote":
            game, _ = JOIN[event["join_key"]]
            game.vote(event["uid"], event["vote"])
            if game.is_vote_finished():
                event = {
                    "type": "vote_result",
                    "yes": game.vote_yes,
                    "no": game.vote_no,
                    "join_key": event["join_key"],
                }
                broadcast(json.dumps(event), event["join_key"])
                if game.game_state == 1:
                    if game.vote_yes > game.vote_no:
                        game.game_state = 2
                        game.team_members = game.pre_team_members
                        game.pre_team_members = []
                        game.begin_voting(game.team_members)
                    else:
                        game.veto_count += 1
                        event = {
                            "type": "assign_leader",
                            "uid": game.assign_leader(),
                            "reason": 0,
                            "join_key": event["join_key"],
                        }
                        broadcast(json.dumps(event), event["join_key"])
                        pass
                elif game.game_state == 2:
                    if game.vote_no == 0:
                        game.success_mission += 1
                    else:
                        game.fail_mission += 1
                    if game.success_mission == 3:
                        game.game_state = 3
                    elif game.fail_mission == 3:
                        game.game_state = 4
                    else:
                        game.play_turn += 1
                        event = {
                            "type": "assign_leader",
                            "uid": game.assign_leader(),
                            "reason": 1,
                            "join_key": event["join_key"],
                        }
                        broadcast(json.dumps(event), event["join_key"])
            else:
                event = {
                    "type": "vote_count",
                    "count": len(game.voted_players),
                    "join_key": event["join_key"],
                }
                broadcast(json.dumps(event), event["join_key"])

        elif event["type"] == "kill":
            game, _ = JOIN[event["join_key"]]
            if game.game_state==3:
                event = {
                    "type": "murder",
                    "uid": event["uid"],
                    "join_key": event["join_key"],
                }
                broadcast(json.dumps(event), event["join_key"])
                game.game_state = 4


async def main():
    async with websockets.serve(handler, "", 8765):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
