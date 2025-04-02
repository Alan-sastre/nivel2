class scenaRobot extends Phaser.Scene {
  constructor() {
    super({ key: "scenaRobot" });
    this.gameWon = false;
    this.correctlyPlacedParts = 0;
    this.partMarkers = [];
  }

  preload() {
    // Cargar assets (sin cambios)
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
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;

    // Configuración de música (sin cambios)
    this.music = this.sound.add("MusicRobot");
    this.music.play({ loop: true, volume: 0.5 });

    // Fondo (sin cambios)
    const background = this.add.image(0, 0, "fondo1").setOrigin(0, 0);
    background.setDisplaySize(screenWidth, screenHeight);

    // Cabeza del robot (sin cambios)
    this.add.image(400, 300, "robotHead").setScale(0.5);

    // Panel informativo (sin cambios)
    this.infoBox = this.add.rectangle(
      screenWidth / 2,
      50,
      screenWidth - 100,
      80,
      0x000000,
      0.7
    )

    // Texto informativo (sin cambios)
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

    // Basura (sin cambios)
    this.basura = this.add.image(850, 500, "basura").setScale(0.4).setInteractive();
    this.add.text(800, 550, "BASURA", { 
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff"
    });

    // Posiciones de las piezas (sin cambios)
    this.partPositions = [
      { x: 350, y: 250, type: "GPU", occupied: false },
      { x: 450, y: 250, type: "RAM", occupied: false },
      { x: 400, y: 350, type: "SENSOR", occupied: false }
    ];

    // Crear marcadores de posición (sin cambios)
    this.createPositionMarkers();

    // Crear piezas defectuosas (versión corregida)
    this.createDefectiveParts(isMobile);

    // Crear piezas nuevas (versión corregida)
    this.newParts = [
      { x: 100, y: 200, type: "GPU", image: "defectivePart", placed: false },
      { x: 100, y: 300, type: "RAM", image: "ram", placed: false },
      { x: 100, y: 400, type: "SENSOR", image: "sensor", placed: false }
    ];
    this.createNewParts(isMobile);

    // Instrucciones (sin cambios)
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

    // Habilitar multitouch solo para móviles
    if (isMobile) {
      this.input.addPointer(2);
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

  createDefectiveParts(isMobile) {
    this.defectiveParts = [];

    this.partPositions.forEach((pos, index) => {
      let imageKey = "defectivePart";
      let scale = 0.2;
      
      if (pos.type === "RAM") imageKey = "ram";
      else if (pos.type === "SENSOR") imageKey = "sensor";
      else if (pos.type === "GPU") scale = 0.15;

      // Configuración interactiva corregida
      const part = this.add.image(pos.x, pos.y, imageKey)
        .setScale(scale)
        .setDataEnabled();

      // Configuración diferente para móviles y PC
      if (isMobile) {
        part.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-20, -20, 80, 80),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true
        });
      } else {
        part.setInteractive({ cursor: "pointer" });
      }

      // Resto del código original (sin cambios)
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

      part.on("pointerdown", () => {
        this.infoText.setText(`Pieza defectuosa: ${pos.type}`);
        redBox.setVisible(false);
      });

      this.input.setDraggable(part);

      this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
        gameObject.redBox.x = dragX;
        gameObject.redBox.y = dragY;
      });

      part.on("dragend", () => {
        const distance = Phaser.Math.Distance.Between(
          part.x, part.y,
          this.basura.x, this.basura.y
        );

        if (distance < 100) {
          part.destroy();
          part.redBox.destroy();
          this.infoText.setText(`¡Pieza defectuosa eliminada!`);
          pos.occupied = false;
          this.defectiveParts = this.defectiveParts.filter(p => p !== part);
        } else {
          this.tweens.add({
            targets: [part, part.redBox],
            x: pos.x,
            y: pos.y,
            duration: 300,
            ease: "Power2"
          });
        }
      });

      this.defectiveParts.push(part);
    });
  }

  createNewParts(isMobile) {
    this.newPartObjects = [];

    this.newParts.forEach(part => {
      const partObj = this.add.image(part.x, part.y, part.image)
        .setScale(part.type === "GPU" ? 0.15 : 0.2)
        .setDataEnabled();

      // Configuración diferente para móviles y PC
      if (isMobile) {
        partObj.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-20, -20, 80, 80),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true
        });
      } else {
        partObj.setInteractive({ cursor: "pointer" });
      }

      // Resto del código original (sin cambios)
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

      partObj.on("pointerdown", () => {
        this.infoText.setText(`Pieza nueva: ${part.type}`);
        greenBox.setVisible(false);
      });

      this.input.setDraggable(partObj);

      partObj.on("dragend", () => {
        let placedCorrectly = false;

        this.partPositions.forEach(pos => {
          const distance = Phaser.Math.Distance.Between(
            partObj.x, partObj.y,
            pos.x, pos.y
          );

          if (distance < 50 && pos.type === part.type && !pos.occupied) {
            placedCorrectly = true;
            pos.occupied = true;
            part.placed = true;
            
            this.tweens.add({
              targets: [partObj, partObj.greenBox],
              x: pos.x,
              y: pos.y,
              duration: 200,
              ease: "Back.easeOut",
              onComplete: () => {
                partObj.disableInteractive();
                partObj.greenBox.destroy();
                this.infoText.setText(`¡${part.type} colocada correctamente!`);
                this.checkGameCompletion();
              }
            });
          }
        });

        if (!placedCorrectly) {
          this.tweens.add({
            targets: [partObj, partObj.greenBox],
            x: part.x,
            y: part.y,
            duration: 300,
            ease: "Power2"
          });
          partObj.greenBox.setVisible(true);
          this.infoText.setText("Coloca la pieza en su posición correcta");
        }
      });

      this.newPartObjects.push(partObj);
    });
  }

  // Resto de los métodos (sin cambios)
  checkGameCompletion() {
    this.correctlyPlacedParts++;
    
    if (this.correctlyPlacedParts === this.partPositions.length && !this.gameWon) {
      this.gameWon = true;
      this.showVictoryMessage();
    }
  }

  showVictoryMessage() {
    this.music.stop();
    const victoryBg = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      600,
      300,
      0x000000,
      0.8
    ).setDepth(100);

    const victoryText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
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
      this.cameras.main.centerX,
      this.cameras.main.centerY + 20,
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

    const countdownText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 80,
      "Cambiando de escena en 4...",
      {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffff00"
      }
    ).setOrigin(0.5).setDepth(101);

    let count = 4;
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        count--;
        countdownText.setText(`Cambiando de escena en ${count}...`);
        if (count <= 0) this.scene.start("BlockGame");
      },
      callbackScope: this,
      repeat: 3
    });
  }

  update() {}
}

window.scenaRobot = scenaRobot;