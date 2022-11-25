# 0 Arthur's loyal servant
# 1 Merlin
# 2 Percival
# 3 Mordred
# 4 Morgana
# 5 Assassin
# 6 Oberon
# 7 Minion of Mordred

import datetime
import random

MISSION_LIST = [
    [],
    [1, 1, 2, 1, 1],
    [1, 1, 2, 1, 1],
    [1, 1, 2, 1, 1],
    [1, 1, 2, 2, 2],
    [2, 3, 2, 3, 3],
    [2, 3, 4, 3, 4],
    [2, 3, 3, 4, 4],
    [3, 4, 4, 5, 5],
    [3, 4, 4, 5, 5]]

# 5-10
ROLE_LIST = [
    [],
    [1],
    [1, 5],
    [1, 5, 3],
    [1, 2, 4, 5],
    [1, 2, 0, 4, 5],
    [1, 2, 0, 0, 4, 5],
    [1, 2, 0, 0, 4, 5, 6],
    [1, 2, 0, 0, 0, 4, 5, 7],
    [1, 2, 0, 0, 0, 0, 4, 5, 3],
    [1, 2, 0, 0, 0, 0, 4, 5, 3, 6]]


class avalon:
    def __init__(self):
        self.last_action_time = datetime.datetime.now()

        self.players = []

        self.players_ready = []
        self.player_roles = {}
        self.missions = []
        self.play_turn = 0
        self.team_leader = ""
        self.leader_index = 0
        self.game_state = 0
        self.pre_team_members = []
        self.team_members = []

        self.voted_players = []
        self.vote_yes = 0
        self.vote_no = 0
        self.valid_votes = []

        self.veto_count = 0
        self.fail_mission = 0
        self.success_mission = 0

        self.started = False

    def add_player(self, name):
        self.players.append(name)
        self.last_action_time = datetime.datetime.now()

    def assign_role(self):
        random.shuffle(self.players)
        num = len(self.players)
        roles = ROLE_LIST[num]
        random.shuffle(roles)
        self.last_action_time = datetime.datetime.now()
        for i in range(len(self.players)):
            self.player_roles[self.players[i]] = roles[i]

    def start_able(self):
        self.last_action_time = datetime.datetime.now()
        if len(self.players) == len(self.players_ready):
            return True
        return False

    def play(self):
        self.last_action_time = datetime.datetime.now()
        self.started = True
        self.missions = MISSION_LIST[len(self.players)]
        self.play_turn = 1
        self.team_leader = self.players[self.leader_index]

    def begin_voting(self, valid_votes):
        self.last_action_time = datetime.datetime.now()
        self.voted_players = []
        self.vote_yes = 0
        self.vote_no = 0
        self.valid_votes = valid_votes

    def vote(self, name, vote):
        self.last_action_time = datetime.datetime.now()
        if name in self.valid_votes and name not in self.voted_players:
            if vote == 0:
                self.vote_no += 1
            else:
                self.vote_yes += 1
            self.voted_players.append(name)

    def is_vote_finished(self):
        self.last_action_time = datetime.datetime.now()
        if len(self.voted_players) == len(self.valid_votes):
            return True
        return False

    def assign_leader(self):
        self.last_action_time = datetime.datetime.now()
        self.team_members = []
        self.pre_team_members = []
        self.leader_index += 1
        self.leader_index = self.leader_index % len(self.players)
        self.team_leader = self.players[self.leader_index]
        return self.team_leader
