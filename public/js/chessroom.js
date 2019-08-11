//------- begin of the chessBoard -------
import Chessboard from "./chessUtils/chessboard.js";
import { displayMessage } from "./helper/FrontendHelper.js";

let canvas = document.querySelector(".chessBoard");
let context = canvas.getContext("2d");
let margin = 20;

canvas.width = canvas.height = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;

let originX = document.querySelector(".chessBoard").getBoundingClientRect().left;
let originY = 0;

const INTERVAL = (canvas.width - 2 * 20) / 18;
const CHESS_RADIUS = 0.4 * INTERVAL;

let chessBoard;

function createChessBoard() {
    chessBoard = new Chessboard(
        INTERVAL, CHESS_RADIUS, context,
        canvas.width, canvas.height, null,// color is null when creating the chessboard
        originX, originY
    );
    //there should be no margin in y axis
    chessBoard.renderNewChessboard();
}

var timer1 = new easytimer.Timer();
var timer2 = new easytimer.Timer();
function initSocketEvent(socket) {
    socket.on('updateChess', function (chessArr) {
        chessBoard.renderNewChessboard(chessArr);
    });

    socket.on("blackTimer", function (blackTimer) {
        let seconds = blackTimer.hours * 60 * 60 + blackTimer.minutes * 60 + blackTimer.seconds
        console.log(seconds);
        timer1.reset();

        $('#timer-b #time-1').html(blackTimer);
        timer1.start({ countdown: true, startValues: seconds });
        timer1.addEventListener('secondsUpdated', function (e) {
            $('#timer-b #time-1').html(timer1.getTimeValues().toString());
        });
        timer1.addEventListener('targetAchieved', function (e) {
            $('#timer-b #time-1').html('KABOOM!!');
        });
    })
    socket.on("whiteTimer", function (whiteTimer) {
        $('#timer-w #time-2').html(whiteTimer);
        // timer1.reset();
        // timer1.start({ countdown: true, startValues: blackTimer });
        timer2.addEventListener('secondsUpdated', function (e) {
            $('#timer-w #time-2').html(timer2.getTimeValues().toString());
        });
        timer2.addEventListener('targetAchieved', function (e) {
            $('#timer-w #time-2').html('KABOOM!!');
        });
    })
}

