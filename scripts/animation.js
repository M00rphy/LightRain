// # Quintus Tweened Animation Example
//
// [Run the example](../quintus/examples/tween/index.html)
//
// This example shows how to use the tween component to
// play tweened animations in sprites.
window.addEventListener("load", function () {
  // Set up a standard Quintus instance with only the
  // Sprites and Scene module (for the stage support) loaded.
  var Q = Quintus()
    .include("Sprites, Scenes, Anim")
    .setup({
      width: 117,
      height: 117,
    });

  Q.animations('play_button', {
    frames: [5, 4, 3, 2, 1, 2, 3, 4, 5], rate: 1 / 15
  });

  Q.Sprite.extend("Play_Button", {
    init: function (p) {
      this._super(p, {
        sprite: "play_button",
        sheet: "play_button"
      });
      this.add("animation");
    }
  });

  // Setup a scene with just one sprite to animate.
  Q.scene("scene1", function (stage) {
    var play_Button = new Q.Sprite();
    play_Button.play("play_button");
    stage.insert(play_Button);

    // Using animate()/chain() the value of each property is tweened
    // between the current value and the input value.

  });

  Q.load(
    ["play_button.png"],
    function () {
      Q.stageScene("scene1");
    },
    {
      progressCallback: function (loaded, total) {
        var element = document.getElementById("loading_progress");
        element.style.width = Math.floor((loaded / total) * 100) + "%";
        if (loaded == total) {
          document.getElementById("loading").remove();
        }
      },
    }
  );
});
//TODO: Make the animation stutter, instead of changing between frames smoothly make it static instead of with movement
