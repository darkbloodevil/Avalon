'use strict';

let game = {
    join_key: "",
    player_list: [],
    player_ready_state: {},
    player_state: {},
    play_turn: 1,
    success_count: 0,
    fail_count: 0,
    veto_count: 0,
    team_leader: "",
    player_role: {},
    game_state: 0,
    preteam: [],
    team: [],
    missions: [],
    assasin: ""
}

let player_name = "";
let websocket;


const role_list = ["Arthur's loyal servant",
    "Merlin", "Percival", "Mordred", "Morgana", "Assassin", "Oberon", "Minion of Mordred"]

const MISSION_LIST = [
    [1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1],
    [1, 1, 2, 1, 1],
    [1, 1, 2, 1, 1],
    [1, 1, 2, 2, 2],
    [2, 3, 2, 3, 3],
    [2, 3, 4, 3, 4],
    [2, 3, 3, 4, 4],
    [3, 4, 4, 5, 5],
    [3, 4, 4, 5, 5]];

const url = document.querySelector('#url_input');
const uid_input = document.querySelector('#name_input');
const key_input = document.querySelector('#key_input');

const new_btn = document.querySelector('#new_btn');
const join_btn = document.querySelector('#join_btn');

const startbox = document.querySelector('.startbox');

const waiting_key_label = document.querySelector('#waiting_key_label');
const waiting_uid_label = document.querySelector('#waiting_uid_label');
const waiting_room_member_list = document.querySelector('#waiting_room_member_list');

const ready_btn = document.querySelector('#ready_btn');
const start_btn = document.querySelector('#start_btn');

const waitingbox = document.querySelector('.waitingbox');

waitingbox.style.display = "none";

const gaming_member_list = document.querySelector('#gaming_member_list');

const game_choose_teammate_button = document.querySelector('#game_choose_teammate_button');
game_choose_teammate_button.style.display = "none";
const voting_box = document.querySelector('#voting_box');
voting_box.style.display = "none";
const yes_btn = document.querySelector('#yes_button');
const no_btn = document.querySelector('#no_button');
const identity_button = document.querySelector("#identity_button");
const kill_button = document.querySelector("#kill_button");
kill_button.style.display = "none";
const game_state_label = document.querySelector('#game_state_label');
const game_message_list=document.querySelector('#game_messages');

const gamescene = document.querySelector('.gamescene');

gamescene.style.display = "none";



new_btn.addEventListener('click', function () {
    if (url.value.trim() != "") {
        websocket = new WebSocket(url.value.trim());
        websocket.onopen = function (e) {
            // Send an "init" event according to who is connecting.
            if (uid_input.value == "") {
                player_name = random_name();
                //alert("automatically generate a name: " + player_name);
            } else {
                player_name = uid_input.value;
            }
            // game.player_list = [player_name];
            update_waiting_player_list();
            let event = { type: "new", uid: player_name };
            websocket.send(JSON.stringify(event));
            websocket.addEventListener("message", manage_message);
        }


    } else {
        alert("input a valid url ! ");
    }
});
join_btn.addEventListener('click', function () {
    if (url.value.trim() != "") {
        if (key_input.value.trim() != "") {

            websocket = new WebSocket(url.value.trim());
            websocket.onopen = function (e) {
                // Send an "init" event according to who is connecting.
                if (uid_input.value == "") {
                    player_name = random_name();
                    // alert("automatically generate a name: " + player_name);
                } else {
                    player_name = uid_input.value;
                }
                game.join_key = key_input.value;
                //game.player_list = [player_name];

                update_waiting_player_list();
                let event = {
                    type: "join", uid: player_name,
                    join_key: game.join_key
                };
                websocket.send(JSON.stringify(event));
                websocket.addEventListener("message", manage_message);
            }
        } else {
            alert("input a valid key ! ");
        }


    } else {
        alert("input a valid url ! ");
    }
});

ready_btn.addEventListener('click', function () {
    // game.player_ready_state[player_name] = true;
    let event = {
        type: "ready", uid: player_name,
        join_key: game.join_key
    };
    websocket.send(JSON.stringify(event));
    //update_waiting_player_list();
});
start_btn.addEventListener('click', function () {
    let count_readys = 0;
    game.player_list.forEach(element => {
        if (!element in game.player_ready_state) {
            game.player_ready_state[element] = false;
        } else {
            if (game.player_ready_state[element]) {
                count_readys++;
            }
        }
    });
    if (count_readys == game.player_list.length) {
        let event = {
            type: "start_game", uid: player_name,
            join_key: game.join_key
        };
        websocket.send(JSON.stringify(event));
    }
});

