if (typeof window.scenaRobot === 'undefined') {
  class scenaRobot extends Phaser.Scene {
    constructor() {
      super({ key: "scenaRobot" });
      this.gameWon = false;
      this.correctlyPlacedParts = 0;
      this.partMarkers = [];
      this.defectiveParts = [];
      this.newPartObjects = [];
    }

    preload() {
      // Configuración para optimización de canvas
      try {
        if (this.sys.game.renderer && this.sys.game.renderer.context) {
          this.sys.game.renderer.context.canvas.willReadFrequently = true;
        }
      } catch (e) {
        console.log("Optimización canvas no disponible:", e);
      }

      // Cargar assets
      this.load.image("fondo1", "assets/scenaRobot/fondo1.png");
      this.load.image("robotHead", "assets/scenaRobot/cabeza.png");
      this.load.image("defectivePart", "assets/scenaRobot/GPU.png");
      this.load.image("newPart", "assets/scenaRobot/GPU.png");
      this.load.image("basura", "assets/scenaRobot/basura.png");
      this.load.image("ram", "assets/scenaRobot/RAM.png");
      this.load.image("sensor", "assets/scenaRobot/SENSOR.png");
      this.load.audio("MusicRobot", "assets/scenaRobot/MusicRobot.mp3");
    }

    create() {
      const screenWidth = this.sys.game.config.width;
      const screenHeight = this.sys.game.config.height;
      const isMobile = this.sys.game.device.os.android || 
                      this.sys.game.device.os.iOS;

      // Configuración de música
      this.music = this.sound.add("MusicRobot");
      this.music.play({ loop: true, volume: 0.5 });

      // Fondo
      const background = this.add.image(0, 0, "fondo1").setOrigin(0, 0);
      background.setDisplaySize(screenWidth, screenHeight);

      // Cabeza del robot
      this.add.image(400, 300, "robotHead").setScale(0.5);

      // Panel informativo
      this.infoBox = this.add.rectangle(
        screenWidth / 2,
        50,
        screenWidth - 100,
        80,
        0x000000,
        0.7
      ).setStrokeStyle(2, 0x999999, 0.8);

      // Texto informativo
      this.infoText = this.add.text(
        50,
        30,
        "¡Bienvenido! Arrastra las piezas dañadas a la basura y coloca las nuevas en su lugar.",
        {
          fontFamily: "Arial",
          fontSize: "20px",
          color: "#ffffff",
          wordWrap: { width: screenWidth - 100 }
        }
      );

      // Basura
      this.basura = this.add.image(850, 500, "basura").setScale(0.4).setInteractive();
      this.add.text(800, 550, "BASURA", { 
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff"
      });

      // Posiciones de las piezas
      this.partPositions = [
        { x: 350, y: 250, type: "GPU", occupied: false },
        { x: 450, y: 250, type: "RAM", occupied: false },
        { x: 400, y: 350, type: "SENSOR", occupied: false }
      ];

      // Crear marcadores de posición
      this.createPositionMarkers();

      // Crear piezas defectuosas
      this.createDefectiveParts();

      // Crear piezas nuevas
      this.newParts = [
        { x: 100, y: 200, type: "GPU", image: "defectivePart", placed: false, gameObject: null },
        { x: 100, y: 300, type: "RAM", image: "ram", placed: false, gameObject: null },
        { x: 100, y: 400, type: "SENSOR", image: "sensor", placed: false, gameObject: null }
      ];
      this.createNewParts();

      // Instrucciones
      this.add.text(
        50,
        500,
        "INSTRUCCIONES:\n1. Haz clic en las piezas dañadas (rojas) para identificarlas\n2. Arrástralas a la basura para eliminarlas\n3. Toma las piezas nuevas (verdes) y colócalas en su lugar correcto",
        {
          fontFamily: "Arial",
          fontSize: "18px",
          color: "#ffffff",
          backgroundColor: "#333333",
          padding: { x: 10, y: 10 }
        }
      );

      // Configuración de controles para móviles
      if (isMobile) {
        this.input.addPointer(2);
        this.setupTouchControls();
      }
    }

    createPositionMarkers() {
      this.partMarkers.forEach(marker => marker.destroy());
      this.partMarkers = [];

      this.partPositions.forEach(pos => {
        const marker = this.add.rectangle(
          pos.x, pos.y, 
          70, 70, 
          0x999999,
          0.5
        );
        this.partMarkers.push(marker);
      });
    }

    createDefectiveParts() {
      this.defectiveParts = [];

      this.partPositions.forEach((pos, index) => {
        let imageKey = "defectivePart";
        let scale = 0.2;
        
        if (pos.type === "RAM") imageKey = "ram";
        else if (pos.type === "SENSOR") imageKey = "sensor";
        else if (pos.type === "GPU") scale = 0.15;

        const part = this.add.image(pos.x, pos.y, imageKey)
          .setInteractive({ cursor: "pointer" })
          .setScale(scale)
          .setDataEnabled();

        part.data.set({
          type: pos.type,
          index: index,
          isDefective: true
        });

        const redBox = this.add.rectangle(
          pos.x, pos.y,
          part.displayWidth + 20,
          part.displayHeight + 20,
          0x000000, 0
        ).setStrokeStyle(3, 0xff0000, 1);

        part.redBox = redBox;

        part.on('pointerdown', () => {
          this.infoText.setText(`Pieza defectuosa: ${pos.type}`);
          redBox.setVisible(false);
        });

        this.input.setDraggable(part);

        part.on('dragend', (pointer) => {
          redBox.setVisible(true);
          redBox.setPosition(part.x, part.y);

          if (Phaser.Geom.Rectangle.Contains(
            new Phaser.Geom.Rectangle(840, 410, 100, 100),
            pointer.x, pointer.y
          )) {
            part.destroy();
            redBox.destroy();
            this.infoText.setText(`¡Pieza defectuosa eliminada!`);
            pos.occupied = false;
            this.defectiveParts = this.defectiveParts.filter(p => p !== part);
          }
        });

        this.defectiveParts.push(part);
      });

      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
        if (gameObject.redBox) {
          gameObject.redBox.x = dragX;
          gameObject.redBox.y = dragY;
        }
      });
    }

    createNewParts() {
      this.newPartObjects = [];

      this.newParts.forEach((part, index) => {
        const partObj = this.add.image(part.x, part.y, part.image)
          .setInteractive({ cursor: "pointer" })
          .setScale(part.type === "GPU" ? 0.15 : 0.2)
          .setDataEnabled();

        part.gameObject = partObj;

        partObj.data.set({
          type: part.type,
          isNew: true
        });

        const greenBox = this.add.rectangle(
          part.x, part.y,
          partObj.displayWidth + 20,
          partObj.displayHeight + 20,
          0x000000, 0
        ).setStrokeStyle(3, 0x00ff00, 1);

        partObj.greenBox = greenBox;

        partObj.on('pointerdown', () => {
          this.infoText.setText(`Pieza nueva: ${part.type}`);
          greenBox.setVisible(false);
        });

        this.input.setDraggable(partObj);

        partObj.on('dragend', (pointer) => {
          greenBox.setVisible(true);
          greenBox.setPosition(partObj.x, partObj.y);

          this.partPositions.forEach(position => {
            if (Phaser.Geom.Rectangle.Contains(
              new Phaser.Geom.Rectangle(position.x - 30, position.y - 30, 60, 60),
              pointer.x, pointer.y
            )) {
              if (part.type === position.type) {
                this.placePartCorrectly(partObj, greenBox, part, index, position);
              } else {
                this.infoText.setText(`¡Error! Esta no es la pieza correcta para esta posición`);
              }
            }
          });
        });

        this.newPartObjects.push(partObj);
      });
    }

    setupTouchControls() {
      this.defectiveParts.concat(this.newPartObjects).forEach(part => {
        part.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-20, -20, 80, 80),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true
        });
      });
    }

    placePartCorrectly(newPart, greenBox, part, index, position) {
      newPart.setPosition(position.x, position.y);
      newPart.disableInteractive();
      greenBox.destroy();
      part.placed = true;
      position.occupied = true;
      this.infoText.setText(`¡Pieza nueva ${index + 1} (${part.type}) colocada correctamente!`);

      if (this.checkIfGameWon() && !this.gameWon) {
        this.gameWon = true;
        this.showVictoryMessage();
      }
    }

    checkIfGameWon() {
      return this.partPositions.every(pos => pos.occupied) && 
             this.newParts.every(part => part.placed);
    }

    showVictoryMessage() {
      const screenWidth = this.sys.game.config.width;
      const screenHeight = this.sys.game.config.height;

      this.music.stop();

      const victoryBg = this.add.rectangle(
        screenWidth / 2,
        screenHeight / 2,
        600,
        300,
        0x000000,
        0.8
      ).setDepth(100);

      const victoryText = this.add.text(
        screenWidth / 2,
        screenHeight / 2 - 50,
        "¡REPARACIÓN COMPLETADA!",
        {
          fontFamily: "Arial",
          fontSize: "40px",
          color: "#00ff00",
          fontWeight: "bold",
          align: "center"
        }
      ).setOrigin(0.5).setDepth(101);

      const subText = this.add.text(
        screenWidth / 2,
        screenHeight / 2 + 20,
        "Has reparado exitosamente el robot",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
          align: "center"
        }
      ).setOrigin(0.5).setDepth(101);

      this.tweens.add({
        targets: victoryText,
        scale: 1.1,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });

      let count = 4;
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          count--;
          if (count <= 0) {
            this.scene.start("BlockGame");
          }
        },
        callbackScope: this,
        repeat: 3
      });
    }

    update() {}
  }

  window.scenaRobot = scenaRobot;
}