/**
 * Created by ben on 8/21/15.
 */
var ai = (function () {
    'use strict';

    var module = {},
        treeMap = getTreeHashMap();

    function getTreeHashMap() {
        var myInit = { method: 'GET',
            mode: 'cors',
            cache: 'default' };

        window.fetch('treehash', myInit)
            .then(processStatus)
            .then(function (res) {
                return res.json();
            })
            .then(function (hash) {
                return new HashMap(hash);
            });

        function processStatus(res, err) {
            if (res.status === 200 || res.status === 0) {
                return Promise.resolve(res);
            }
            else {
                return Promise.reject(err);
            }
        }
    }

    function TreeNode(brdStr) {
        var my = {
            boardString: brdStr,
            children: [],
            parent: undefined,
            simulations: undefined,
            boardValue: undefined,
            netWins: undefined
        };

        if (treeMap.hasItem(brdStr)) {

        }

        this.getValue = function getValue() {

        };

        this.getString = function getString() {
            return my.boardString;
        }



    }

    function HashMap(itms) {
        var items;

        if (typeof itms === 'object') {
            items = JSON.parse(JSON.stringify(itms));
        }
        else {
            items = {
                totalSimulations: 0
            };
        }

        this.getItem = function getItem(key) {
            return items[key];
        };

        this.setItem = function setItem(key, value) {
            var temp;
            if (typeof items[key] !== 'undefined') {
                items[key] = value;
            }
            else {
                temp = items[key];
                items[key] = value;
            }
            return temp;
        };

        this.hasItem = function hasItem(key) {
            return typeof items[key] !== 'undefined';
        };
    }

    //Monte Carlo Tree Search algorithm
    function MCTS() {
        var totalSimulations = treeMap.getItem('totalSimulations'),
            //Large values give uniform search, small values prioritize node value
            exploreC = Math.sqrt(2),
            bestNodeValue,
            nextNode,
            currentNode,
            rootNode;

        rootNode = new TreeNode(JSON.stringify({
            simulation: true,
            state: {
                currentPlayer: 0,
                placedWalls: []
            },
            player1: {
                position: global.BOT_START_POS,
                winRange: players.getWinningRange(global.BOT_START_POS),
                wallCount: 10
            },
            player2: {
                position: global.TOP_START_POS,
                winRange: players.getWinningRange(global.TOP_START_POS),
                wallCount: 10
            }
        }));
        currentNode = rootNode;
        do {
            nextNode = currentNode.selectChild();
            while (treeMap.hasItem(nextNode.getString())) {

            }
        } while(rootNode);

    }

})();