game_choose_teammate_button.addEventListener('click', function () {
    if (player_name == game.team_leader) {
        let count = 0;
        let preteam_temp = []
        for (var i = 0; i < gaming_member_list.children.length; i++) {
            let item = gaming_member_list.children[i];
            for (var j = 0; j < item.children.length; j++) {
                let element = item.children[j];
                if (element.type == "checkbox") {
                    if (element.checked) {
                        preteam_temp.push(element.value);
                        count++;
                    }
                }
            }
        }
        if (count == game.missions[game.play_turn]) {
            let event = {
                type: "organize_team",
                uid: player_name,
                join_key: game.join_key,
                team_members: preteam_temp
            };
            websocket.send(JSON.stringify(event));
        } else {
            alert("number not right, " + game.missions[game.play_turn] + " is needed");
        }
    }
});
kill_button.addEventListener('click', function () {
    if (game.player_role[player_name] == 5) {
        let count = 0;
        let target = ""
        for (var i = 0; i < gaming_member_list.children.length; i++) {
            let item = gaming_member_list.children[i];
            for (var j = 0; j < item.children.length; j++) {
                let element = item.children[j];
                if (element.type == "checkbox") {
                    if (element.checked) {
                        target = element.value;
                        count++;
                    }
                }
            }
        }
        if (count == 1) {
            let event = {
                type: "kill",
                uid: target,
                join_key: game.join_key
            };
            websocket.send(JSON.stringify(event));
        } else {
            alert("number not right, " + 1 + " is needed");
        }
    }
});



yes_btn.addEventListener('click', function () {
    voted();
    let event = {
        type: "vote",
        uid: player_name,
        join_key: game.join_key,
        vote: 1
    };
    websocket.send(JSON.stringify(event));
});
no_btn.addEventListener('click', function () {
    voted();
    let event = {
        type: "vote",
        uid: player_name,
        join_key: game.join_key,
        vote: 0
    };
    websocket.send(JSON.stringify(event));
});
identity_button.addEventListener("click", function () {
    let prompt = "";
    let bad_guy_all = "["
    game.player_list.forEach(e => {
        if (game.player_role[e] > 3 && game.player_role[e] != 6) {
            bad_guy_all += e + ", ";
        }
    });
    bad_guy_all += "]";
    switch (game.player_role[player_name]) {
        case 0:
            prompt = "You are a good guy. \nComplete the mission and protect Merlin !";
            break;
        case 1:
            let bad_guy = "["
            game.player_list.forEach(e => {
                if (game.player_role[e] > 4) {
                    bad_guy += e + ", ";
                }
            });
            bad_guy += "]";
            prompt = "You are Merlin, \nyou know " + bad_guy + " are bad guys. \nComplete the mission and protect yourself !";
            break;
        case 2:
            let Merlin = "["
            game.player_list.forEach(e => {
                if (game.player_role[e] == 1 || game.player_role[e] == 3) {
                    Merlin += e + ", ";
                }
            });
            Merlin += "]";
            prompt = "You are Percival, \nyou know Merlin is in " + Merlin + ". \nComplete the mission and protect Merlin !";
            break;
        case 3:
            prompt = "You are Mordred. \n These are your followers " + bad_guy_all + "\n Merlin don't know who you are. Cheat him and destory their plan !";
            break;
        case 4:
            prompt = "You are Morgana. \n These are your colleagues " + bad_guy_all + "\n Percival can't distinguish you and Merlin. Cheat him and destory their plan !";
            break;
        case 5:
            prompt = "You are Assassin. \n These are your colleagues " + bad_guy_all + "\n When the mission almost completes, you can kill Merlin to turn the table !";
            break;
        case 6:
            prompt = "You are Oberon. \nDestroy Arthur's plan !"
            break;
        case 7:
            prompt = "You are a bad guy.\nThese are your colleagues " + bad_guy_all + "\nDestroy Arthur's plan !"
            break;
    }

    alert(prompt);
});

