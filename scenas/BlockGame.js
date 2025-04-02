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
    this.blocklyDiv = null;
    this.buttonContainer = null;
    this.statusPanel = null;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.isMoving = false; // Agregar propiedad para detectar movimiento
    this.isLandscape = false; // Agregar propiedad para detectar orientación
    
    // Definir el laberinto con una sola solución
    this.maze = [
      [1,0, 0, 1, 1, 1, 1, 1],
      [1,1, 0, 1, 0, 0, 1, 1],
      [1,1, 0, 0, 0, 1, 1, 1],
      [1,1, 1, 0, 1, 0, 1, 1],
      [1,1, 0, 0, 0, 0, 1, 1],
      [1,1, 1, 1, 2, 1, 1, 1]
    ];
    
    // Tamaño de cada celda del laberinto
    this.cellSize = 55; // Tamaño intermedio entre 40 y 60
    
    // Posición inicial del personaje en el laberinto
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
    // Detectar si es móvil
    this.isMobile = !this.sys.game.device.os.desktop;
    
    // Añadir imagen de fondo al escenario
    const sceneBg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'scene-background'
    );
    sceneBg.setDisplaySize(
      this.cameras.main.width,
      this.cameras.main.height
    );
    sceneBg.setDepth(-1); // Asegurar que el fondo esté detrás de todo

    // Configurar áreas del juego según el dispositivo
    this.setupGameAreas();

    // Configurar el personaje según el dispositivo
    this.setupCharacter();

    // Resetear el juego para asegurar la posición inicial del personaje
    this.resetGame();

    // Configurar UI responsiva
    this.setupUI();

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

    // Configurar Blockly
    this.setupBlockly();

    // Agregar estilos CSS para personalizaciones generales
    this.addCustomStyles();

    // Escuchar cambios de tamaño de pantalla
    this.scale.on('resize', this.handleResize, this);

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

  setupGameAreas() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Calcular tamaño del laberinto basado en el espacio disponible
    if (this.isMobile) {
      // En móvil, el laberinto va arriba y más pequeño
      this.cellSize = Math.min(45, (height * 0.4) / this.maze.length);
    } else {
      // En PC, mantener tamaño original
      this.cellSize = 55;
    }

    const mazeWidth = this.maze[0].length * this.cellSize;
    const mazeHeight = this.maze.length * this.cellSize;

    // Configurar área de Blockly
    if (!this.blocklyArea) {
      this.blocklyArea = document.createElement('div');
      this.blocklyArea.id = 'blocklyDiv';
      this.blocklyArea.style.position = 'absolute';
      document.body.appendChild(this.blocklyArea);
    }

    // Posicionar elementos según el dispositivo
    if (this.isMobile) {
      // Móvil: Laberinto arriba, Blockly abajo
      this.blocklyArea.style.bottom = '0';
      this.blocklyArea.style.left = '0';
      this.blocklyArea.style.width = '100%';
      this.blocklyArea.style.height = '45%';
      
      // Centrar el laberinto en la parte superior
      const gameAreaX = (width - mazeWidth) / 2;
      const gameAreaY = height * 0.05;
      this.gameArea = new Phaser.Geom.Rectangle(gameAreaX, gameAreaY, mazeWidth, mazeHeight);
    } else {
      // PC: Blockly a la izquierda, laberinto a la derecha
      this.blocklyArea.style.top = '0';
      this.blocklyArea.style.left = '0';
      this.blocklyArea.style.width = '40%';
      this.blocklyArea.style.height = '100%';
      
      // Posicionar el laberinto a la derecha
      const gameAreaX = width * 0.45;
      const gameAreaY = (height - mazeHeight) / 2;
      this.gameArea = new Phaser.Geom.Rectangle(gameAreaX, gameAreaY, mazeWidth, mazeHeight);
    }

    // Recrear el laberinto
    if (this.mazeGroup) {
      this.mazeGroup.clear(true, true);
      this.mazeGroup.destroy(true);
    }

    // Asegurarse de que this.add está disponible antes de crear el grupo
    if (this.add) {
      this.mazeGroup = this.add.group();
      this.createMaze();
    }

    // Actualizar Blockly si existe
    if (this.blocklyWorkspace) {
      Blockly.svgResize(this.blocklyWorkspace);
    }
  }

  createMaze() {
    if (!this.add || !this.mazeGroup) return;

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

  setupUI() {
    // Eliminar contenedor de botones anterior si existe
    if (this.buttonContainer) {
      this.buttonContainer.remove();
    }

    // Crear contenedor para botones
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.id = 'button-container';
    this.buttonContainer.style.position = 'absolute';
    this.buttonContainer.style.display = 'flex';
    this.buttonContainer.style.gap = '10px';
    this.buttonContainer.style.justifyContent = 'center';
    this.buttonContainer.style.alignItems = 'center';
    this.buttonContainer.style.zIndex = '1000';

    // Posicionar botones según el dispositivo
    if (this.isMobile) {
      // En móvil, los botones van entre el laberinto y el área de Blockly
      this.buttonContainer.style.bottom = '46%';
      this.buttonContainer.style.left = '0';
      this.buttonContainer.style.width = '100%';
      this.buttonContainer.style.padding = '5px';
      this.buttonContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    } else {
      // En PC, los botones van centrados debajo del laberinto
      const mazeRight = this.gameArea.x + this.gameArea.width;
      this.buttonContainer.style.left = `${this.gameArea.x}px`;
      this.buttonContainer.style.width = `${this.gameArea.width}px`;
      this.buttonContainer.style.bottom = '20px';
    }

    document.body.appendChild(this.buttonContainer);

    // Crear botones con estilos mejorados
    this.runButton = this.createStyledButton('run-button', 'Ejecutar', () => this.executeCode());
    const resetButton = this.createStyledButton('reset-button', 'Reiniciar', () => this.resetGame());

    this.buttonContainer.appendChild(this.runButton);
    this.buttonContainer.appendChild(resetButton);
  }

  createStyledButton(className, text, onClick) {
    const button = document.createElement('button');
    button.className = `game-button ${className}`;
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${this.isMobile ? '14' : '16'}" height="${this.isMobile ? '14' : '16'}" viewBox="0 0 24 24" fill="white" style="margin-right: 8px; vertical-align: middle;">
        <path d="${className === 'run-button' ? 'M8 5v14l11-7z' : 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z'}"/>
      </svg>
      ${text}
    `;
    button.style.fontSize = this.isMobile ? '12px' : '14px';
    button.style.padding = this.isMobile ? '8px 16px' : '10px 20px';
    button.addEventListener('click', onClick);
    return button;
  }

  setupBlockly() {
    if (!this.blocklyArea) return;

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
    this.blocklyWorkspace = Blockly.inject(this.blocklyArea.id, {
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
        border-top: ${this.isMobile ? '2px solid #ccc' : 'none'};
        box-shadow: ${this.isMobile ? '0 -2px 5px rgba(0,0,0,0.1)' : '2px 0 5px rgba(0,0,0,0.1)'};
        overflow-x: auto;
      }

      /* Estilos base para todos los dispositivos */
      .game-button {
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-transform: uppercase;
        outline: none;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: ${this.isMobile ? '100px' : '120px'};
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
        opacity: 0.7;
      }
      
      .reset-button {
        background: linear-gradient(to bottom, #F44336, #D32F2F);
      }

      /* Estilos específicos para móvil */
      @media (max-width: 768px) {
        .blocklyToolboxDiv {
          width: 60px !important;
        }
        
        .blocklyTreeLabel {
          font-size: 12px !important;
        }
        
        .blocklyText {
          font-size: 12px !important;
        }

        #button-container {
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(5px);
          padding: 5px 0;
        }
      }

      /* Mensaje de orientación */
      .orientation-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 9999;
      }
    `;
    document.head.appendChild(styleElement);
  }

  handleResize(gameSize) {
    // Evitar actualizaciones innecesarias
    if (this.lastWidth === gameSize.width && this.lastHeight === gameSize.height) {
      return;
    }

    this.lastWidth = gameSize.width;
    this.lastHeight = gameSize.height;

    // Solo actualizar si this.add está disponible
    if (this.add) {
      this.setupGameAreas();
      
      // Si el personaje existe, actualizar su posición
      if (this.character) {
        const currentGridX = Math.floor((this.character.x - this.gameArea.x) / this.cellSize);
        const currentGridY = Math.floor((this.character.y - this.gameArea.y) / this.cellSize);
        this.character.x = this.gameArea.x + (currentGridX * this.cellSize) + (this.cellSize / 2);
        this.character.y = this.gameArea.y + (currentGridY * this.cellSize) + (this.cellSize / 2);
      }

      this.setupUI();
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
        this.runButton.disabled = true;
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
        this.runButton.disabled = false;
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
        this.runButton.disabled = false;
        this.runButton.classList.remove('disabled');
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
    // Eliminar mensaje anterior si existe
    const existingMessage = document.getElementById('game-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Crear contenedor del mensaje
    const messageContainer = document.createElement('div');
    messageContainer.id = 'game-message';
    messageContainer.className = icon === 'info' ? 'orientation-message' : 'game-message';

    // Crear contenido del mensaje
    const iconElement = document.createElement('div');
    iconElement.className = 'message-icon';
    iconElement.innerHTML = this.getMessageIcon(icon);

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.margin = '10px 0';
    titleElement.style.color = 'white';

    const textElement = document.createElement('p');
    textElement.textContent = text;
    textElement.style.margin = '5px 0';
    textElement.style.color = 'rgba(255, 255, 255, 0.9)';

    // Añadir elementos al contenedor
    messageContainer.appendChild(iconElement);
    messageContainer.appendChild(titleElement);
    messageContainer.appendChild(textElement);

    // Añadir estilos específicos según el tipo de mensaje
    if (icon === 'info') {
      // Mensaje de orientación
      messageContainer.style.animation = 'fadeInOut 2s ease-in-out infinite';
    } else {
      // Mensaje normal (éxito, error, etc.)
      setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => messageContainer.remove(), 500);
      }, 2000);
    }

    // Añadir el mensaje al documento
    document.body.appendChild(messageContainer);

    // Añadir estilos si no existen
    if (!document.getElementById('message-styles')) {
      const style = document.createElement('style');
      style.id = 'message-styles';
      style.textContent = `
        .game-message {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 15px 25px;
          border-radius: 10px;
          text-align: center;
          z-index: 9999;
          transition: opacity 0.5s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          backdrop-filter: blur(5px);
        }

        .orientation-message {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          backdrop-filter: blur(10px);
        }

        .message-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }

        @keyframes fadeInOut {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .game-message {
            width: 90%;
            padding: 10px 15px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  getMessageIcon(icon) {
    const icons = {
      success: '✅',
      error: '❌',
      info: '🔄',
      warning: '⚠️'
    };
    return icons[icon] || '💡';
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
