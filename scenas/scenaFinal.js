class scenaFinal extends Phaser.Scene {
    constructor() {
        super({ key: "scenaFinal" });
    }

    preload() {
        this.load.video("finalVideo", "assets/scenaFinal/Vfinal.mp4", "loadeddata");
    }

    create() {
        const screenWidth = this.sys.game.config.width;
        const screenHeight = this.sys.game.config.height;

        this.sound.stopAll();

        // Fondo negro
        this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000);

        // Añadir y configurar video
        const video = this.add.video(screenWidth / 2, screenHeight / 2, "finalVideo");
        const videoElement = video.video;
        videoElement.muted = false;

        // Ajustar tamaño del video
        video.on("play", () => {
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;

            if (videoWidth && videoHeight) {
                const videoAspectRatio = videoWidth / videoHeight;
                const screenAspectRatio = screenWidth / screenHeight;

                if (videoAspectRatio > screenAspectRatio) {
                    video.setDisplaySize(screenWidth, screenWidth / videoAspectRatio);
                } else {
                    video.setDisplaySize(screenHeight * videoAspectRatio, screenHeight);
                }
            }
        });

        video.play();
    }
}