function manage_message(event) {
    let data_json = JSON.parse(event.data);
    switch (data_json.type) {
        case "key":
            game.join_key = data_json.join_key;
            startbox.style.display = "none";
            init_waiting_room();
            break;
        case "players":
            game.player_list = data_json.player_list;
            update_waiting_player_list();
            break;
        case "ready_list":
            data_json.ready_list.forEach(element => {
                game.player_ready_state[element] = true;
            });
            update_waiting_player_list();
            break;
        case "game_start":
            send_message("Game start !","System");
            send_message("I am the leader !",data_json.team_leader);
            waitingbox.style.display = "none";
            game.player_list = data_json.player_list;
            game.player_role = data_json.player_role;
            game.play_turn = data_json.play_turn;
            game.team_leader = data_json.team_leader;
            game.game_state = data_json.game_state;
            game.missions = MISSION_LIST[game.player_list.length];
            send_message("The mission needs "+game.missions[game.play_turn-1]+" to finish !","System");
            init_player_state();
            init_game_scene();
            update_game();
            break;
        case "pre_team":
            game.game_state = 1;
            send_message("Do you agree the team ?",game.team_leader);
            game.preteam = data_json.team_members;
            update_game();
            break;
        case "vote_count":
            send_message(data_json.count+" has voted.","System");
            update_game();
            break;
        case "vote_result":
            if (game.game_state == 2) {
                deal_vote_mission(data_json.yes, data_json.no);
            } else {
                deal_vote_team(data_json.yes, data_json.no);
            }
            voting_finished();
            update_game();
            if (game.game_state != 2 && game.game_state != 3)
                voting_finished();
            break;
        case "assign_leader":
            game.team_leader = data_json.uid
            if (data_json.reason == 0) {
                game.veto_count++;
                send_message("It'still turn "+game.play_turn+". I am the new leader ! "+(5-game.fail_count)+" more veto will result in gameover",data_json.team_leader);
                if(game.veto_count==5){
                    game.game_state=4;
                    alert("Game over! ");
                }
            } else if (data_json.reason == 1) {
                send_message("It's turn "+game.play_turn+" now. I am the new leader !",data_json.team_leader);
            }
            game.game_state = 0;
            update_game();
            break;
        case "murder":
            let prompt = data_json.uid + " is killed ! \n";
            game.game_state = 4;
            if (game.player_role[data_json.uid] == 1) {
                prompt += "He is Merlin. Thus bad guys wins! \n";
            } else {
                prompt += "Merlin survived. Thus good guys wins! \n";
            }
            game.player_list.forEach(e => {
                prompt += e + " is " + role_list[game.player_role[e]] + "\n";
            });
            prompt += "Thanks for playing";
            alert(prompt);
            send_message(prompt,"System");
            break;
    }
}

function init_waiting_room() {
    waitingbox.style.display = "block";
    waiting_key_label.textContent = "key: " + game.join_key;
    waiting_uid_label.textContent = "player: " + player_name;
}
function init_game_scene() {
    gamescene.style.display = "block";
    // game_key_label.textContent = "key: " + game.join_key;
    game_uid_label.textContent = "player: " + player_name;
    init_gaming_player_list();
    update_game_state_label();
    init_mission_label();
}
function init_mission_label(){
    for (let index = 1; index <= 5; index++) {
        let mission_label = document.querySelector('#mission_label_' + index);
        mission_label.textContent=" "+game.missions[index-1];
    }
}

function random_name() {
    const first = ["可怜的", "勇敢的", "精神内耗的", "教师爷般的", "岿( 音kui) 然不动的",
        "如果有诚心咱们就用互相尊重态度的", "须弥教令院的", "正确的中肯的", "三位一体的",
        "社交恐惧症的", "开会开一半被拖走的"];
    const second = ["二舅", "牛马", "实用数学指南", "网络科学导论", "颐指气使",
        "创造条件", "伟大前程", "萨格尔王", "波奇酱", "应用随机过程概率模型导论",
        "三个代表", "科学发展观"];

    return first[Math.floor(Math.random() * first.length)] +
        second[Math.floor(Math.random() * second.length)] + Math.floor(Math.random() * 100);
}

