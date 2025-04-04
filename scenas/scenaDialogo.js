class scenaDialogo extends Phaser.Scene {
    constructor() {
      super({ key: "scenaDialogo" });
    }
  
    preload() {
      this.load.image("fondoo", "assets/scenaRobot/fondo1.png");
      this.load.image("GPU", "assets/scenaRobot/GPU.png");
      this.load.image("ram", "assets/scenaRobot/RAM.png");
      this.load.image("sensor", "assets/scenaRobot/SENSOR.png");
      this.load.audio("MusicRobot", "assets/scenaRobot/MusicRobot.mp3");
    }
  
    create() {
      const { width, height } = this.scale.displaySize;
  
      // Fondo
      this.fondo = this.add.image(0, 0, "fondoo");
      this.fondo.setOrigin(0, 0);
      this.fondo.displayWidth = this.scale.width;
      this.fondo.displayHeight = this.scale.height;

      // Música de fondo
      this.music = this.sound.add("MusicRobot", { loop: true, volume: 0.2 });
      this.music.play();
  
      // Diálogos sobre las partes a reparar
      this.dialogues = [
        { 
          text: "Bienvenido al laboratorio de reparación. Hoy vamos a aprender sobre tres componentes importantes que necesitamos reparar:",
          image: null
        },
        { 
          text: "La RAM (Memoria de Acceso Aleatorio):\n\nEs la memoria principal del sistema que almacena temporalmente los datos que se están utilizando. Sin una RAM funcional, el sistema no puede procesar información eficientemente.",
          image: "ram"
        },
        { 
          text: "El Sensor:\n\nEs un dispositivo que detecta cambios en el entorno y convierte señales físicas en datos que el sistema puede interpretar. Los sensores son los 'ojos y oídos' de nuestro sistema.",
          image: "sensor"
        },
        { 
          text: "La GPU (Unidad de Procesamiento Gráfico):\n\nEs el componente responsable de procesar y generar imágenes. Una GPU dañada puede causar problemas de visualización y rendimiento gráfico.",
          image: "GPU"
        }
      ];
  
      this.currentDialogueIndex = 0;
      this.currentImage = null; // Para mantener referencia a la imagen actual
      this.showNextDialogue();
    }
  
    showNextDialogue() {
      // Eliminar imagen anterior si existe
      if (this.currentImage) {
        this.currentImage.destroy();
        this.currentImage = null;
      }
      
      if (this.currentDialogueIndex < this.dialogues.length) {
        const currentDialogue = this.dialogues[this.currentDialogueIndex];
        const currentText = currentDialogue.text;
        const imageKey = currentDialogue.image;
  
        if (currentText.startsWith("Pregunta:")) {
          this.showQuestionWithBoxes(currentText);
        } else {
          const { dialogBox, dialogText, continueText } = this.showDialog(
            this,
            "",
            50,
            200,
            600,
            150
          );
  
          // Mostrar imagen si existe para este diálogo
          if (imageKey) {
            this.currentImage = this.add.image(
              this.scale.width - 200, 
              this.scale.height / 2, 
              imageKey
            );
            this.currentImage.setScale(0.5); // Ajustar tamaño si es necesario
            
            // Animación de aparición
            this.currentImage.setAlpha(0);
            this.tweens.add({
              targets: this.currentImage,
              alpha: 1,
              duration: 500,
              ease: 'Power2'
            });
          }
  
          let currentCharIndex = 0;
          const typingAnimation = this.time.addEvent({
            delay: 50,
            callback: () => {
              dialogText.text += currentText[currentCharIndex];
              currentCharIndex++;
  
              if (currentCharIndex >= currentText.length) {
                typingAnimation.remove();
                continueText.setText("Da click para continuar");
  
                this.input.once("pointerdown", () => {
                  this.currentDialogueIndex++;
                  this.closeDialog(dialogBox, dialogText, continueText);
                  this.showNextDialogue();
                });
              }
            },
            loop: true,
          });
        }
      } else {
        // Esperar 6 segundos antes de cambiar a la siguiente escena
        this.time.delayedCall(1000, () => {
            this.scene.start("scenaRobot");
        });
      }
    }
  
    showQuestionWithBoxes(questionText) {
      const question = questionText.split(":")[1].trim();
  
      const questionBox = this.add.graphics();
      questionBox.fillStyle(0x000000, 0.8);
      questionBox.fillRoundedRect(50, 150, 600, 100, 15);
  
      const questionTextDisplay = this.add.text(60, 160, question, {
        fontSize: "20px",
        fill: "#ffffff",
        wordWrap: { width: 580 },
      });
  
      const options = [
        {
          text: "Sensores",
          feedback:
            "Correcto. Los sensores permiten al robot percibir su entorno.",
          isCorrect: true,
        },
        {
          text: "Ruedas",
          feedback:
            "Incorrecto. Aunque importantes, no todos los robots tienen ruedas.",
          isCorrect: false,
        },
        {
          text: "Pantalla LCD",
          feedback:
            "Incorrecto. Las pantallas no son esenciales para que el robot funcione.",
          isCorrect: false,
        },
        {
          text: "Altavoces",
          feedback:
            "Incorrecto. Los altavoces son accesorios, no una parte esencial.",
          isCorrect: false,
        },
        {
          text: "Circuitos eléctricos",
          feedback:
            "Correcto. Sin circuitos eléctricos, el robot no podría procesar ni ejecutar tareas.",
          isCorrect: true,
        },
      ];
  
      this.correctAnswersSelected = 0;
      this.selectedCorrectOptions = [];
  
      const optionBoxes = [];
      const startY = 300;
      const boxWidth = 250;
      const boxHeight = 50;
      const spacing = 20;
      const columnSpacing = 50;
  
      options.forEach((option, index) => {
        const column = index % 2 === 0 ? 0 : 1;
        const row = Math.floor(index / 2);
  
        const boxX =
          column === 0
            ? this.scale.width / 2 - boxWidth - columnSpacing
            : this.scale.width / 2 + columnSpacing;
  
        const boxY = startY + row * (boxHeight + spacing);
  
        const optionBox = this.add.graphics();
        optionBox.fillStyle(0x000000, 0.8);
        optionBox.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 10);
  
        optionBox.lineStyle(2, 0xffffff, 1);
        optionBox.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 10);
  
        optionBox.setInteractive(
          new Phaser.Geom.Rectangle(boxX, boxY, boxWidth, boxHeight),
          Phaser.Geom.Rectangle.Contains
        );
  
        const optionText = this.add.text(boxX + 10, boxY + 15, option.text, {
          fontSize: "16px",
          fill: "#ffffff",
          wordWrap: { width: boxWidth - 20 },
          align: "center",
        });
  
        optionBox.on("pointerdown", () => {
          this.handleOptionSelection(
            option.isCorrect,
            option.feedback,
            optionBox,
            optionText,
            questionBox,
            questionTextDisplay,
            optionBoxes
          );
        });
  
        optionBoxes.push({ optionBox, optionText });
      });
    }
  
    handleOptionSelection(
      isCorrect,
      feedback,
      optionBox,
      optionText,
      questionBox,
      questionTextDisplay,
      optionBoxes
    ) {
      if (isCorrect) {
        if (!this.selectedCorrectOptions.includes(optionText.text)) {
          this.selectedCorrectOptions.push(optionText.text);
          this.correctAnswersSelected++;
  
          optionBox.clear();
          optionBox.fillStyle(0x28a745, 1);
          optionBox.fillRoundedRect(
            optionText.x - 10,
            optionText.y - 15,
            250,
            50,
            10
          );
  
          if (this.correctAnswersSelected === 2) {
            this.showCongratulations();
            this.time.delayedCall(2600, () => {
              questionBox.destroy();
              questionTextDisplay.destroy();
              optionBoxes.forEach(({ optionBox, optionText }) => {
                optionBox.destroy();
                optionText.destroy();
              });
              this.showFeedbackText();
            });
          }
        }
      } else {
        optionBox.clear();
        optionBox.fillStyle(0xdc3545, 1);
        optionBox.fillRoundedRect(
          optionText.x - 10,
          optionText.y - 15,
          250,
          50,
          10
        );
  
        this.showAlert(feedback, 0xdc3545);
      }
    }
  
    showCongratulations() {
      const congratsText = this.add.text(
        this.scale.width / 2,
        100,
        "¡Lo hiciste muy bien!",
        {
          fontSize: "30px",
          fill: "#28a745",
          fontStyle: "bold",
        }
      );
      congratsText.setOrigin(0.5, 0.5);
  
      this.time.delayedCall(2000, () => {
        congratsText.destroy();
      });
    }
  
    showFeedbackText() {
      const feedbackText =
        "Retroalimentación:\n“Recuerda, los sensores y los circuitos eléctricos son elementos clave para que un robot pueda interactuar con su entorno y funcionar correctamente.”";
  
      const { dialogBox, dialogText, continueText } = this.showDialog(
        this,
        "",
        50,
        200,
        600,
        150
      );
  
      let currentCharIndex = 0;
      const typingSound = this.sound.add("teclado");
      typingSound.play({ loop: true, volume: 0.5 });
  
      const typingAnimation = this.time.addEvent({
        delay: 50,
        callback: () => {
          dialogText.text += feedbackText[currentCharIndex];
          currentCharIndex++;
  
          if (currentCharIndex >= feedbackText.length) {
            typingAnimation.remove();
            typingSound.stop();
            continueText.setText("Da click para continuar");
  
            this.input.once("pointerdown", () => {
              this.closeDialog(dialogBox, dialogText, continueText);
              this.scene.start("scenaRompecabezas");
            });
          }
        },
        loop: true,
      });
    }
  
    showAlert(message, color) {
      const alertBox = this.add.graphics();
      alertBox.fillStyle(color, 0.8);
      alertBox.fillRoundedRect(100, 50, 600, 50, 15);
  
      const alertText = this.add.text(110, 60, message, {
        fontSize: "18px",
        fill: "#ffffff",
        wordWrap: { width: 580 },
      });
  
      this.time.delayedCall(2000, () => {
        alertBox.destroy();
        alertText.destroy();
      });
    }
  
    showDialog(scene, text, x, y, width, height) {
      const dialogBox = scene.add.graphics();
      dialogBox.fillStyle(0x000000, 0.8);
      dialogBox.fillRoundedRect(x, y, width, height, 15);
  
      const dialogText = scene.add.text(x + 10, y + 10, text, {
        fontSize: "20px",
        fill: "#ffffff",
        wordWrap: { width: width - 20 },
      });
  
      const continueText = scene.add.text(
        x + width / 2 - 80,
        y + height + 10,
        "",
        {
          fontSize: "30px",
          fill: "#ffffff",
        }
      );
  
      continueText.setShadow(6, 6, "black", 2, true, true);
  
      scene.tweens.add({
        targets: continueText,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
  
      return { dialogBox, dialogText, continueText };
    }
  
    closeDialog(dialogBox, dialogText, continueText) {
      dialogBox.destroy();
      dialogText.destroy();
      continueText.destroy();
    }
  
    update() {}
  }
  