import { Game } from './Game';
window.onload = function () {
    const game = new Game();
    game.play();
    window.onresize = () => {
        game.board.fillPageWithCanvas();
    }
};