function send_message(message,authur=""){
    let member_item = document.createElement("li");
    const listText = document.createElement('label');
    listText.textContent = "\<em\>"+authur+"\<\/em\> : "+message;
    listText.innerHTML=listText.textContent;
    member_item.appendChild(listText);
    game_message_list.insertBefore(member_item,game_message_list.firstChild);
}

function update_waiting_player_list() {
    while (waiting_room_member_list.firstChild) {
        waiting_room_member_list.removeChild(waiting_room_member_list.firstChild);
    }
    let count_item = document.createElement("li");
    waiting_room_member_list.append(count_item);
    let count_readys = 0;

    game.player_list.forEach(element => {
        let member_item = document.createElement("li");
        const listText = document.createElement('label');
        listText.textContent = element;
        member_item.appendChild(listText);
        if (!element in game.player_ready_state) {
            game.player_ready_state[element] = false;
            member_item.setAttribute("class", "waiting_ready");
        } else {
            if (game.player_ready_state[element]) {
                member_item.setAttribute("class", "waiting_ready");
                count_readys++;
            } else {
                member_item.setAttribute("class", "waiting_yet");
            }
        }
        waiting_room_member_list.append(member_item);
    });
    const ready_rate = document.createElement('label');
    ready_rate.textContent = count_readys + "/" + game.player_list.length;
    count_item.appendChild(ready_rate);

}

function init_player_state() {
    game.player_list.forEach(element => {
        if (game.team_leader != element) {
            game.player_state[element] = 0;
        } else {
            game.player_state[element] = 1;
        }
    });
}
function update_player_state() {
    game.player_list.forEach(player => {
        if (game.assasin == player) {
            game.player_state[player] = 4;
        }
        else if (game.team_leader == player) {
            game.player_state[player] = 1;
        } else if (game.team.includes(player)) {
            game.player_state[player] = 2;
        } else if (game.preteam.includes(player)) {
            game.player_state[player] = 3;
        } else {
            game.player_state[player] = 0;
        }
    });
}

function update_game_state_label() {
    switch (game.game_state) {
        case 0:// organizing
            game_state_label.textContent = game.team_leader + " is gathering teammates...";
            break;
        case 1:// voting
            let preteam_text = " ";
            game.preteam.forEach(element => {
                preteam_text += element + ", ";
            });
            game_state_label.textContent = game.team_leader + " picked up these as teammates :" +
                preteam_text + " vote !";
            break;
        case 2:// carrying mission
            if (game.team.includes(player_name)) {
                game_state_label.textContent = "Now you are carrying a mission, vote !";
            } else {
                game_state_label.textContent = "Waiting for them to finish the mission... ";
            }
            break;
        case 3:// assasin
            if (game.assasin==player_name) {
                game_state_label.textContent = "Your last chance! Kill Merlin !";
            } else {
                game_state_label.textContent = "Pray... ";
            }
            break;
        case 4:
            game_state_label.textContent = "GAME OVER! ";
    }
}

function init_gaming_player_list() {
    while (gaming_member_list.firstChild) {
        gaming_member_list.removeChild(gaming_member_list.firstChild);
    }
    game.player_list.forEach(player => {
        let member_item = document.createElement("li");
        const choose = document.createElement("input");
        const listText = document.createElement('label');
        listText.textContent = player;
        choose.type = "checkbox";
        choose.value = player;
        choose.addEventListener("click", function () {
            let count = 0;
            for (var i = 0; i < gaming_member_list.children.length; i++) {
                let item = gaming_member_list.children[i];
                for (var j = 0; j < item.children.length; j++) {
                    let element = item.children[j];
                    if (element.type == "checkbox") {
                        if (element.checked) {
                            count++;
                        }
                    }
                }
            }
            if (game.game_state == 3) {
                if (count > 1) {
                    choose.checked = false;
                }
            } else if (count > game.missions[game.play_turn]) {
                choose.checked = false;
            }
        });

        member_item.appendChild(choose);
        member_item.appendChild(listText);
        player_state_to_attr(player, member_item);
        gaming_member_list.append(member_item);
    })

}
function update_gaming_player_list() {
    for (var i = 0; i < gaming_member_list.children.length; i++) {
        let item = gaming_member_list.children[i];
        for (var j = 0; j < item.children.length; j++) {
            let element = item.children[j];
            if (element.type == "checkbox") {
                if ((game.game_state != 3 && player_name == game.team_leader)
                    || game.player_role[player_name] == 5) {
                    element.disabled = false;
                } else {
                    element.disabled = true;
                }
            }
        }
        player_state_to_attr(game.player_list[i], item);
    }
}

