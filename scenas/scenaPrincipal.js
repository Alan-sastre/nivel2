class scenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: "scenaPrincipal", active: true });
  }

  preload() {
    this.load.image("background", "assets/scenaPrincipal/1.jpg");
    this.load.audio("musica", "assets/scenaPrincipal/musica.mp3"); // Cargar la música
  }

  create() {
    // Obtén las dimensiones de la pantalla
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    // Añade la imagen de fondo
    const background = this.add.image(0, 0, "background");

    // Escala la imagen para que cubra toda la pantalla
    const scaleX = screenWidth / background.width;
    const scaleY = screenHeight / background.height;
    background.setScale(scaleX, scaleY);

    // Centra la imagen en la pantalla
    background.setPosition(screenWidth / 2, screenHeight / 2);

    // Añade el texto en la parte inferior
    const text = this.add
      .text(
        screenWidth / 2, // Posición X (centrado horizontalmente)
        screenHeight - 90, // Posición Y (50 píxeles desde la parte inferior)
        "Dale espacio o click para continuar", // Texto
        {
          font: "24px Arial", // Tamaño y fuente del texto
          fill: "#ffffff", // Color del texto (blanco)
          align: "center", // Alineación del texto
        }
      )
      .setOrigin(0.5, 0.5); // Centra el texto en su posición

    // Crear un tween para hacer parpadear el texto
    this.tweens.add({
      targets: text, // Objeto a animar (el texto)
      alpha: 0, // Cambiar la opacidad a 0 (invisible)
      duration: 500, // Duración de la animación en milisegundos
      yoyo: true, // Repetir la animación en reversa
      repeat: -1, // Repetir infinitamente
      ease: "Sine.easeInOut",
    });

    // Reproducir la música
    const musica = this.sound.add("musica"); // Crea una instancia del sonido
    musica.play({ voluene: 0.1, loop: true }); // Reproduce la música con volumen 0.5 y bucle infinito

    // Escuchar la tecla espacio
    this.input.keyboard.on("keydown-SPACE", () => {
      this.cambiarEscena();
    });

    // Escuchar clic del mouse
    this.input.on("pointerdown", () => {
      this.cambiarEscena();
    });
  }

  cambiarEscena() {
    // Detener la música antes de cambiar de escena (opcional)
    this.sound.stopAll();


    this.scene.start("scenaVideo"); 
  }

  update() {

  }
}