function initGameEvent(socket) {
    const chessBoardClickHandler = function (event) {
        let chess = chessBoard.click(event);
        if (chess) socket.emit('click', chess);
    }

    const chessBoardSelectDeathStoneHandler = function (event) {
        chessBoard.click(event, true); // This should not return anything since we are only changing the display color of chess
        // if (joinedChess) socket.emit('deathStoneSelected', joinedChess);
    }

    const resignHandler = function () {
        socket.emit("resignReq", function () {
            displayMessage("<p>Better luck next time<p>", "#status", "alert-danger", `<h4 class="alert-heading">Sorry</h4>`, '<hr><button class="btn btn-primary">Play again?</button>');
            socket.close(); // Disable the match socket
            document.getElementById('resignEvent').removeEventListener('click', resignHandler);
            document.getElementById('judgeEvent').removeEventListener('click', judgeHanlder);
            canvas.removeEventListener("click", chessBoardClickHandler);

            $('.btn-toolbar *').prop('disabled', true); // Disable all buttons

        });
    }
    const hoverHandler = function (event) {
        chessBoard.hover(event);
    }
    const deathStoneHandler = function (event) {
        chessBoard.hover(event, true);
    }

    const judgeHanlder = function () {
        socket.emit('judge');
        displayMessage("Please select the death stone", "#status", "alert-info",
            `<h4 class="alert-heading">Judge phase</h4>`,
            `<hr><button id="deathStoneFinished" class="btn btn-primary">I have picked all</button>`);
        canvas.removeEventListener("click", chessBoardClickHandler);
        canvas.addEventListener("click", chessBoardSelectDeathStoneHandler);
        canvas.removeEventListener("mousemove", hoverHandler);
        canvas.addEventListener("mousemove", deathStoneHandler);
        document.getElementById("deathStoneFinished").addEventListener("click", function (e) {
            let cleanedChessBoard = chessBoard.getCleanChessboard();
            socket.emit("deathStoneFinished", cleanedChessBoard);
        });
    }

    document.getElementById('resignEvent').addEventListener('click', resignHandler);
    document.getElementById('judgeEvent').addEventListener('click', judgeHanlder);
    canvas.addEventListener("click", chessBoardClickHandler);
    canvas.addEventListener("mousemove", hoverHandler);

    socket.on('initChessboard', function (chessRecord) {
        for (let i = 0; i < chessRecord.colorArr.length; i++) {
            for (let j = 0; j < chessRecord.colorArr[i].length; j++) {
                if (chessRecord.colorArr[i][j]) {
                    let color = chessRecord.colorArr[i][j] === 1 ? "black" : "white"; // Todo: need to change the data structure
                    chessBoard.addChess(i, j, color);
                }
            }
        }
    });

    socket.on("opponentDrawReq", function () {

    })

    socket.on("opponentLeft", function () {
        displayMessage("Your opponent just left, please wait for <time id='opponentLeftTimer'>5</time>", "#status", "alert-danger");

        const opponentLeftTimer = new easytimer.Timer();
        opponentLeftTimer.start({ countdown: true, startValues: { seconds: 300 } });
        $('#opponentLeftTimer').html(opponentLeftTimer.getTimeValues().toString());
        opponentLeftTimer.addEventListener('secondsUpdated', function (e) {
            $('#opponentLeftTimer').html(opponentLeftTimer.getTimeValues().toString());
        });
        opponentLeftTimer.addEventListener('targetAchieved', function (e) {
            displayMessage("<p>You won the game, your opponent has timed out<p>",
                "#status", "alert-success", `<h4 class="alert-heading">Congratulations!</h4>`);
        })
    })

    socket.on("blackWin", function (blackspaces, whitespaces) {
        if (chessBoard.color === "black") {
            displayMessage(`<p>You won the game, blackspaces:<strong>${blackspaces}</strong>, whitespaces:<strong>${whitespaces}</strong><p>`,
                ".message", "alert-success", `<h4 class="alert-heading">Congratulations!</h4>`, '<hr><button class="btn btn-primary">Play again?</button>');
        } else {
            displayMessage(`<p>You lost the game, blackspaces:<strong>${blackspaces}</strong>, whitespaces:<strong>${whitespaces}</strong><p>`,
                ".message", "alert-danger", `<h4 class="alert-heading">Sorry!</h4>`, '<hr><button class="btn btn-primary">Play again?</button>');
        }

    })
    socket.on("whiteWin", function (blackspaces, whitespaces) {
        if (chessBoard.color === "white") {
            displayMessage(`<p>You lost the game, blackspaces:<strong>${blackspaces}</strong>, whitespaces:<strong>${whitespaces}</strong><p>`,
                ".message", "alert-danger", `<h4 class="alert-heading">Sorry!</h4>`, '<hr><button class="btn btn-primary">Play again?</button>');
        } else {
            displayMessage(`<p>You lost the game, blackspaces:<strong>${blackspaces}</strong>, whitespaces:<strong>${whitespaces}</strong><p>`,
                ".message", "alert-danger", `<h4 class="alert-heading">Sorry!</h4>`, '<hr><button class="btn btn-primary">Play again?</button>');
        }
    })

    socket.on("opponentResign", function () {
        displayMessage("<p>You won the game, your opponnent resigned<p>",
            "#status", "alert-success", `<h4 class="alert-heading">Congratulations!</h4>`, '<hr><button class="btn btn-primary">Play again?</button>');
        socket.close(); // Disable the match socket
        document.getElementById('resignEvent').removeEventListener('click', resignHandler);
        document.getElementById('judgeEvent').removeEventListener('click', judgeHanlder);
        canvas.removeEventListener("click", chessBoardClickHandler);

        $('.btn-toolbar *').prop('disabled', true); // Disable all buttons

    })
}

function initChessEvent(color) {
    chessBoard.setColor(color);
    //there should be no margin in y axis
    chessBoard.renderNewChessboard();
    $(".chessBoard").css("cursor", "none");
    $(".chessBoard").mouseleave(function () {
        chessBoard.renderNewChessboard(); // this prevents a chess being drawn when the cursor leaves the chessBoard
    });

    // canvas.addEventListener("mousemove", function (event) {
    //     chessBoard.hover(event);
    // });

    // initTimer();

    // window.addEventListener('beforeunload', function (e) {
    //     // Cancel the event
    //     e.preventDefault();
    //     // Chrome requires returnValue to be set
    //     e.returnValue = 'Are you sure you want to leave?';
    // });
}
//-----end of the chessBoard ----

function initTimer() { // The timer is loaded in timer.ejs file
    // var timer1 = new easytimer.Timer();
    // timer1.start({ countdown: true, startValues: { seconds: 60 * 60 * 2 } });
    // $('#timer-b #time-1').html(timer1.getTimeValues().toString());
    // timer1.addEventListener('secondsUpdated', function (e) {
    //     $('#timer-b #time-1').html(timer1.getTimeValues().toString());
    // });
    // timer1.addEventListener('targetAchieved', function (e) {
    //     $('#timer-b #time-1').html('KABOOM!!');
    // });

    // var timer2 = new easytimer.Timer();
    // timer2.start({ countdown: true, startValues: { seconds: 60 * 60 * 2 } });
    // timer2.pause();
    // $('#timer-w #time-2').html(timer2.getTimeValues().toString());
}

window.onload = function () {
    createChessBoard(); // init the chessboard but the game does not begin yet.

    window.addEventListener("resize", function () {
        chessBoard.originX = document.querySelector(".chessBoard").getBoundingClientRect().left;
        canvas.width = canvas.height = (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight);
        chessBoard.height = chessBoard.width = (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight);
        chessBoard.interval = (chessBoard.width - 2 * 20) / 18;
        chessBoard.resize();
    });
};

export {
    initChessEvent,
    initSocketEvent,
    initGameEvent
    // createChessBoard
};