function update_game() {
    switch (game.game_state) {
        case 0:
            if (game.team_leader == player_name) {
                leader_mode();
            }
            break;
        case 1:
            leave_leader_mode();
            voting_team_mode();
            break;
        case 2:
            if (game.team.includes(player_name)) {
                voting_mission_mode();
            }
            break;
        case 3:
            game.team = [];
            game.preteam = [];
            game.player_list.forEach(e => {
                if (game.player_role[e] == 5) {
                    game.assasin = e;
                }
            });
            send_message("I will turn the table! ",game.assasin);
            if (game.player_role[player_name] == 5) {
                assasin_mode();
            }
            break;
    }
    update_player_state();
    update_game_state_label();
    update_gaming_player_list();
}

function allow_voting() {
    voting_box.style.display = "block";
}
function voted() {
    yes_btn.disabled = true;
    no_btn.disabled = true;
}
function voting_finished() {
    console.log("voting_finished");
    voting_box.style.display = "none";
    yes_btn.disabled = false;
    no_btn.disabled = false;
}

function voting_team_mode() {
    // game.preteam.forEach(player => {
    //     game.player_state[player] = 2;
    // });
    allow_voting();
}
function voting_mission_mode() {
    // game.preteam.forEach(player => {
    //     game.player_state[player] = 2;
    // });
    allow_voting();
}
function assasin_mode() {
    kill_button.style.display = "block";
    kill_button.textContent = "KILL ! ";
}

function deal_vote_team(yes, no) {
    if (yes > no) {
        game.game_state = 2;
        game.team = game.preteam;
        game.preteam = [];
        send_message(yes+" yes vs "+no+" no. Resolution passed!","System");
    } else {
        send_message(yes+" yes vs "+no+" no. Reselect a team!","System");
    }
}
function deal_vote_mission(yes, no) {
    game.team = [];
    if (yes > no) {
        game.success_count++;
        let mission_label = document.querySelector('#mission_label_' + game.play_turn);
        mission_label.setAttribute("class", "successful_task");
        send_message(yes+" yes vs "+no+" no. Mission conpleted!","System");
        if (game.success_count == 3) {
            game.game_state = 3;
            return;
        }
    } else {
        game.fail_count++;
        let mission_label = document.querySelector('#mission_label_' + game.play_turn);
        mission_label.setAttribute("class", "failed_task");
        send_message(yes+" yes vs "+no+" no. Wasted!","System");
        if (game.fail_count == 3) {
            game.game_state = 4;
            alert("fail 3 gg");
        }
    }
    game.play_turn++;
}

function leader_mode() {
    game_choose_teammate_button.style.display = "block";
}
function leave_leader_mode() {
    game_choose_teammate_button.style.display = "none";
}


function player_state_to_attr(player, member_item) {
    switch (game.player_state[player]) {
        case 0:
            member_item.setAttribute("class", "none");
            break;
        case 1:
            member_item.setAttribute("class", "team_leader");
            break;
        case 2:
            member_item.setAttribute("class", "team_member");
            break;
        case 3:
            member_item.setAttribute("class", "preteam_member");
            break;
        case 4:
            member_item.setAttribute("class", "assasin");
            break;
    }
}


// function log_message(message) {
//     let new_log_line = document.createElement("li");
//     let new_log_line_t = document.createTextNode(message);
//     new_log_line.appendChild(new_log_line_t);
//     log_list.insertBefore(new_log_line, log_list.children[0]);
// }
// function player_chat_info(player_name, message) {
//     let new_log_line = document.createElement("li");
//     let new_log_line_t = document.createTextNode(player_name + ": " + message);
//     new_log_line.appendChild(new_log_line_t);
//     new_log_line.setAttribute("class", "chat-message")
//     log_list.insertBefore(new_log_line, log_list.children[0]);
//     if(player_name != my_name) {
//         play_sound("chat-sound");
//     }
// }


