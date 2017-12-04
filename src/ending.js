var ending = function (game) {};

var endingBGM;

ending.prototype = {
    preload:function(){
        game.load.audio('endingBGM', "assets/Visager_-_05_-_Roots_Loop.mp3");
    },
    create:function () {
        endingBGM = game.add.audio('menuBGM');
        endingBGM.loop = true;
        endingBGM.volume = 0.6;
        endingBGM.play();
    },
    update:function() {
    },
    render:function(){

    }
};
