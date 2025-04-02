class BlockGame extends Phaser.Scene {
  constructor() {
    super({ key: "BlockGame" });
    this.runButton = null;
    this.isExecuting = false;
    this.actions = [];
    this.currentActionIndex = 0;
    this.executionCompleted = true;
    this.executionTimer = null; 
    this.isMobile = false;
    this.isLandscape = false;
    this.blocklyDiv = null;
    this.buttonContainer = null;
    this.statusPanel = null;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.isMoving = false;
    
    // Definir el laberinto con una sola solución
    this.maze = [
      [1,0, 0, 1, 1, 1, 1, 1],
      [1,1, 0, 1, 0, 0, 1, 1],
      [1,1, 0, 0, 0, 1, 1, 1],
      [1,1, 1, 0, 1, 0, 1, 1],
      [1,1, 0, 0, 0, 0, 1, 1],
      [1,1, 1, 1, 2, 1, 1, 1]
    ];
    
    this.cellSize = 55;
    this.startCell = { row: 0, col: 0 };
  }

  preload() {
    // Cargar imágenes y sprites
    this.load.image("maze-background", "assets/scenaBloques/fondo1.png");
    this.load.spritesheet("character", "assets/scenaBloques/spritesheet.png", {
      frameWidth: 198,
      frameHeight: 188,
      startFrame: 0,
      endFrame: 1
    });
    // Cargar assets para UI
    this.load.image("button-bg", "assets/ui/button-bg.png");
    this.load.image("panel-bg", "assets/ui/panel-bg.png");
    
    // Cargar assets para el laberinto
    this.load.image("wall", "assets/scenaBloques/wall.png");
    this.load.image("goal", "assets/scenaBloques/goal.png");
    
    // Cargar imagen de fondo para el escenario
    this.load.image("scene-background", "assets/scenaBloques/maze-bg.png");
    
    // Cargar música y sonidos
    this.load.audio('bg-music', 'assets/scenaBloques/musica.mp3');
    
    // Agregar evento de carga completo
    this.load.on('filecomplete', (fileType, fileName, success) => {
      if (fileName === 'bg-music') {
        console.log('Música cargada:', success ? 'Exitosamente' : 'Falló');
      }
    });
  }

  create() {
    // Detectar si es móvil y configurar el layout
    this.isMobile = !this.sys.game.device.os.desktop;
    this.isLandscape = window.innerWidth > window.innerHeight;

    // Configurar el layout inicial
    this.setupLayout();

    // Añadir imagen de fondo al escenario
    const sceneBg = this.add.image(0, 0, 'scene-background');
    sceneBg.setOrigin(0, 0);
    sceneBg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    sceneBg.setDepth(-1);

    // Configurar áreas del juego según el dispositivo
    this.setupGameAreas();

    // Configurar el personaje según el dispositivo
    this.setupCharacter();

    // Configurar UI responsiva
    this.setupUI();

    // Configurar Blockly
    this.setupBlockly();

    // Escuchar cambios de tamaño y orientación
    this.scale.on('resize', this.handleResize, this);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(this.scale.gameSize), 100);
    });

    // Inicializar Blockly
    Blockly.JavaScript.STATEMENT_PREFIX = '';
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    
    // Definir los bloques antes de configurar Blockly
    this.defineCustomBlocks();

    // Iniciar música de fondo
    if (this.sound) {
      this.bgMusic = this.sound.add('bg-music', {
        loop: true,
        volume: 1,
        rate: 1,
        detune: 0
      });
      
      // Agregar eventos para debug
      this.bgMusic.on('play', () => {
        console.log('Música comenzando a reproducirse');
      });
      
      this.bgMusic.on('error', () => {
        console.log('Error al reproducir la música');
      });
      
      // Intentar reproducir la música
      this.bgMusic.play();
    } else {
      console.log('Error: El sistema de sonido no está disponible');
    }

    // Agregar estilos CSS para personalizaciones generales
    this.addCustomStyles();

    // Asegurar que el juego esté en la capa correcta
    this.children.setAll('depth', 1);
    if (this.character) {
      this.character.setDepth(2);
      
      // Mejorar la calidad de la imagen
      this.character.setSmoothed(true); // Habilitar anti-aliasing
      this.character.setScale(0.25); // Ajustar escala para mejor calidad
      this.character.setPixelPerfect(false); // Deshabilitar pixel perfect para mejor interpolación
      this.character.setTint(0xFFFFFF); // Asegurar que no haya tintes que afecten la calidad
    }

    // Mejorar la calidad general de la cámara
    this.cameras.main.setZoom(1.0);
    this.cameras.main.setRoundPixels(false);
    this.cameras.main.setAntialias(true);
  }

  setupLayout() {
    // Limpiar el blocklyDiv existente si hay uno
    if (this.blocklyDiv && this.blocklyDiv.parentNode) {
      this.blocklyDiv.parentNode.removeChild(this.blocklyDiv);
    }

    // Crear el contenedor principal
    const mainContainer = document.createElement('div');
    mainContainer.id = 'gameContainer';
    mainContainer.style.position = 'absolute';
    mainContainer.style.width = '100%';
    mainContainer.style.height = '100%';
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = this.isMobile ? 'column' : 'row';
    document.body.appendChild(mainContainer);

    // Crear el área de Blockly
    this.blocklyDiv = document.createElement('div');
    this.blocklyDiv.id = 'blocklyDiv';
    this.blocklyDiv.style.position = 'relative';
    
    if (this.isMobile) {
      // En móvil, Blockly va en la parte inferior
      this.blocklyDiv.style.width = '100%';
      this.blocklyDiv.style.height = '40%';
      mainContainer.style.flexDirection = 'column-reverse';
    } else {
      // En PC, Blockly va a la izquierda
      this.blocklyDiv.style.width = '40%';
      this.blocklyDiv.style.height = '100%';
    }
    
    mainContainer.appendChild(this.blocklyDiv);

    // Crear el área del juego
    const gameArea = document.createElement('div');
    gameArea.id = 'gameArea';
    gameArea.style.position = 'relative';
    gameArea.style.flex = '1';
    mainContainer.appendChild(gameArea);

    // Mover el canvas de Phaser al área del juego
    const canvas = document.querySelector('canvas');
    if (canvas) {
      gameArea.appendChild(canvas);
    }
  }

  setupGameAreas() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Calcular dimensiones del laberinto
    const mazeWidth = this.maze[0].length * this.cellSize;
    const mazeHeight = this.maze.length * this.cellSize;

    // Ajustar el tamaño del laberinto según el dispositivo
    if (this.isMobile) {
      this.cellSize = Math.min(
        45,
        Math.min(
          (width * 0.9) / this.maze[0].length,
          (height * 0.5) / this.maze.length
        )
      );
    }

    // Centrar el laberinto en el área de juego
    const gameAreaX = (width - (this.maze[0].length * this.cellSize)) / 2;
    const gameAreaY = this.isMobile ? 
      height * 0.1 : // En móvil, más cerca de la parte superior
      (height - (this.maze.length * this.cellSize)) / 2;

    // Definir el área de juego
    this.gameArea = new Phaser.Geom.Rectangle(
      gameAreaX,
      gameAreaY,
      this.maze[0].length * this.cellSize,
      this.maze.length * this.cellSize
    );

    // Limpiar y recrear el laberinto
    if (this.mazeGroup) {
      this.mazeGroup.clear(true, true);
      this.mazeGroup.destroy(true);
    }

    // Crear el laberinto
    this.createMaze();
  }

  setupUI() {
    // Crear contenedor de botones si no existe
    if (!this.buttonContainer) {
      this.buttonContainer = this.add.container(0, 0);
    }

    // Posicionar botones según el dispositivo
    const buttonY = this.isMobile ?
      this.cameras.main.height * 0.05 : // En móvil, en la parte superior
      this.cameras.main.height - 50;    // En PC, en la parte inferior

    // Limpiar botones existentes
    this.buttonContainer.removeAll(true);

    // Crear botón de ejecución
    this.runButton = this.add.image(0, 0, 'button-bg')
      .setInteractive()
      .on('pointerdown', () => this.executeCode());
    
    const runText = this.add.text(0, 0, 'Ejecutar', {
      font: '16px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.buttonContainer.add([this.runButton, runText]);
    this.buttonContainer.setPosition(
      this.cameras.main.width - 100,
      buttonY
    );
  }

  handleResize(gameSize) {
    if (this.lastWidth === gameSize.width && this.lastHeight === gameSize.height) {
      return;
    }

    this.lastWidth = gameSize.width;
    this.lastHeight = gameSize.height;
    this.isLandscape = window.innerWidth > window.innerHeight;

    // Actualizar el layout
    this.setupLayout();
    this.setupGameAreas();
    this.setupUI();

    // Actualizar el workspace de Blockly
    if (this.blocklyWorkspace) {
      Blockly.svgResize(this.blocklyWorkspace);
    }

    // Reubicar el personaje si existe
    if (this.character) {
      const currentCell = {
        row: Math.floor((this.character.y - this.gameArea.y) / this.cellSize),
        col: Math.floor((this.character.x - this.gameArea.x) / this.cellSize)
      };
      this.character.setPosition(
        this.gameArea.x + (currentCell.col * this.cellSize) + (this.cellSize / 2),
        this.gameArea.y + (currentCell.row * this.cellSize) + (this.cellSize / 2)
      );
    }
  }

  setupCharacter() {
    // Crear las animaciones del personaje
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('character', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'moving',
      frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1
    });

    // Posición inicial del personaje
    const startCell = this.findStartCell();
    this.characterStartX = this.gameArea.x + this.cellSize + (startCell.col * this.cellSize);
    this.characterStartY = this.gameArea.y + this.cellSize + (startCell.row * this.cellSize);

    // Crear el personaje
    this.character = this.add.sprite(this.characterStartX, this.characterStartY, 'character');
    this.character.setScale(0.2); // Ajustar el tamaño según necesites
    this.character.play('idle');
  }

  findStartCell() {
    // Encontrar la celda de inicio (primera celda vacía en la primera fila)
    for (let col = 0; col < this.maze[0].length; col++) {
      if (this.maze[0][col] === 0) {
        return { row: 0, col: col };
      }
    }
    return { row: 0, col: 1 }; // Posición por defecto si no se encuentra
  }

  setupBlockly() {
    if (!this.blocklyDiv) return;

    // Crear el toolbox sin categorías
    this.toolbox = `
      <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
        <block type="start"></block>
        <block type="move_forward"></block>
        <block type="move_backward"></block>
        <block type="move_up"></block>
        <block type="move_down"></block>
      </xml>
    `;

    // Configurar el workspace de Blockly
    this.blocklyWorkspace = Blockly.inject(this.blocklyDiv.id, {
      toolbox: this.toolbox,
      scrollbars: true,
      horizontalLayout: false,
      toolboxPosition: 'start',
      move: {
        scrollbars: true,
        drag: true,
        wheel: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true
    });

    // Agregar eventos de cambio
    this.blocklyWorkspace.addChangeListener(() => {
      // Actualizar el código cuando cambie el workspace
      try {
        const code = Blockly.JavaScript.workspaceToCode(this.blocklyWorkspace);
        console.log('Código generado:', code);
      } catch (e) {
        console.error('Error al generar código:', e);
      }
    });
  }

  defineCustomBlocks() {
    // Definir los bloques
    Blockly.Blocks['start'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("▶️")
            .appendField("Iniciar");
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("Bloque de inicio del programa");
      }
    };

    Blockly.Blocks['move_forward'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("➡️")
            .appendField("Mover Adelante");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Mueve el personaje hacia adelante");
      }
    };

    Blockly.Blocks['move_backward'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("⬅️")
            .appendField("Mover Atrás");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Mueve el personaje hacia atrás");
      }
    };

    Blockly.Blocks['move_up'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("⬆️")
            .appendField("Mover Arriba");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Mueve el personaje hacia arriba");
      }
    };

    Blockly.Blocks['move_down'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("⬇️")
            .appendField("Mover Abajo");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Mueve el personaje hacia abajo");
      }
    };

    // Definir los generadores de JavaScript
    if (!Blockly.JavaScript) {
      Blockly.JavaScript = new Blockly.Generator('JavaScript');
    }

    Blockly.JavaScript.forBlock['start'] = function(block) {
      return 'startExecution();\n';
    };

    Blockly.JavaScript.forBlock['move_forward'] = function(block) {
      return 'await moveForward();\n';
    };

    Blockly.JavaScript.forBlock['move_backward'] = function(block) {
      return 'await moveBackward();\n';
    };

    Blockly.JavaScript.forBlock['move_up'] = function(block) {
      return 'await moveUp();\n';
    };

    Blockly.JavaScript.forBlock['move_down'] = function(block) {
      return 'await moveDown();\n';
    };
  }

  addCustomStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Estilos para el área de Blockly */
      #blocklyDiv {
        background-color: #f0f0f0;
        border-right: 2px solid #ccc;
        box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      }

      /* Estilos base para todos los dispositivos */
      .game-button {
        padding: ${this.isMobile ? '8px 16px' : '12px 24px'};
        font-family: 'Arial', sans-serif;
        font-size: ${this.isMobile ? "14px" : "16px"};
        font-weight: bold;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-right: ${this.isMobile ? '5px' : '10px'};
        text-transform: uppercase;
        outline: none;
      }
      
      .game-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
      }
      
      .game-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .run-button {
        background: linear-gradient(to bottom, #4CAF50, #388E3C);
      }
      
      .run-button:disabled {
        background: #cccccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .reset-button {
        background: linear-gradient(to bottom, #F44336, #D32F2F);
      }
      
      /* Estilos para móviles */
      @media (max-width: 768px) {
        .blocklyToolboxDiv {
          width: 60px !important;
        }
        
        .blocklyTreeLabel {
          font-size: 10px !important;
        }
        
        .blocklyText {
          font-size: 10px !important;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  createMaze() {
    // Crear grupo para el laberinto si no existe
    if (!this.mazeGroup) {
      this.mazeGroup = this.add.group();
    }

    // Crear el fondo del laberinto
    const mazeBg = this.add.image(
      this.gameArea.x,
      this.gameArea.y,
      'maze-background'
    );
    mazeBg.setOrigin(0, 0);
    mazeBg.setDisplaySize(this.gameArea.width, this.gameArea.height);
    this.mazeGroup.add(mazeBg);

    // Dibujar el laberinto
    for (let row = 0; row < this.maze.length; row++) {
      for (let col = 0; col < this.maze[row].length; col++) {
        const cellValue = this.maze[row][col];
        const x = this.gameArea.x + (col * this.cellSize);
        const y = this.gameArea.y + (row * this.cellSize);

        if (cellValue === 1) {
          // Pared
          const wall = this.add.image(x, y, 'wall');
          wall.setOrigin(0, 0);
          wall.setDisplaySize(this.cellSize, this.cellSize);
          this.mazeGroup.add(wall);
        } else if (cellValue === 2) {
          // Meta
          const goal = this.add.image(x, y, 'goal');
          goal.setOrigin(0, 0);
          goal.setDisplaySize(this.cellSize, this.cellSize);
          this.mazeGroup.add(goal);
        }
      }
    }
  }

  checkGoal() {
    if (!this.character) return false;
    
    // Obtener la posición actual en la cuadrícula
    const gridX = Math.floor((this.character.x - this.gameArea.x) / this.cellSize);
    const gridY = Math.floor((this.character.y - this.gameArea.y) / this.cellSize);
    
    // Verificar si llegó a la meta
    if (this.maze[gridY][gridX] === 2) {
      // Mostrar mensaje de felicitación
      Swal.fire({
        title: '¡Felicitaciones!',
        text: '¡Has completado el laberinto!',
        icon: 'success',
        confirmButtonText: 'Jugar de nuevo',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetGame();
        }
      });
      return true;
    }
    return false;
  }

  tweenCharacter(newX, newY) {
    return new Promise((resolve) => {
      // Verificar si el personaje ya está en movimiento
      if (this.isMoving) {
        resolve(false);
        return;
      }

      this.isMoving = true;
      this.character.play('moving');

      this.tweens.add({
        targets: this.character,
        x: newX,
        y: newY,
        duration: 500,
        ease: 'Linear',
        onComplete: () => {
          this.character.play('idle');
          this.isMoving = false;
          // Verificar si llegó a la meta después de cada movimiento
          this.checkGoal();
          resolve(true);
        }
      });
    });
  }

  resetGame() {
    this.cancelAllTimers();
    this.executionCompleted = true;
    this.currentActionIndex = 0;
    this.actions = [];
    
    // Regresar el personaje a su posición inicial
    if (this.character) {
      const startCell = this.findStartCell();
      this.character.x = this.gameArea.x + (startCell.col * this.cellSize) + (this.cellSize / 2);
      this.character.y = this.gameArea.y + (startCell.row * this.cellSize) + (this.cellSize / 2);
      this.character.play('idle');
    }
    
    // Limpiar el workspace de Blockly
    if (this.blocklyWorkspace) {
      this.blocklyWorkspace.clear();
    }
  }

  cancelAllTimers() {
    if (this.executionTimer) {
      this.time.removeEvent(this.executionTimer);
      this.executionTimer = null;
    }
    this.time.removeAllEvents();
  }

  executeCode() {
    try {
      // Deshabilitar el botón mientras se ejecuta
      if (this.runButton) {
        this.runButton.setInteractive(false);
      }

      // Obtener el código JavaScript generado
      const code = Blockly.JavaScript.workspaceToCode(this.blocklyWorkspace);
      console.log('Código generado:', code);

      // Envolver el código en una función async para poder usar await
      const wrappedCode = `
        async function runCode() {
          try {
            ${code}
          } catch (error) {
            console.error('Error en la ejecución:', error);
          }
        }
        runCode();
      `;

      // Definir las funciones de movimiento en el contexto
      const context = {
        startExecution: () => {
          console.log('Iniciando ejecución');
          this.executionCompleted = false;
          this.currentActionIndex = 0;
          this.executeActionsSequentially();
        },
        moveForward: async () => {
          const newX = this.character.x + this.cellSize;
          if (this.canMoveTo(newX, this.character.y)) {
            await this.tweenCharacter(newX, this.character.y);
            return true;
          }
          return false;
        },
        moveBackward: async () => {
          const newX = this.character.x - this.cellSize;
          if (this.canMoveTo(newX, this.character.y)) {
            await this.tweenCharacter(newX, this.character.y);
            return true;
          }
          return false;
        },
        moveUp: async () => {
          const newY = this.character.y - this.cellSize;
          if (this.canMoveTo(this.character.x, newY)) {
            await this.tweenCharacter(this.character.x, newY);
            return true;
          }
          return false;
        },
        moveDown: async () => {
          const newY = this.character.y + this.cellSize;
          if (this.canMoveTo(this.character.x, newY)) {
            await this.tweenCharacter(this.character.x, newY);
            return true;
          }
          return false;
        }
      };

      // Ejecutar el código con el contexto
      const executeInContext = new Function(...Object.keys(context), wrappedCode);
      executeInContext.bind(this)(...Object.values(context));

    } catch (error) {
      console.error('Error al ejecutar el código:', error);
      this.showMessage('error', 'Error', 'Ocurrió un error al ejecutar el código.');
    } finally {
      // Habilitar el botón cuando termine
      if (this.runButton) {
        this.runButton.setInteractive(true);
      }
    }
  }

  executeActionsSequentially() {
    if (this.executionCompleted) {
      console.log("La ejecución ha sido detenida.");
      return;
    }

    if (this.currentActionIndex >= this.actions.length) {
      console.log("Ejecución completada.");
      this.executionCompleted = true;
      this.isExecuting = false;
      if (this.runButton) {
        this.runButton.setInteractive(true);
      }
      this.showMessage("success", "¡Éxito!", "Programa ejecutado correctamente.");
      return;
    }

    const action = this.actions[this.currentActionIndex];
    console.log(`Ejecutando acción ${this.currentActionIndex + 1}/${this.actions.length}:`, action);

    // Continuar con la siguiente acción
    this.currentActionIndex++;
    setTimeout(() => this.executeActionsSequentially(), 300);
  }

  getMovementDirection(fromX, fromY, toX, toY) {
    if (fromX < toX) return 'right';
    if (fromX > toX) return 'left';
    if (fromY < toY) return 'down';
    if (fromY > toY) return 'up';
    return null;
  }

  canMoveTo(x, y) {
    // Convertir las coordenadas del mundo a coordenadas de la cuadrícula
    const gridX = Math.floor((x - this.gameArea.x) / this.cellSize);
    const gridY = Math.floor((y - this.gameArea.y) / this.cellSize);
    
    // Verificar si las coordenadas están dentro de los límites del laberinto
    if (gridX < 0 || gridX >= this.maze[0].length || gridY < 0 || gridY >= this.maze.length) {
      return false;
    }

    // Verificar si la celda es transitable (0 = camino, 2 = meta)
    return this.maze[gridY][gridX] === 0 || this.maze[gridY][gridX] === 2;
  }

  showMessage(icon, title, text) {
    // Solo registrar en consola
    console.log(`[${icon}] ${title}: ${text}`);
  }

  shutdown() {
    // Detener música
    if (this.bgMusic) {
      this.bgMusic.stop();
    }

    // Resto del código de shutdown...
    this.cancelAllTimers();
    this.executionCompleted = true;

    if (this.tweens) {
      this.tweens.killAll();
    }

    if (this.blocklyDiv) {
      this.blocklyDiv.remove();
      this.blocklyDiv = null;
    }

    if (this.buttonContainer) {
      this.buttonContainer.remove();
      this.buttonContainer = null;
      this.runButton = null;
    }

    if (this.actionText) {
      this.actionText.destroy();
      this.actionText = null;
    }

    this.scale.off('resize', this.handleResize, this);
  }
}
